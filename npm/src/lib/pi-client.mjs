/**
 * Programmatic pi client via @earendil-works/pi-coding-agent SDK.
 * Replaces spawnSync('pi', ...) with direct in-process calls.
 *
 * Two modes:
 *   callText(prompt, model?)  — text-only, no tools, returns string
 *   callAgent(prompt, cwd)    — coding tools enabled, writes files directly
 *
 * Both retry transient connection failures (e.g. a shared local model server
 * that's momentarily busy under concurrent load) with exponential backoff
 * instead of failing the caller's file on the first hiccup. A memory-guard
 * rejection (the shared machine can't fit the prompt in RAM) is not
 * retryable — retrying against a fixed RAM ceiling can't succeed, so it
 * prints the request body to stdout and terminates the process instead.
 */
import { createAgentSession, SessionManager, ModelRegistry, AuthStorage } from '@earendil-works/pi-coding-agent'
import { env } from 'node:process'
import { setTimeout as sleep } from 'node:timers/promises'

let _registry = null
/**
 *
 */
async function getRegistry() {
  if (_registry) return _registry
  _registry = ModelRegistry.create(AuthStorage.create())
  return _registry
}

const RETRYABLE_ERROR_RE = /connection error|ECONNREFUSED|ETIMEDOUT|fetch failed|network/i
/** Matches a local model server (e.g. oMLX) rejecting a prompt for lack of RAM. */
export const MEMORY_ERROR_RE = /memory guard|memory limit|prefill would require/i
const MAX_ATTEMPTS = Number(env.N_PI_RETRY_ATTEMPTS) || 4
const BASE_DELAY_MS = Number(env.N_PI_RETRY_DELAY_MS) || 1500
const MAX_DELAY_MS = 15_000

/**
 * Prints the request body that triggered a memory-guard rejection to stdout
 * and throws — there's no RAM to retry into. Callers that own the process
 * lifecycle (CLI entrypoints) must let this propagate uncaught instead of
 * swallowing it like a normal per-file error, so the process exits instead
 * of quietly continuing against a RAM ceiling that won't change.
 * @param {Error} error the memory-guard error thrown by the model server
 * @param {string} requestBody prompt sent to the model
 * @returns {never} always throws
 */
function failOnMemoryGuard(error, requestBody) {
  console.log('--- omlx memory-guard: тіло запиту ---')
  console.log(requestBody)
  console.log(`✗ omlx memory-guard: ${error.message}`)
  throw new Error(`omlx memory-guard: ${error.message}`)
}

/**
 * Retries `fn` with exponential backoff + jitter when it throws a transient
 * connection-ish error (shared local model server busy/restarting); other
 * errors (auth, malformed request) are re-thrown immediately. A memory-guard
 * rejection throws via `failOnMemoryGuard` instead of retrying — see its docs.
 * @template T
 * @param {() => Promise<T>} fn operation to retry
 * @param {string} requestBody prompt sent to the model, printed if a memory-guard error terminates the process
 * @returns {Promise<T>} result of the first successful attempt
 */
async function withRetry(fn, requestBody) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (MEMORY_ERROR_RE.test(error.message ?? '')) failOnMemoryGuard(error, requestBody)
      if (attempt >= MAX_ATTEMPTS || !RETRYABLE_ERROR_RE.test(error.message ?? '')) throw error
      const delay = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS)
      const jitter = delay * (0.5 + Math.random() * 0.5)
      await sleep(jitter)
    }
  }
}

/**
 * Sends a single prompt to pi in text mode (no tools) and returns the response.
 * Reads auth/model config from ~/.pi/ same as the CLI.
 * @param {string} prompt
 * @param {object} [opts]
 * @param {string} [opts.cwd]
 * @param {string} [opts.model] provider/model-id passed to pi (e.g. "openai/gpt-4o"); omit for pi default
 * @returns {Promise<string>}
 */
export async function callText(prompt, opts = {}) {
  return withRetry(async () => {
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
      const resolved = provider ? registry.find(provider, modelId) : null
      sessionOpts.modelRegistry = registry
      sessionOpts.model = resolved ?? opts.model
    }
    const { session } = await createAgentSession(sessionOpts)

    await session.prompt(prompt)

    const state = session.state
    const last = state.messages.at(-1)
    if (!last || last.role !== 'assistant') return ''
    if (last.stopReason === 'error' || last.stopReason === 'aborted') {
      throw new Error(`pi error: ${last.errorMessage ?? last.stopReason}`)
    }
    return last.content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('')
  }, prompt)
}

/**
 * Sends a prompt to pi in agent mode with full coding tools (read/write/bash/edit).
 * The agent writes test files directly — no need to parse output.
 * @param {string} prompt
 * @param {string} cwd project root where files should be written
 * @returns {Promise<void>}
 */
export async function callAgent(prompt, cwd) {
  return withRetry(async () => {
    const { session } = await createAgentSession({
      tools: ['read', 'write', 'edit', 'bash', 'grep', 'find', 'ls'],
      sessionManager: SessionManager.inMemory(cwd),
      cwd
    })

    await session.prompt(prompt)
  }, prompt)
}
