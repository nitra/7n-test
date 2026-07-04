/**
 * Programmatic pi client via `@earendil-works/pi-coding-agent` SDK.
 * Replaces spawnSync('pi', ...) with direct in-process calls.
 *
 * Two modes:
 *   callText(prompt, model?)  — text-only, no tools, returns string
 *   callAgent(prompt, cwd)    — coding tools enabled, writes files directly
 *
 * Both retry transient connection failures (e.g. a shared local model server
 * that's momentarily busy under concurrent load) with exponential backoff
 * instead of failing the caller's file on the first hiccup. A memory-guard
 * rejection gets its own longer bounded backoff: oMLX (local model server)
 * одночасно, тож відмова зазвичай відображає залишкову пам'ять попереднього
 * запиту, яку сервер вивільняє сам за десятки секунд. Лише після
 * `N_PI_MEMORY_RETRY_ATTEMPTS` невдач тіло запиту друкується в stdout і
 * помилка прокидається як термінальна (виклики-власники процесу мають дати
 * їй впасти, не ковтати як звичайну per-file помилку).
 */
import { createAgentSession, SessionManager, ModelRegistry, AuthStorage } from '@earendil-works/pi-coding-agent'
import { randomInt } from 'node:crypto'
import { env } from 'node:process'
import { setTimeout as sleep } from 'node:timers/promises'

let _registry = null
/**
 * Повертає або ініціалізує спільний model registry для поточного процесу.
 * @returns {object} спільний registry
 */
function getRegistry() {
  if (_registry) return _registry
  _registry = ModelRegistry.create(AuthStorage.create())
  return _registry
}

const RETRYABLE_ERROR_RE = /connection error|ECONNREFUSED|ETIMEDOUT|fetch failed|network/i
const OMLX_CODE_RE = /"(?:omlx_)?code"\s*:\s*"([^"]+)"/
const OMLX_ESTIMATED_BYTES_RE = /"estimated_bytes"\s*:\s*(\d+)/
const OMLX_LIMIT_BYTES_RE = /"limit_bytes"\s*:\s*(\d+)/
/** Matches a local model server (e.g. oMLX) rejecting a prompt for lack of RAM. */
export const MEMORY_ERROR_RE = /memory guard|memory limit|prefill would require/i
const MAX_ATTEMPTS = Number(env.N_PI_RETRY_ATTEMPTS) || 4
const BASE_DELAY_MS = Number(env.N_PI_RETRY_DELAY_MS) || 1500
const MAX_DELAY_MS = 15_000
/** Скільки разів пробуємо промпт, відкинутий memory guard (включно з першою спробою). */
const MEMORY_MAX_ATTEMPTS = Number(env.N_PI_MEMORY_RETRY_ATTEMPTS) || 3
/** Базова затримка перед повтором після memory-guard відмови (експоненційно: 15s → 30s → …). */
const MEMORY_BASE_DELAY_MS = Number(env.N_PI_MEMORY_RETRY_DELAY_MS) || 15_000
const MEMORY_MAX_DELAY_MS = 60_000

/**
 * Витягує структуровані поля oMLX-помилки з тексту повідомлення, якщо тіло
 * 400 (`omlx_code`/`estimated_bytes`/`limit_bytes`) потрапило в message.
 * `estimated_bytes`/`limit_bytes` — байти GPU/Metal-пам'яті сервера,
 * ТІЛЬКИ для діагностики й логів (не «скільки символів промпту зрізати»).
 * @param {string} message текст помилки від SDK/сервера
 * @returns {{omlxCode?: string, estimatedBytes?: number, limitBytes?: number} | null} знайдені поля або `null`
 */
function parseOmlxErrorDetails(message) {
  const code = OMLX_CODE_RE.exec(message)?.[1]
  const estimated = OMLX_ESTIMATED_BYTES_RE.exec(message)?.[1]
  const limit = OMLX_LIMIT_BYTES_RE.exec(message)?.[1]
  if (!code && !estimated && !limit) return null
  const details = {}
  if (code) details.omlxCode = code
  if (estimated) details.estimatedBytes = Number(estimated)
  if (limit) details.limitBytes = Number(limit)
  return details
}

/**
 * Розпізнає memory-guard відмову і збагачує помилку структурованими полями
 * (`omlxCode`, `estimatedBytes`, `limitBytes`), коли вони доступні в message.
 * @param {Error} error помилка з виклику моделі
 * @returns {boolean} `true`, якщо це memory-guard відмова
 */
function isMemoryGuardError(error) {
  const details = parseOmlxErrorDetails(error.message ?? '')
  if (details) Object.assign(error, details)
  return error.omlxCode === 'prefill_memory_exceeded' || MEMORY_ERROR_RE.test(error.message ?? '')
}

/**
 * Термінальний вихід після вичерпання memory-retry: друкує тіло запиту в
 * stdout (лише тут — не на проміжних спробах) і кидає помилку далі,
 * зберігаючи структуровані поля й оригінал у `cause`. Виклики-власники
 * процесу (CLI) мають дати їй впасти, не ковтати як per-file помилку.
 * @param {Error} error memory-guard помилка останньої спроби
 * @param {string} requestBody промпт, надісланий моделі
 * @returns {never} завжди кидає
 */
function failOnMemoryGuard(error, requestBody) {
  console.log('--- omlx memory-guard: тіло запиту ---')
  console.log(requestBody)
  console.log(`✗ omlx memory-guard: ${error.message}`)
  const wrapped = new Error(`omlx memory-guard: ${error.message}`, { cause: error })
  for (const key of ['omlxCode', 'estimatedBytes', 'limitBytes']) {
    if (error[key] !== undefined) wrapped[key] = error[key]
  }
  throw wrapped
}

/**
 * Retries `fn` with exponential backoff + jitter when it throws a transient
 * connection-ish error (shared local model server busy/restarting); other
 * errors (auth, malformed request) are re-thrown immediately. A memory-guard
 * rejection has its own bounded schedule (`MEMORY_MAX_ATTEMPTS` спроб,
 * затримки від `MEMORY_BASE_DELAY_MS` експоненційно): одно-слотова черга
 * oMLX вивільняє залишкову пам'ять попереднього запиту сама, тож повтор
 * того самого промпту після паузи легітимний. Після вичерпання —
 * `failOnMemoryGuard` (друк тіла + термінальний throw).
 * @template T
 * @param {() => Promise<T>} fn operation to retry
 * @param {string} requestBody prompt sent to the model, printed if a memory-guard error exhausts its retries
 * @returns {Promise<T>} result of the first successful attempt
 */
async function withRetry(fn, requestBody) {
  let memoryAttempts = 0
  let connAttempts = 0
  for (;;) {
    try {
      return await fn()
    } catch (error) {
      if (isMemoryGuardError(error)) {
        memoryAttempts++
        if (memoryAttempts >= MEMORY_MAX_ATTEMPTS) failOnMemoryGuard(error, requestBody)
        const delay = Math.min(MEMORY_BASE_DELAY_MS * 2 ** (memoryAttempts - 1), MEMORY_MAX_DELAY_MS)
        await sleep(delay * (0.5 + randomInt(5000) / 10000))
        continue
      }
      connAttempts++
      if (connAttempts >= MAX_ATTEMPTS || !RETRYABLE_ERROR_RE.test(error.message ?? '')) throw error
      const delay = Math.min(BASE_DELAY_MS * 2 ** (connAttempts - 1), MAX_DELAY_MS)
      const jitter = delay * (0.5 + randomInt(5000) / 10000)
      await sleep(jitter)
    }
  }
}

/**
 * Стеля відповіді моделі для подвоєння на `stopReason: 'length'` — межа
 * `maxTokens` реєстру для локальної моделі (див. `~/.pi/agent/models.json`).
 */
const MAX_TOKENS_CEILING = 32_768

/**
 * Обгортає `session.agent.streamFn`, додаючи per-call `maxTokens` у
 * options LLM-виклику. SDK не має публічного per-call параметра
 * (спайк: `session.prompt(text, options)` не прокидає options у loop
 * config), але `options.maxTokens` у streamFn перекриває дефолт моделі —
 * перевірено на дроті через myllm-проксі (`max_completion_tokens`
 * змінюється).
 * @param {object} session сесія з `createAgentSession`
 * @param {number} maxTokens стеля відповіді для всіх викликів цієї сесії
 * @returns {void}
 */
function applyMaxTokens(session, maxTokens) {
  const orig = session.agent.streamFn
  session.agent.streamFn = (model, context, options) => orig(model, context, { ...options, maxTokens })
}

/**
 * Sends a single prompt to pi in text mode (no tools) and returns the response.
 * Reads auth/model config from ~/.pi/ same as the CLI.
 * @param {string} prompt текст запиту для моделі
 * @param {object} [opts] додаткові параметри виклику
 * @param {string} [opts.cwd] робоча директорія для session
 * @param {string} [opts.model] provider/model-id для pi (наприклад, "openai/gpt-4o"); без значення — default pi
 * @param {number} [opts.maxTokens] стеля відповіді для цього виклику (перекриває дефолт моделі);
 *   на `stopReason: 'length'` (обрізана генерація) виклик повторюється один раз із подвоєною стелею
 * @returns {Promise<string>} текстова відповідь моделі
 */
export async function callText(prompt, opts = {}) {
  const result = await withRetry(async () => {
    const cwd = opts.cwd ?? process.cwd()
    const sessionOpts = {
      tools: [],
      sessionManager: SessionManager.inMemory(cwd),
      cwd
    }
    if (opts.model) {
      const registry = await getRegistry()
      const slashIdx = opts.model.indexOf('/')
      const provider = slashIdx === -1 ? null : opts.model.slice(0, slashIdx)
      const modelId = slashIdx === -1 ? opts.model : opts.model.slice(slashIdx + 1)
      const resolved = provider ? Reflect.apply(registry.find, registry, [provider, modelId]) : null
      sessionOpts.modelRegistry = registry
      sessionOpts.model = resolved ?? opts.model
    }
    const { session } = await createAgentSession(sessionOpts)
    if (opts.maxTokens) applyMaxTokens(session, opts.maxTokens)
    try {
      await session.prompt(prompt)

      const state = session.state
      const last = state.messages.at(-1)
      if (!last || last.role !== 'assistant') return { text: '', truncated: false }
      if (last.stopReason === 'error' || last.stopReason === 'aborted') {
        throw new Error(`pi error: ${last.errorMessage ?? last.stopReason}`)
      }
      return {
        text: last.content
          .filter(c => c.type === 'text')
          .map(c => c.text)
          .join(''),
        truncated: last.stopReason === 'length'
      }
    } finally {
      session.dispose()
    }
  }, prompt)

  // Обрізана генерація зі зниженою стелею — не палимо retry-цикли колера
  // на «invalid block», а один раз повторюємо з подвоєною стелею.
  if (result.truncated && opts.maxTokens && opts.maxTokens < MAX_TOKENS_CEILING && !opts._lengthRetried) {
    const doubled = Math.min(opts.maxTokens * 2, MAX_TOKENS_CEILING)
    console.log(`  ⚠ відповідь обрізана (stopReason: length) — повтор із maxTokens ${opts.maxTokens} → ${doubled}`)
    return callText(prompt, { ...opts, maxTokens: doubled, _lengthRetried: true })
  }
  return result.text
}

/**
 * Sends a prompt to pi in agent mode with full coding tools (read/write/bash/edit).
 * The agent writes test files directly — no need to parse output.
 * @param {string} prompt текст завдання для агента
 * @param {string} cwd робоча директорія, куди агент може писати файли
 * @returns {Promise<void>} проміс завершується після виконання агента
 */
export function callAgent(prompt, cwd) {
  return withRetry(async () => {
    const { session } = await createAgentSession({
      tools: ['read', 'write', 'edit', 'bash', 'grep', 'find', 'ls'],
      sessionManager: SessionManager.inMemory(cwd),
      cwd
    })

    try {
      await session.prompt(prompt)
    } finally {
      session.dispose()
    }
  }, prompt)
}
