/**
 * fix-tests: виявляє падаючі unit-тести і виправляє їх через pi SDK (text mode).
 *
 * Порядок роботи:
 *   1. getFailingTests(dir) — запускає vitest run --reporter=json і повертає
 *      список падаючих файлів з повідомленнями про помилки.
 *   2. fixFailingTests(dir, opts) — для кожного падаючого файлу:
 *        a. Читає поточний вміст тест-файлу та source-файлу
 *        b. callText → отримує виправлений код у ```js блоці
 *        c. writeFileSync → записує файл напряму (без Edit інструментів агента)
 *        d. Повторює до MAX_FIX_ATTEMPTS якщо ще залишились падіння
 *
 * Перехід з callAgent (Edit-інструменти) на callText+write усуває проблему
 * точного матчу рядків що містять URL, backtick-рядки та спецсимволи.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { env } from 'node:process'
import { callText, MEMORY_ERROR_RE } from './lib/pi-client.mjs'
import { budgetFor, capText, packBatch } from './lib/prompt-budget.mjs'
import { findTestRules } from './gen-tests.mjs'
import { parseFailingTests } from './coverage-per-file.mjs'
import { resolveVitestRun } from './lib/vitest-shim.mjs'

const MODEL = env.N_CURSOR_FIX_TESTS_MODEL ?? env.N_CLOUD_MAX_MODEL ?? undefined
const MAX_SRC_BYTES = 4000
const TEST_DIR_MARKERS = ['/tests/', '\\tests\\']
const TEST_FILE_SUFFIX = '.test.mjs'
const SOURCE_FILE_SUFFIX = '.js'
const FILE_MARKER_PREFIX = '<!--'
const FILE_MARKER_SUFFIX = '-->'
const FILE_MARKER_LABEL = 'file:'
const CODE_FENCE_START_RE = /^```(?:js|javascript|mjs|ts)?$/
const CODE_FENCE_END = '```'

/**
 * Infers a source file path from a conventional `tests/<name>.test.mjs` path.
 * @param {string} absPath absolute test file path
 * @returns {string|null} inferred source path or null when convention does not match
 */
function inferSourcePath(absPath) {
  const marker = TEST_DIR_MARKERS.find(item => absPath.includes(item))
  if (!marker || !absPath.endsWith(TEST_FILE_SUFFIX)) return null
  const markerAt = absPath.lastIndexOf(marker)
  const dir = absPath.slice(0, markerAt)
  const stem = absPath.slice(markerAt + marker.length, -TEST_FILE_SUFFIX.length)
  if (!stem || stem.includes('/') || stem.includes('\\')) return null
  return `${dir}${marker[0]}${stem}${SOURCE_FILE_SUFFIX}`
}

/**
 * Parses an HTML file marker from a single LLM response line.
 * @param {string} line response line
 * @returns {string|null} file path from marker or null
 */
function parseFileMarker(line) {
  const trimmed = line.trim()
  if (!trimmed.startsWith(FILE_MARKER_PREFIX) || !trimmed.endsWith(FILE_MARKER_SUFFIX)) return null
  const inner = trimmed.slice(FILE_MARKER_PREFIX.length, -FILE_MARKER_SUFFIX.length).trim()
  if (!inner.startsWith(FILE_MARKER_LABEL)) return null
  const file = inner.slice(FILE_MARKER_LABEL.length).trim()
  return file || null
}

/**
 * Runs vitest in JSON mode and returns failing test files with error messages.
 * @param {string} dir project root
 * @returns {Promise<Array<{file: string, errors: string[]}>>} failing test files with error messages
 */
export async function getFailingTests(dir) {
  const tmpDir = await mkdtemp(join(tmpdir(), '7n-fix-'))
  const outputFile = join(tmpDir, 'results.json')

  const { bin, configArgs } = resolveVitestRun(dir)
  try {
    spawnSync(
      process.execPath,
      [bin, 'run', ...configArgs, '--root', dir, '--reporter=json', `--outputFile=${outputFile}`, '--passWithNoTests'],
      { cwd: dir, stdio: 'inherit', env }
    )

    if (!existsSync(outputFile)) return []

    return parseFailingTests(outputFile, dir)
  } finally {
    try {
      await rm(tmpDir, { recursive: true, force: true })
    } catch {
      /* ignore cleanup errors */
    }
  }
}

/**
 * Extracts the first fenced JavaScript block from LLM text output.
 * @param {string} text LLM response text.
 * @returns {string} Extracted code or an empty string.
 */
function extractCode(text) {
  const start = text.indexOf('```')
  if (start === -1) return ''
  const bodyStart = text.indexOf('\n', start)
  if (bodyStart === -1) return ''
  const end = text.indexOf('\n```', bodyStart + 1)
  if (end === -1) return ''
  return text.slice(bodyStart + 1, end).trim()
}

/**
 * Читає складники секції одного падаючого файлу для промпту.
 * @param {{file: string, errors: string[]}} failure падаючий тест-файл
 * @param {string} [dir] project root
 * @returns {{file: string, errBlock: string, testCode: string, sourceCode: string|null}} сирі частини секції
 */
function readFailureParts({ file, errors }, dir) {
  const absPath = dir ? join(dir, file) : file
  const testCode = existsSync(absPath) ? readFileSync(absPath, 'utf8').slice(0, 6000) : '(файл не знайдено)'
  // Heuristically find source file: strip tests/ prefix from path
  const sourcePath = inferSourcePath(absPath)
  const sourceCode =
    sourcePath && existsSync(sourcePath) ? readFileSync(sourcePath, 'utf8').slice(0, MAX_SRC_BYTES) : null
  return { file, errBlock: errors.join('\n\n'), testCode, sourceCode }
}

/**
 * Складає секцію файлу з готових частин.
 * @param {{file: string, errBlock: string, testCode: string, sourceCode: string|null}} parts частини з `readFailureParts`
 * @returns {string} markdown-секція файлу
 */
function buildFileSection({ file, errBlock, testCode, sourceCode }) {
  return [
    `### \`${file}\``,
    '',
    '**Помилки:**',
    '```',
    errBlock,
    '```',
    '',
    '**Поточний тест-файл:**',
    '```js',
    testCode,
    '```',
    ...(sourceCode ? ['', '**Source (для довідки, не міняй):**', '```js', sourceCode, '```'] : [])
  ].join('\n')
}

/**
 * Builds a prompt to fix one failing test file.
 * Includes current file content so the LLM doesn't need file-read tools.
 * @param {Array<{file: string, errors: string[]}>} failures failing test files
 * @param {string} [dir] project root
 * @returns {string} prompt text for the LLM
 */
export function buildFixTestsPrompt(failures, dir) {
  const testRules = dir ? findTestRules(dir) : null
  const sections = failures.map(f => buildFileSection(readFailureParts(f, dir)))
  return buildPromptShell(sections, testRules)
}

/**
 * Обгортає секції файлів спільними правилами й інструкцією формату відповіді.
 * @param {string[]} sections markdown-секції падаючих файлів
 * @param {string|null} testRules конвенції тестів проєкту
 * @returns {string} повний текст промпту
 */
function buildPromptShell(sections, testRules) {
  return [
    'Виправ падаючі unit-тести. Поверни ПОВНИЙ вміст КОЖНОГО виправленого тест-файлу.',
    '',
    '## Правила:',
    '- Міняй виключно тест-файли — source-файли не чіпай',
    '- Зберігай структуру тестів (describe/it/expect) — НЕ видаляй тести',
    '- Якщо тест перевіряє неіснуючий API — адаптуй до реального',
    '- Файл .mjs = чистий JavaScript, НЕ TypeScript. НІКОЛИ: `as Type`, generics',
    '- `import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "vitest"` — імпортуй ВСЕ що використовуєш',
    '- Замість `fn as vi.Mock` → `vi.mocked(fn)`',
    '- `vi.spyOn(process, "env")` НЕ ПРАЦЮЄ — use `vi.stubEnv("KEY", "val")` + `afterEach(() => vi.unstubAllEnvs())`',
    '- `vi.spyOn(Date).mockReturnValue(...)` НЕ ПРАЦЮЄ з `new Date()` — use `vi.useFakeTimers()` + `vi.setSystemTime(new Date(...))` + `afterEach(() => vi.useRealTimers())`',
    "- `sendMessage` викликає fetch з одним аргументом (URL-рядком) — перевіряй через `expect.stringContaining(...)`, НЕ через об'єктний matcher",
    '- `describe()` callback НЕ може бути async. `await` тільки у: top-level async IIFE, `beforeAll(async () => {})`, або `it(async () => {})`',
    "- `vi.mock` hoisting: фабрика виконується до будь-якого `const`/`let` у модулі. Якщо потрібен спільний mock-об'єкт — оголошуй його через `vi.hoisted()`: `const { mockFn } = vi.hoisted(() => ({ mockFn: vi.fn() }))`; потім використовуй в factory та тестах",
    '- Якщо AssertionError показує `Expected: "A" Received: "B"` — функція реально повертає B. ВИПРАВ expected на точне значення з рядка "Received:", не переосмислюй логіку функції',
    '- Для regex/escape функцій: тестуй по одному символу (`expect(esc("*")).toBe("\\\\*")`), НЕ комбінований рядок — легко помилитись в подвійному екрануванні',
    ...(testRules ? ['', '## Конвенції тестів цього проєкту (.cursor/rules/n-test.mdc):', testRules] : []),
    '',
    '## Падаючі файли:',
    '',
    ...sections,
    '',
    'Для кожного файлу поверни його ПОВНИЙ вміст у блоці:',
    '<!-- file: <шлях до файлу> -->',
    '```js',
    '... повний вміст ...',
    '```'
  ].join('\n')
}

/**
 * Складає промпт під бюджет `budgetFor('fix')`: скільки файлів влазить —
 * стільки в батч (найменші першими), решта — у `deferred` на наступний
 * прохід. Файл, що сам-один перевищує бюджет, отримує соло-промпт із
 * внутрішнім обрізанням (`fitToBudget`: спершу ріжеться source-довідка,
 * потім vitest-помилки; сам тест-код захищений) — ніколи не скипається.
 * @param {Array<{file: string, errors: string[]}>} failures падаючі тест-файли
 * @param {string} [dir] project root
 * @returns {{prompt: string, included: string[], deferred: string[]}} промпт + розподіл файлів
 */
export function buildFixTestsBatch(failures, dir) {
  const testRules = dir ? findTestRules(dir) : null
  const shellOverhead = buildPromptShell([], testRules).length
  const sectionBudget = Math.max(1000, budgetFor('fix').maxPromptChars - shellOverhead)

  const parts = failures.map(f => {
    const p = readFailureParts(f, dir)
    return { ...p, section: buildFileSection(p) }
  })
  const { included, deferred } = packBatch(
    parts.map(p => ({ key: p.file, size: p.section.length })),
    sectionBudget
  )

  if (included.length === 0) {
    // Соло-режим: навіть найменший файл не влазить — жорстко обрізаємо
    // нутрощі секції (source геть, помилки до чверті бюджету, тест-код —
    // найцінніше — до половини), замість мовчазного skip
    const smallest = parts.toSorted((a, b) => a.section.length - b.section.length)[0]
    console.log(`  ⚠ ${smallest.file}: секція завелика (${smallest.section.length} симв.) — соло-виклик з обрізанням`)
    const section = buildFileSection({
      file: smallest.file,
      errBlock: capText(smallest.errBlock, Math.floor(sectionBudget / 4)),
      testCode: capText(smallest.testCode, Math.floor(sectionBudget / 2)),
      sourceCode: null
    })
    return {
      prompt: buildPromptShell([section], testRules),
      included: [smallest.file],
      deferred: failures.map(f => f.file).filter(f => f !== smallest.file)
    }
  }

  const includedSet = new Set(included)
  const sections = parts.filter(p => includedSet.has(p.file)).map(p => p.section)
  return { prompt: buildPromptShell(sections, testRules), included, deferred }
}

/**
 * Parses fenced JavaScript blocks with file markers from LLM response.
 * @param {string} text LLM response text.
 * @returns {Array<{file: string|null, code: string}>} Parsed file/code pairs.
 */
function parseFixedFiles(text) {
  const results = []
  const lines = text.split('\n')

  let lineIndex = 0
  while (lineIndex < lines.length) {
    const file = parseFileMarker(lines[lineIndex])
    if (!file) {
      lineIndex++
      continue
    }

    const fenceStart = lines.findIndex((line, index) => index > lineIndex && CODE_FENCE_START_RE.test(line.trim()))
    if (fenceStart === -1) break

    const fenceEnd = lines.findIndex((line, index) => index > fenceStart && line.trim() === CODE_FENCE_END)
    if (fenceEnd === -1) break

    const code = lines
      .slice(fenceStart + 1, fenceEnd)
      .join('\n')
      .trim()
    if (code) results.push({ file, code })
    lineIndex = fenceEnd + 1
  }

  // Fallback: single unnamed block when only one file is being fixed
  if (results.length === 0) {
    const code = extractCode(text)
    if (code) results.push({ file: null, code })
  }
  return results
}

const MAX_FIX_ATTEMPTS = 3

/**
 * Writes generated fixes to existing test files.
 * @param {Array<{file: string|null, code: string}>} fixed Parsed fixes.
 * @param {Array<{file: string, errors: string[]}>} remaining Current failing files.
 * @param {string} dir Project root.
 * @returns {void}
 */
function writeFixedFiles(fixed, remaining, dir) {
  for (const { file, code } of fixed) {
    let absPath = null
    if (file) {
      absPath = join(dir, file)
    } else if (remaining.length === 1) {
      absPath = join(dir, remaining[0].file)
    }
    if (!absPath) {
      console.error('  ✗ не вдалось визначити файл для запису (немає маркера <!-- file: ... -->)')
      continue
    }
    if (!existsSync(absPath)) {
      console.error(`  ✗ файл не існує: ${relative(dir, absPath)}`)
      continue
    }
    writeFileSync(absPath, code + '\n', 'utf8')
    console.log(`  ✓ Записано: ${relative(dir, absPath)}`)
  }
}

/**
 * Detects and fixes failing tests using pi SDK text mode + direct writeFileSync.
 * Returns immediately with count=0 if all tests are already passing.
 * @param {string} dir project root
 * @param {{
 *   failures?: Array<{file: string, errors: string[]}>,
 *   callTextFn?: (prompt: string, opts?: object) => Promise<string>
 * }} [opts] overrides for callText and pre-fetched failures
 * @returns {Promise<{count: number, fixed: number, remaining: number}>} fix result summary
 */
export async function fixFailingTests(dir, opts = {}) {
  const callTextFn =
    opts.callTextFn ?? (prompt => callText(prompt, { model: MODEL, cwd: dir, maxTokens: budgetFor('fix').maxTokens }))
  const failures = opts.failures ?? (await getFailingTests(dir))

  if (failures.length === 0) return { count: 0, fixed: 0, remaining: 0 }

  console.log(`\n🔧 Виправляю ${failures.length} падаючих test-файлів (pi text mode)...\n`)
  for (const f of failures) {
    console.log(`  • ${f.file} (${f.errors.length} помилок)`)
  }
  console.log()

  let remaining = failures
  const attempts = new Map()
  let prevDeferred = new Set()
  for (;;) {
    // Спроби рахуються per-file (лише коли файл реально був у батчі),
    // тож deferred-черга не з'їдає ліміт файлів, які ще не пробували
    const eligible = remaining
      .filter(f => (attempts.get(f.file) ?? 0) < MAX_FIX_ATTEMPTS)
      // Анти-starvation: відкладені минулого разу файли йдуть першими
      .toSorted((a, b) => (prevDeferred.has(b.file) ? 1 : 0) - (prevDeferred.has(a.file) ? 1 : 0))
    if (eligible.length === 0) break

    const batch = buildFixTestsBatch(eligible, dir)
    if (batch.deferred.length) {
      console.log(`  📦 батч: ${batch.included.length} файлів, відкладено на наступний прохід: ${batch.deferred.length}`)
    }
    for (const file of batch.included) attempts.set(file, (attempts.get(file) ?? 0) + 1)
    prevDeferred = new Set(batch.deferred)

    let response
    try {
      response = await callTextFn(batch.prompt)
    } catch (error) {
      // memory-guard: не звичайна per-file помилка — RAM-стеля фіксована, продовжувати
      // до наступного файлу немає сенсу. Пробиваємо нагору до CLI, аби процес завершився.
      if (MEMORY_ERROR_RE.test(error.message ?? '')) throw error
      console.error(`  ✗ pi помилка: ${error.message}`)
      break
    }

    const fixed = parseFixedFiles(response)

    if (fixed.length === 0) {
      console.error('  ✗ pi не повернула виправлений код')
      break
    }

    const includedSet = new Set(batch.included)
    writeFixedFiles(fixed, eligible.filter(f => includedSet.has(f.file)), dir)

    remaining = await getFailingTests(dir)
  }

  const fixedCount = failures.length - remaining.length

  if (fixedCount > 0) console.log(`✓ Виправлено: ${fixedCount}/${failures.length} файлів`)
  if (remaining.length > 0) console.log(`⚠ Залишились падати: ${remaining.length} файлів`)

  return { count: failures.length, fixed: fixedCount, remaining: remaining.length }
}
