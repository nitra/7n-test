/**
 * Test generation via pi SDK with per-export tiered routing.
 *
 * Strategy:
 *   1. Classify each export: trivial/simple → local pi model first, complex → cloud.
 *   2. Generate a shared header (imports, mocks, setup) via cloud.
 *   3. Generate per-export describe() blocks routed by complexity.
 *   4. Validate local-generated blocks; fall back to cloud on anti-patterns.
 *   5. Merge header + blocks → write test file.
 *
 * Local model is selected via opts.localModel or N_LOCAL_MIN_MODEL env var.
 * All calls (local and cloud) go through the pi SDK — no direct HTTP to omlx.
 * Falls back to single-file cloud generation when no local model is configured
 * or when extractExportsWithComplexity() returns no exports.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, relative, dirname } from 'node:path'
import { callText, MEMORY_ERROR_RE } from './lib/llm.mjs'
import { env } from 'node:process'
import { budgetFor } from '@7n/llm-lib/prompt-budget'
import { startChain } from '@7n/llm-lib/chain'
import { resolveVitestRun } from './lib/vitest-shim.mjs'
import { extractExportsWithComplexity } from './classify-exports.mjs'
import { analyzeModule } from './lib/ast-analyze.mjs'
import { probeModule, probeFetchCalls, probeTimeVariants, probeHelpers } from './lib/runtime-probe.mjs'

const MAX_SRC_BYTES = 6000

/**
 * Reads a source file and trims it to the prompt budget.
 * @param {string} absPath absolute source path
 * @returns {string} source snippet or empty string when unavailable
 */
function readSourceSnippet(absPath) {
  if (!existsSync(absPath)) return ''
  const content = readFileSync(absPath, 'utf8')
  return content.length > MAX_SRC_BYTES ? `${content.slice(0, MAX_SRC_BYTES)}\n...(truncated)` : content
}

// ---------------------------------------------------------------------------
// Static regex constants (prefer-static-regex)
// ---------------------------------------------------------------------------

const FILE_EXT_RE = /\.[^.]+$/
const CODE_BLOCK_RE = /```(?:js|javascript|mjs|ts)?\n([\s\S]*?)```/
const FRONTMATTER_RE = /^---[\s\S]*?---\n/
const REQUIRE_CALL_RE = /\brequire\s*\(/
const JEST_ACCESS_RE = /\bjest\./
const AS_VI_MOCK_RE = /\bas\s+vi\.Mock/
const AS_JEST_MOCK_RE = /\bas\s+jest\.Mock/
const MOCK_TYPE_RE = /:\s*\w*Mock\b/
const FETCH_CALL_RE = /\bfetch\s*\(/
const TIME_DEPS_RE = /\bnew\s+Date\b|\bgetHours\b|\bgetDay\b|\bgetMinutes\b|\bDate\.now\b/
const VITEST_FAIL_RE = /Failed Tests|FAIL /
const EXPECTED_LINE_RE = /Expected:\s+"([^"]+)"/
const RECEIVED_LINE_RE = /Received:\s+"([^"]+)"/
const TO_CONTAIN_RE = /to contain '([^='\s]+)=([^']+)'/
const NOT_CONTAIN_RE = /not to contain '([^']+)'/
const FLAG_CONTAIN_RE = /to contain '([^'=]+)=true'/

/**
 * @callback PiCallFn
 * @param {string} prompt LLM prompt
 * @param {{cwd?: string, model?: string}} [options] call options
 * @returns {Promise<string>} LLM response text
 */

/**
 * @callback GenerateOneFn
 * @param {{file: string, pct: number, reason: string}} fileInfo file coverage info
 * @param {string} dir project root
 * @returns {Promise<string|null>} written test path or null
 */

/**
 * @typedef {object} GenerateTestsOptions
 * @property {PiCallFn} [callText] - Custom cloud caller.
 * @property {string|null} [localModel] - Local model id; null forces cloud-only mode.
 * @property {GenerateOneFn} [generateOne] - Custom single-file generator.
 */

// ---------------------------------------------------------------------------
// Helpers shared across strategies
// ---------------------------------------------------------------------------

/**
 * Extracts names of exported symbols from JS/TS source.
 * @param {string} content source text
 * @returns {string[]} exported symbol names
 */
function extractExports(content) {
  return Array.from(content.matchAll(/^export\s+(?:async\s+)?(?:const|function|class|let)\s+(\w+)/gm), m => m[1])
}

/** Detects top-level function calls that run as side-effects on module load. */
const TOP_LEVEL_CALL_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/m

/**
 * Test file candidates relative to source file.
 * Primary: tests/ subdirectory (per n-test.mdc convention).
 * @param {string} file relative source path
 * @returns {string[]} candidate test file paths
 */
function testCandidates(file) {
  const base = file.replace(FILE_EXT_RE, '')
  const lastSlash = base.lastIndexOf('/')
  const name = lastSlash === -1 ? base : base.slice(lastSlash + 1)
  const dir = lastSlash === -1 ? '' : base.slice(0, lastSlash)
  const testsDir = dir ? `${dir}/tests` : 'tests'
  return [`${testsDir}/${name}.test.mjs`, `${base}.test.mjs`, `${base}.test.js`]
}

/**
 * Extracts the first fenced JS block from LLM text output.
 * @param {string} text LLM output
 * @returns {string} extracted code or empty string
 */
function extractCode(text) {
  const m = CODE_BLOCK_RE.exec(text)
  if (m) return m[1].trim()
  const start = text.indexOf('```')
  if (start === -1) return ''
  const bodyStart = text.indexOf('\n', start)
  if (bodyStart === -1) return ''
  const end = text.indexOf('\n```', bodyStart + 1)
  if (end === -1) return ''
  return text.slice(bodyStart + 1, end).trim()
}

/**
 * Checks whether source text calls or declares a symbol by name.
 * @param {string} text source text to search
 * @param {string} name symbol name to look for
 * @returns {boolean} true when the symbol is invoked
 */
function hasInvocation(text, name) {
  return text.includes(`${name}(`)
}

/**
 * Finds the project's n-test.mdc rules by walking up from dir (max 4 levels).
 * @param {string} dir project root
 * @returns {string|null} rules text or null
 */
export function findTestRules(dir) {
  let current = dir
  for (let i = 0; i < 4; i++) {
    const candidate = join(current, '.cursor/rules/n-test.mdc')
    if (existsSync(candidate)) {
      return readFileSync(candidate, 'utf8').replace(FRONTMATTER_RE, '').trim()
    }
    const parent = dirname(current)
    if (parent === current) break
    current = parent
  }
  return null
}

/**
 * Resolves importPath and testFilePath for a source file relative to its test.
 * @param {string} file relative source path
 * @returns {{testFilePath: string, importPath: string}} resolved paths
 */
function resolveTestPaths(file) {
  const testFilePath = testCandidates(file)[0]
  const testDir = dirname(testFilePath)
  const rel = relative(testDir, file)
  const importPath = rel.startsWith('.') ? rel : `./${rel}`
  return { testFilePath, importPath }
}

// ---------------------------------------------------------------------------
// Validation helpers for per-export blocks
// ---------------------------------------------------------------------------

/**
 * Returns true when a LLM-generated describe block passes basic quality checks.
 * Used to decide whether to accept local output or escalate to cloud.
 * @param {string} block describe block text
 * @returns {boolean} true when the block looks valid
 */
function isValidBlock(block) {
  if (!block?.trim()) return false
  if (!block.includes('describe(')) return false
  if (REQUIRE_CALL_RE.test(block)) return false
  if (JEST_ACCESS_RE.test(block)) return false
  if (AS_VI_MOCK_RE.test(block)) return false
  if (AS_JEST_MOCK_RE.test(block)) return false
  return !MOCK_TYPE_RE.test(block)
}

/**
 * Combines a shared header with individual describe() blocks.
 * Strips stray import lines that models sometimes add to blocks.
 * @param {string} header shared test header
 * @param {string[]} blocks describe blocks
 * @returns {string | null} merged file content or `null`
 */
function mergeBlocks(header, blocks) {
  if (!header?.trim()) return null
  const clean = blocks
    .filter(Boolean)
    .map(b =>
      b
        .replaceAll(/^import\s[^;]+;?\n?/gm, '')
        .replaceAll(/^\/\/ .+\n/gm, '')
        .trim()
    )
    .filter(Boolean)
  if (clean.length === 0) return null
  return [header.trim(), '', ...clean].join('\n\n')
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

/**
 * @typedef {object} HeaderPromptOptions
 * @property {string} file source file path
 * @property {string} testFilePath generated test file path
 * @property {string} importPath import path from test to source
 * @property {boolean} hasSideEffects whether source runs top-level side effects
 * @property {string} content source snippet
 * @property {string[]} exports exported symbol names
 * @property {string|null} testRules project test rules
 * @property {object|null} astInfo static AST analysis result
 */

/**
 * Builds the header prompt. Accepts pre-computed AST info so mock shapes are
 * derived deterministically — the LLM only fills in vi.stubEnv calls.
 * @param {HeaderPromptOptions} opts header prompt options
 * @returns {string} header prompt text
 */
function buildHeaderPrompt(opts) {
  const { file, testFilePath, importPath, hasSideEffects, content, exports, testRules, astInfo } = opts
  const mockLines = astInfo?.externalMocks?.map(m => m.mockLine) ?? []
  const envReads = astInfo?.envReads ?? []
  const usesFetch = astInfo?.usesFetch ?? FETCH_CALL_RE.test(content)

  const importLine = hasSideEffects
    ? `const { ${exports.join(', ')} } = await import("${importPath}")`
    : `import { ${exports.join(', ')} } from "${importPath}"`

  const envStubHints = envReads.length
    ? envReads.map(k => `  vi.stubEnv("${k}", "test_value")`)
    : ['  // vi.stubEnv("KEY", "value") — для env-змінних що читає модуль']

  const hasTimeDependency = TIME_DEPS_RE.test(content)
  const timerHints = hasTimeDependency
    ? ['  vi.useFakeTimers()', '  vi.setSystemTime(new Date("2024-01-01T02:00:00"))']
    : ['  // vi.useFakeTimers() + vi.setSystemTime(...) — якщо є new Date()']

  const template = [
    `import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"`,
    '',
    ...(mockLines.length ? mockLines : ['// vi.mock("pkg", () => ({ fn: vi.fn() }))']),
    '',
    importLine,
    ...(usesFetch ? ['', 'const mockFetch = vi.fn()'] : []),
    '',
    'beforeEach(() => {',
    '  vi.clearAllMocks()',
    ...(usesFetch
      ? [
          '  vi.stubGlobal("fetch", mockFetch)',
          '  mockFetch.mockResolvedValue({ status: 200, json: async () => ({}) })'
        ]
      : []),
    ...envStubHints,
    ...timerHints,
    '})',
    '',
    'afterEach(() => {',
    '  vi.restoreAllMocks()',
    '  vi.unstubAllGlobals()',
    '  vi.unstubAllEnvs()',
    '  vi.useRealTimers()',
    '})'
  ].join('\n')

  const internalNote = astInfo?.internalNames?.length
    ? `Внутрішні (НЕ-exported, НЕ імітувати): ${astInfo.internalNames.join(', ')}`
    : ''

  return [
    `Заповни template header для unit-тест файлу (без describe/it блоків).`,
    `Тест-файл: \`${testFilePath}\`  Source: \`${file}\``,
    '',
    'TEMPLATE — vi.mock рядки вже точні (з AST). Заповни лише vi.stubEnv і vi.useFakeTimers де потрібно:',
    '```js',
    template,
    '```',
    '',
    'ПРАВИЛА:',
    `- Імпортуй з \`${importPath}\` — НЕ змінюй розширення, НЕ підміняй цей модуль`,
    `- Exports: ${exports.join(', ')}`,
    ...(internalNote ? [internalNote] : []),
    '- vi.mock() factories вже прописані вище — НЕ додавай нових',
    'Поверни лише код у ```js … ```',
    ...(testRules ? ['', '## Конвенції проєкту:', testRules] : []),
    '',
    `Source (${file}):`,
    '```js',
    content || '(недоступно)',
    '```'
  ].join('\n')
}

/**
 * Extracts the source of a top-level (non-exported) declaration by name.
 * @param {string} content module source
 * @param {string} name declaration name
 * @returns {string|null} declaration source or null if not found
 */
function extractInternalSource(content, name) {
  const prefixes = [`const ${name} =`, `let ${name} =`, `var ${name} =`, `function ${name}(`, `async function ${name}(`]
  let start = -1
  for (const prefix of prefixes) {
    const direct = content.indexOf(prefix)
    if (direct !== -1 && (start === -1 || direct < start)) start = direct
    const lineStart = content.indexOf(`\n${prefix}`)
    if (lineStart !== -1) {
      const candidate = lineStart + 1
      if (start === -1 || candidate < start) start = candidate
    }
  }
  if (start === -1) return null
  const after = content.slice(start)
  const markers = ['\nconst ', '\nlet ', '\nvar ', '\nfunction ', '\nasync function ', '\nexport ']
  let end = -1
  for (const marker of markers) {
    const idx = after.indexOf(marker)
    if (idx !== -1 && (end === -1 || idx < end)) end = idx
  }
  return after.slice(0, end === -1 ? Math.min(after.length, 600) : end)
}

const COMPLEXITY_HINTS = {
  trivial: 'константа, 1-2 прості перевірки',
  simple: 'чиста функція',
  complex: 'async/fetch/Date/env'
}

/**
 * Describes the generation budget implied by export complexity.
 * @param {string} complexity export complexity bucket
 * @returns {string} human-readable complexity hint
 */
function describeExportComplexity(complexity) {
  return COMPLEXITY_HINTS[complexity] ?? COMPLEXITY_HINTS.complex
}

/**
 * Extracts the source fragment relevant to one export.
 * @param {string} content module source
 * @param {string} name exported symbol name
 * @returns {string} narrowed source snippet
 */
function extractExportSnippet(content, name) {
  const exportPrefixes = [
    `export async function ${name}`,
    `export function ${name}`,
    `export async const ${name}`,
    `export const ${name}`,
    `export let ${name}`,
    `export class ${name}`
  ]
  let startAt = -1
  let startLen = 0
  for (const prefix of exportPrefixes) {
    const direct = content.indexOf(prefix)
    if (direct !== -1 && (startAt === -1 || direct < startAt)) {
      startAt = direct
      startLen = prefix.length
    }
  }
  if (startAt === -1) return content
  const after = content.slice(startAt + startLen)
  const nextExport = after.indexOf('\nexport ')
  const end = nextExport === -1 ? Math.min(after.length, 2000) : nextExport
  return content.slice(startAt, startAt + startLen) + after.slice(0, end)
}

/**
 * Formats runtime-probe results for the block prompt.
 * @param {string} name export name
 * @param {object} probeResults probe results by export name
 * @returns {string[]} prompt lines
 */
function buildProbeLines(name, probeResults) {
  const probeSection = probeResults?.[name]
  if (Array.isArray(probeSection) && probeSection.length) {
    return [
      '',
      `Реальні виходи \`${name}\` (runtime-probe — використовуй для expected, не вгадуй):`,
      ...probeSection.map(p => `- ${name}(${p.input}) → ${p.output}`)
    ]
  }
  if (probeSection?.constant !== undefined) {
    return ['', `Реальне значення \`${name}\`: ${probeSection.constant}`]
  }
  return []
}

/**
 * Formats fetch capture results for the block prompt.
 * @param {string} name export name
 * @param {object} fetchProbe captured fetch calls by export name
 * @returns {string[]} prompt lines
 */
function buildFetchLines(name, fetchProbe) {
  const fetchCalls = fetchProbe?.[name]
  return fetchCalls?.length
    ? [
        '',
        `Реальні fetch-виклики \`${name}\` (перехоплено під час probe — використовуй для assert URL):`,
        ...fetchCalls.map(c => `- args ${c.args} → fetch("${c.url}"${c.init ? ', init' : ''})`)
      ]
    : []
}

/**
 * Formats time-variant probe results for the block prompt.
 * @param {string} name export name
 * @param {object} timeProbe time-variant probe results by export name
 * @returns {string[]} prompt lines
 */
function buildTimeLines(name, timeProbe) {
  const timeVariant = timeProbe?.[name]
  return timeVariant
    ? [
        '',
        `Часова залежність \`${name}\` (виходи змінюються залежно від години):`,
        ...Object.entries(timeVariant).map(([h, v]) => `- ${h.toString().padStart(2, '0')}:00 → ${v}`)
      ]
    : []
}

/**
 * Formats helper introspection results for the block prompt.
 * @param {string} content module source
 * @param {string} snippet narrowed source snippet
 * @param {string[]} internalNames internal top-level names
 * @param {object} helperProbe internal helper probe results by helper name
 * @returns {string[]} prompt lines
 */
function buildHelperLines(content, snippet, internalNames, helperProbe) {
  const usedHelpers = internalNames.filter(name => hasInvocation(snippet, name))
  const helperSources = usedHelpers
    .map(name => extractInternalSource(content, name))
    .filter(Boolean)
    .slice(0, 3)
  const helperLines = usedHelpers.flatMap(name => {
    const calls = helperProbe?.[name]
    if (!calls?.length) return []
    return [
      '',
      `Реальні виходи internal helper \`${name}\` (НЕ імітувати, лише розуміти):`,
      ...calls.slice(0, 4).map(c => `- ${name}(${JSON.stringify(c.params)}) → ${JSON.stringify(c.result)}`)
    ]
  })
  return helperSources.length
    ? [
        '',
        'Internal helpers (контекст для розуміння params/API — НЕ імітувати):',
        '```js',
        ...helperSources,
        '```',
        ...helperLines
      ]
    : helperLines
}

/**
 * Builds the prompt for a single describe() block for one export.
 * @param {object} opts block prompt options
 * @param {{name: string, complexity: string}} opts.exp export metadata
 * @param {string} opts.testFilePath generated test file path
 * @param {string} opts.importPath import path from test to source
 * @param {string} opts.content source snippet
 * @param {string} opts.header generated shared test header
 * @param {string|null} opts.testRules project test rules
 * @param {object} opts.probeResults runtime probe results by export name
 * @param {object} opts.fetchProbe captured fetch calls by export name
 * @param {object} opts.timeProbe time variant probe results by export name
 * @param {object} opts.helperProbe internal helper probe results by helper name
 * @param {object|null} opts.astInfo static AST analysis result
 * @returns {string} block prompt text
 */
function buildBlockPrompt(opts) {
  const {
    exp,
    testFilePath,
    importPath,
    content,
    header,
    testRules,
    probeResults,
    fetchProbe,
    timeProbe,
    helperProbe,
    astInfo
  } = opts
  const snippet = extractExportSnippet(content, exp.name)
  const internalNames = astInfo?.internalNames ?? []

  return [
    `Тест-файл: \`${testFilePath}\`  Source import: \`"${importPath}"\``,
    '',
    'Header вже написано (НЕ дублюй import/beforeEach/afterEach):',
    '```js',
    header,
    '```',
    '',
    `Напиши ЛИШЕ \`describe("${exp.name}", () => { … })\` для \`${exp.name}\`.`,
    `Складність: ${exp.complexity} — ${describeExportComplexity(exp.complexity)}`,
    ...buildProbeLines(exp.name, probeResults),
    ...buildFetchLines(exp.name, fetchProbe),
    ...buildTimeLines(exp.name, timeProbe),
    ...buildHelperLines(content, snippet, internalNames, helperProbe),
    '',
    'Правила (СУВОРО):',
    '- Без import, без beforeEach — тільки describe',
    '- ESM only (без require), vi.* (без jest.*)',
    '- vi.mocked(fn) замість type-кастингу',
    '- toBe для примітивів, toEqual для обʼєктів/масивів',
    '- `describe()` callback НЕ може бути async — `await` тільки у top-level, `beforeAll(async()=>{})`, або `it(async()=>{})`',
    "- НЕ використовуй vi.spyOn на ESM-exports — це неможливо (`Cannot spy on export`). Для перевірки виклику fetch використовуй `mockFetch.mock.calls[0][0]` (URL) та `mockFetch.mock.calls[0][1]` (init-об'єкт або undefined)",
    '- fetch завжди викликається як `fetch(url, undefined)` — `toHaveBeenCalledWith` ПРОВАЛИТЬСЯ (2 аргументи). ЗАВЖДИ перевіряй URL через `expect(mockFetch.mock.calls[0][0]).toContain(pattern)` або `.toBe(url)` — НЕ `toHaveBeenCalledWith`',
    '- `expect(str).stringContaining(x)` та `expect(str).not.stringContaining(x)` НЕ існують в Vitest — використовуй `expect(str).toContain(pattern)` та `expect(str).not.toContain(pattern)`',
    '- НЕ створюй окремий mock-спай для тестованої функції — вона вже реальна. Стеж тільки за `mockFetch`',
    '- `formData.get("document")` повертає `File` об\'єкт, НЕ рядок — для перевірки імені файлу: `formData.get("document").name`',
    '- `vi.useFakeTimers()` БЕЗ `vi.setSystemTime(...)` заморожує час на ЗАРАЗ (поточна година) — якщо функція залежить від часу доби, обовʼязково встанови фіксований час: `vi.setSystemTime(new Date("2024-01-01T00:00:00"))` (північ, поза робочими годинами)',
    '- При тестуванні params — перевіряй РЕАЛЬНІ назви полів з internal helpers (наприклад, `disable_notification`, НЕ `silent`)',
    '- Поверни лише describe-блок у ```js … ```',
    ...(testRules ? ['', '## Конвенції:', testRules.slice(0, 1500)] : []),
    '',
    `Source (${exp.name}):`,
    '```js',
    snippet,
    '```'
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Block validation via real vitest run
// ---------------------------------------------------------------------------

const LOCAL_MAX_ATTEMPTS = 3
const CLOUD_MAX_ATTEMPTS = 10

/**
 * Runs a single describe block (merged with header) in vitest.
 * Writes a temp file inside testDir so relative imports and vitest's include
 * pattern both resolve correctly. Cleans up after the run.
 * @param {string} header shared test file header
 * @param {string} block describe block to validate
 * @param {string} dir project root (cwd for vitest, for config resolution)
 * @param {string} testDir directory where the real test file would live
 * @returns {{ passed: boolean, errors: string }} vitest result
 */
function runBlock(header, block, dir, testDir) {
  const code = mergeBlocks(header, [block])
  if (!code) return { passed: false, errors: 'mergeBlocks failed' }

  const { bin, configArgs } = resolveVitestRun(dir)
  mkdirSync(testDir, { recursive: true })
  const tmpFile = join(testDir, '.7n-validate.test.mjs')
  try {
    writeFileSync(tmpFile, code + '\n', 'utf8')
    const result = spawnSync(
      process.execPath,
      [bin, 'run', ...configArgs, '--root', dir, '--reporter=verbose', tmpFile],
      { cwd: dir, encoding: 'utf8', timeout: 30_000, env: process.env }
    )
    if (result.status === 0) return { passed: true, errors: '' }
    const out = (result.stdout ?? '') + (result.stderr ?? '')
    // Extract only the failure section to keep context short
    const lines = out.split('\n')
    const failIdx = lines.findIndex(l => VITEST_FAIL_RE.test(l))
    const relevant = failIdx === -1 ? out : lines.slice(failIdx).join('\n')
    return { passed: false, errors: relevant.slice(0, 3000) }
  } finally {
    try {
      rmSync(tmpFile)
    } catch {
      /* ignore if already gone */
    }
  }
}

/**
 * Detects common env/timer anti-patterns from vitest error output.
 * Pattern-based, project-agnostic — parses Expected/Received from vitest output.
 * Returns root-cause hints to inject into the retry prompt.
 * @param {string} errors vitest error output
 * @returns {string[]} hint messages
 */
function detectStaleRootCause(errors) {
  const hints = []

  // Extract structured Expected/Received lines from vitest output
  const expectedMatch = errors.match(EXPECTED_LINE_RE)
  const receivedMatch = errors.match(RECEIVED_LINE_RE)
  const _expected = expectedMatch?.[1] ?? ''
  const received = receivedMatch?.[1] ?? ''

  // Pattern 1: expected param=X, but received param=test_value (global stub conflict)
  // e.g. expected 'param=12345', received '...param=test_value...'
  const toContainMatch = errors.match(TO_CONTAIN_RE)
  if (toContainMatch && received.includes(`${toContainMatch[1]}=test_value`) && toContainMatch[2] !== 'test_value') {
    const [, param, wantedVal] = toContainMatch
    hints.push(
      `ПРИЧИНА: "${param}=" у результаті має значення "test_value" (зі stubEnv у beforeEach), а не "${wantedVal}".`,
      `Щоб перевірити конкретне значення — додай vi.stubEnv("ENV_KEY", "${wantedVal}") всередині it-блоку перед викликом.`,
      `Або змінить assert на .toContain("${param}=test_value") якщо конкретне значення не важливе.`
    )
  }

  // Pattern 2: not.toContain(X) fails → X always present (global stub makes it so)
  const notContainMatch = errors.match(NOT_CONTAIN_RE)
  if (notContainMatch && received.includes(notContainMatch[1])) {
    hints.push(
      `ПРИЧИНА: "${notContainMatch[1]}" завжди присутній у результаті — швидше за все через глобальний vi.stubEnv у beforeEach.`,
      `Видали цей тест або перевірте умову при якій "${notContainMatch[1]}" не з'являється.`
    )
  }

  // Pattern 3: expected to contain 'flag=true' but absent → conditional/time-based logic
  const flagMatch = errors.match(FLAG_CONTAIN_RE)
  if (flagMatch && !received.includes(`${flagMatch[1]}=true`)) {
    hints.push(
      `ПРИЧИНА: "${flagMatch[1]}=true" не з'являється — це умовний параметр (залежить від часу, env або стану).`,
      `Якщо залежить від часу — встанови фіксований час у it-блоці: vi.setSystemTime(new Date("2024-01-01T02:00:00")).`,
      `Якщо залежить від env — stub відповідну змінну перед викликом.`
    )
  }

  return hints
}

/**
 * Wraps the original block prompt with vitest error feedback for a retry.
 * When rootCauseHints are provided (stale error detected), injects them before the error.
 * @param {string} originalPrompt initial block prompt
 * @param {string} prevBlock previous describe block
 * @param {string} errors vitest error output
 * @param {number} attempt current attempt number
 * @param {string[]} rootCauseHints stale-error diagnostic hints
 * @returns {string} retry prompt text
 */
function buildRetryPrompt(originalPrompt, prevBlock, errors, attempt, rootCauseHints = []) {
  const hintsSection = rootCauseHints.length
    ? ['', '### Аналіз причини (не ігноруй — помилка повторюється):', ...rootCauseHints.map(h => `- ${h}`)]
    : []

  return [
    originalPrompt,
    '',
    '---',
    `## Спроба ${attempt}: попередній блок не пройшов vitest`,
    '',
    'Твій попередній варіант:',
    '```js',
    prevBlock,
    '```',
    '',
    'Помилки vitest:',
    '```',
    errors,
    '```',
    ...hintsSection,
    '',
    'Поверни виправлений describe-блок у ```js … ```'
  ].join('\n')
}

const STALE_THRESHOLD = 2

/**
 * Builds retry diagnostics for repeated vitest failures.
 * @param {string|null} lastErrors previous error text
 * @param {string|null} prevErrorSig previous stable error signature
 * @param {number} staleCount current repeated-error counter
 * @param {string} label display name for logging
 * @returns {{staleCount: number, prevErrorSig: string|null, rootCauseHints: string[]}} retry diagnostics
 */
function buildRetryDiagnostics(lastErrors, prevErrorSig, staleCount, label) {
  const errorSig = lastErrors?.slice(0, 120) ?? null
  const nextStaleCount = errorSig && errorSig === prevErrorSig ? staleCount + 1 : 0
  const rootCauseHints = nextStaleCount >= STALE_THRESHOLD ? detectStaleRootCause(lastErrors ?? '') : []
  if (rootCauseHints.length) {
    console.log(`    ${label} ⚡ stale error (${nextStaleCount}x) — root cause hints injected`)
  }
  return { staleCount: nextStaleCount, prevErrorSig: errorSig, rootCauseHints }
}

/**
 * Converts an LLM exception into loop-control state.
 * @param {Error} error caught LLM error
 * @param {number} attempt current attempt number
 * @param {number} maxAttempts retry limit
 * @param {string} label display name for logging
 * @returns {{stop: boolean, lastErrors: string|null}} loop-control state
 */
function resolveLoopCallFailure(error, attempt, maxAttempts, label) {
  // memory-guard: не звичайна per-file помилка — RAM-стеля фіксована, продовжувати
  // до наступного файлу немає сенсу. Пробиваємо нагору до CLI, аби процес завершився.
  if (MEMORY_ERROR_RE.test(error.message ?? '')) throw error
  console.log(`    ${label} ✗ LLM error (спроба ${attempt}): ${error.message}`)
  if (attempt >= maxAttempts) return { stop: true, lastErrors: null }
  return { stop: false, lastErrors: `LLM error: ${error.message}` }
}

/**
 * Generates a describe block with a run → feedback loop.
 * On each vitest failure feeds the error back into the next prompt.
 * @param {string} basePrompt initial block prompt
 * @param {PiCallFn} callFn LLM caller (async)
 * @param {object} callOpts options forwarded to callFn
 * @param {string} header shared test file header
 * @param {string} dir project root (cwd for vitest)
 * @param {string} testDir directory where real test file lives (for relative imports)
 * @param {string} label display name for logging
 * @param {number} maxAttempts cap on retry iterations
 * @param {string|null} seedBlock block from a prior tier (starts loop pre-seeded)
 * @param {string|null} seedErrors errors from a prior tier (shown on attempt 1)
 * @returns {Promise<{ block: string|null, lastBlock: string|null, lastErrors: string|null }>} generation result
 */
async function generateBlockWithLoop(
  basePrompt,
  callFn,
  callOpts,
  header,
  dir,
  testDir,
  label,
  maxAttempts = CLOUD_MAX_ATTEMPTS,
  seedBlock = null,
  seedErrors = null
) {
  let lastBlock = seedBlock
  let lastErrors = seedErrors
  let staleCount = 0
  let prevErrorSig = null // first 120 chars — stable signature for sameness

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const diagnostics = buildRetryDiagnostics(lastErrors, prevErrorSig, staleCount, label)
    staleCount = diagnostics.staleCount
    prevErrorSig = diagnostics.prevErrorSig

    const prompt =
      lastErrors && lastBlock
        ? buildRetryPrompt(basePrompt, lastBlock, lastErrors, attempt, diagnostics.rootCauseHints)
        : basePrompt

    let resp
    try {
      resp = await callFn(prompt, callOpts)
    } catch (error) {
      const failure = resolveLoopCallFailure(error, attempt, maxAttempts, label)
      if (failure.stop) break
      lastErrors = failure.lastErrors
      continue
    }

    const block = extractCode(resp)
    if (!(await isValidBlock(block))) {
      console.log(`    ${label} ✗ invalid block (спроба ${attempt}) → retry`)
      lastBlock = block || lastBlock
      lastErrors =
        'Блок не містить валідного describe() або має синтаксичну помилку — поверни лише describe-блок у ```js … ```'
      continue
    }

    const { passed, errors } = runBlock(header, block, dir, testDir)
    if (passed) {
      if (attempt > 1) console.log(`    ${label} ✓ passed (спроба ${attempt}/${maxAttempts})`)
      return { block, lastBlock: null, lastErrors: null }
    }

    console.log(`    ${label} ✗ vitest fail (спроба ${attempt}/${maxAttempts})`)
    lastBlock = block
    lastErrors = errors
  }

  console.log(`    ${label} ⚠ ${maxAttempts} спроб вичерпано`)
  return { block: null, lastBlock, lastErrors }
}

// ---------------------------------------------------------------------------
// Per-export generation
// ---------------------------------------------------------------------------

/**
 * Runs best-effort static analysis without interrupting generation.
 * @param {string} content source snippet
 * @returns {Promise<object|null>} AST analysis result or null
 */
async function analyzeSourceModule(content) {
  try {
    return await analyzeModule(content)
  } catch {
    return null
  }
}

/**
 * Collects runtime probe data used to ground per-export prompts.
 * @param {string} absPath absolute source path
 * @param {string[]} exports exported symbol names
 * @param {string} content source snippet
 * @param {object|null} astInfo static AST analysis result
 * @returns {object} runtime probe context
 */
function buildProbeContext(absPath, exports, content, astInfo) {
  const envKeys = astInfo?.envReads ?? []
  return {
    probeResults: exports.length ? probeModule(absPath, exports, envKeys) : {},
    fetchProbe: astInfo?.usesFetch ? probeFetchCalls(absPath, exports, envKeys) : {},
    timeProbe: TIME_DEPS_RE.test(content) ? probeTimeVariants(absPath, exports, envKeys) : {},
    helperProbe: astInfo?.internalNames?.length ? probeHelpers(absPath, astInfo.internalNames, envKeys) : {}
  }
}

/**
 * Prepares source, static analysis and probes for per-export generation.
 * @param {{file: string, pct: number, reason: string}} fileInfo file coverage info
 * @param {string} dir project root
 * @returns {Promise<object>} per-export generation context
 */
async function buildPerExportContext(fileInfo, dir) {
  const { file } = fileInfo
  const absPath = join(dir, file)
  const content = readSourceSnippet(absPath)
  const { testFilePath, importPath } = resolveTestPaths(file)
  const hasSideEffects = content.length > 0 && TOP_LEVEL_CALL_RE.test(content)
  const exports = extractExports(content)
  const exportsWithComplexity = extractExportsWithComplexity(content)
  const testRules = findTestRules(dir)
  const astInfo = await analyzeSourceModule(content)

  return {
    file,
    testFilePath,
    importPath,
    content,
    hasSideEffects,
    exports,
    exportsWithComplexity,
    testRules,
    astInfo,
    ...buildProbeContext(absPath, exports, content, astInfo)
  }
}

/**
 * Generates the shared test header through the cloud model.
 * @param {object} ctx per-export generation context
 * @param {string} dir project root
 * @param {PiCallFn} callTextFn cloud LLM caller
 * @returns {Promise<string|null>} generated header or null
 */
async function generateSharedHeader(ctx, dir, callTextFn) {
  const { file, testFilePath, importPath, hasSideEffects, content, exports, testRules, astInfo } = ctx
  try {
    const headerResp = await callTextFn(
      buildHeaderPrompt({ file, testFilePath, importPath, hasSideEffects, content, exports, testRules, astInfo }),
      { cwd: dir, maxTokens: budgetFor('header').maxTokens }
    )
    const header = extractCode(headerResp)
    if (header) return header
    console.error(`  ✗ cloud не повернув header для ${file}`)
  } catch (error) {
    if (MEMORY_ERROR_RE.test(error.message ?? '')) throw error
    console.error(`  ✗ cloud header error: ${error.message}`)
  }
  return null
}

/**
 * Attempts local generation for simple exports and prepares cloud seed context.
 * @param {object} opts local generation options
 * @returns {Promise<{block: string|null, lastBlock: string|null, lastErrors: string|null}>} local result
 */
async function generateLocalBlock(opts) {
  const { exp, blockPrompt, header, dir, testDir, callLocalFn, isSimple } = opts
  if (!isSimple || !callLocalFn) return { block: null, lastBlock: null, lastErrors: null }

  console.log(`    ${exp.name} (${exp.complexity}) → local [max ${LOCAL_MAX_ATTEMPTS}]`)
  const result = await generateBlockWithLoop(
    blockPrompt,
    callLocalFn,
    { maxTokens: budgetFor('block').maxTokens },
    header,
    dir,
    testDir,
    `${exp.name} [local]:`,
    LOCAL_MAX_ATTEMPTS
  )
  if (result.block) return { block: result.block, lastBlock: null, lastErrors: null }

  // Only seed cloud with lastBlock if it's a valid block structure.
  // An invalid block as seed causes cascade invalid blocks in cloud.
  const lastBlock = result.lastBlock && isValidBlock(result.lastBlock) ? result.lastBlock : null
  console.log(`    ${exp.name} ✗ local exhausted → cloud (з seed-контекстом)`)
  return { block: null, lastBlock, lastErrors: result.lastErrors }
}

/**
 * Generates a block through the cloud tier, optionally seeded by local output.
 * @param {object} opts cloud generation options
 * @returns {Promise<string|null>} generated describe block or last usable block
 */
async function generateCloudBlock(opts) {
  const { exp, blockPrompt, header, dir, testDir, callTextFn, isSimple, seed } = opts
  const tier = isSimple ? 'cloud fallback' : 'cloud'
  console.log(`    ${exp.name} (${exp.complexity}) → ${tier} [max ${CLOUD_MAX_ATTEMPTS}]`)
  const result = await generateBlockWithLoop(
    blockPrompt,
    callTextFn,
    { cwd: dir, maxTokens: budgetFor('block').maxTokens },
    header,
    dir,
    testDir,
    `${exp.name} [cloud]:`,
    CLOUD_MAX_ATTEMPTS,
    seed.lastBlock,
    seed.lastErrors
  )
  return result.block ?? result.lastBlock
}

/**
 * Generates a single export describe block using local-first tiering when available.
 * @param {object} exp export complexity metadata
 * @param {object} ctx per-export generation context including header
 * @param {string} dir project root
 * @param {string} testDir directory where the real test file lives
 * @param {PiCallFn} callTextFn cloud LLM caller
 * @param {PiCallFn} callLocalFn local LLM caller
 * @returns {Promise<string|null>} generated describe block or null
 */
async function generateExportBlock(exp, ctx, dir, testDir, callTextFn, callLocalFn) {
  const isSimple = exp.complexity === 'trivial' || exp.complexity === 'simple'
  const blockPrompt = buildBlockPrompt({ exp, ...ctx })
  const seed = await generateLocalBlock({ exp, blockPrompt, header: ctx.header, dir, testDir, callLocalFn, isSimple })
  if (seed.block) return seed.block
  return generateCloudBlock({ exp, blockPrompt, header: ctx.header, dir, testDir, callTextFn, isSimple, seed })
}

/**
 * Writes the merged generated test file.
 * @param {string} dir project root
 * @param {string} testFilePath generated test file path
 * @param {string} code merged test code
 * @param {string[]} blocks generated describe blocks
 * @returns {string} written test path
 */
function writeGeneratedTest(dir, testFilePath, code, blocks) {
  const testPath = join(dir, testFilePath)
  mkdirSync(dirname(testPath), { recursive: true })
  writeFileSync(testPath, code + '\n', 'utf8')
  console.log(`  ✓ Записано: ${relative(dir, testPath)} (${blocks.length} блоків)`)
  return testPath
}

/**
 * Generates a test file using per-export tiered routing:
 *   - Cloud for shared header
 *   - Local → cloud fallback for trivial/simple exports
 *   - Cloud directly for complex exports
 * @param {{file: string, pct: number, reason: string}} fileInfo file coverage info
 * @param {string} dir project root
 * @param {PiCallFn} callTextFn cloud LLM caller
 * @param {PiCallFn} callLocalFn local LLM caller
 * @returns {Promise<string|null>} written test path or null
 */
async function generatePerExport(fileInfo, dir, callTextFn, callLocalFn) {
  const ctx = await buildPerExportContext(fileInfo, dir)

  console.log(`    header → cloud`)
  const header = await generateSharedHeader(ctx, dir, callTextFn)
  if (!header) return null

  const blocks = []
  const testDir = dirname(join(dir, ctx.testFilePath))
  const blockCtx = { ...ctx, header }
  for (const exp of ctx.exportsWithComplexity) {
    const block = await generateExportBlock(exp, blockCtx, dir, testDir, callTextFn, callLocalFn)
    if (block) blocks.push(block)
  }

  const code = mergeBlocks(header, blocks)
  if (!code) {
    console.error(`  ✗ merge failed for ${ctx.file}`)
    return null
  }

  return writeGeneratedTest(dir, ctx.testFilePath, code, blocks)
}

// ---------------------------------------------------------------------------
// Single-file (fallback) generation
// ---------------------------------------------------------------------------

/**
 * Builds a display-only summary prompt (used in tests).
 * @param {Array<{file: string, pct: number, reason: string}>} files files to summarize
 * @param {string} dir project root
 * @returns {string} summary prompt text
 */
export function buildGenTestsPrompt(files, dir) {
  return files
    .map(({ file, pct, reason }) => {
      const absPath = join(dir, file)
      const content = readSourceSnippet(absPath)
      return (
        `### \`${file}\` (покриття: ${pct.toFixed(1)}%)\n` +
        (reason ? `Причина: ${reason}\n\n` : '') +
        (content ? `\`\`\`js\n${content}\n\`\`\`` : '(вміст недоступний)')
      )
    })
    .join('\n\n')
}

/**
 * Builds the single-file prompt (fallback when per-export unavailable).
 * @param {{file: string, pct: number, reason: string}} fileInfo file coverage info
 * @param {string} dir project root
 * @returns {string} single-file generation prompt
 */
function buildSingleFilePrompt(fileInfo, dir) {
  const { file, pct: _pct, reason } = fileInfo
  const absPath = join(dir, file)
  const content = readSourceSnippet(absPath)

  const exports = extractExports(content)
  const hasSideEffects = content.length > 0 && TOP_LEVEL_CALL_RE.test(content)

  const existingTestFile = testCandidates(file).find(c => existsSync(join(dir, c)))
  let existingSection = ''
  if (existingTestFile) {
    const tc = readFileSync(join(dir, existingTestFile), 'utf8')
    existingSection = `\n\nІснуючий тест (доповни):\n\`\`\`js\n${tc.slice(0, 3000)}\n\`\`\``
  }

  const { testFilePath, importPath } = resolveTestPaths(file)

  const exportsLine =
    exports.length > 0
      ? `Тестуй ЛИШЕ публічний API (exports): ${exports.join(', ')}`
      : 'Тестуй лише публічні (exported) функції — не приватні деталі реалізації'

  const sideEffectsSection = hasSideEffects
    ? [
        '',
        'УВАГА: модуль має side-effect при завантаженні (виклик функції на рівні модуля).',
        'Встанови env/мок ДО import і використовуй dynamic import:',
        '```js',
        'process.env.KEY = "value"',
        `const { fn } = await import("${importPath}")`,
        '```'
      ]
    : []

  const testRules = findTestRules(dir)

  return [
    `Напиши unit-тест у файл \`${testFilePath}\` для джерела \`${file}\`.`,
    `КРИТИЧНО — імпорт source: \`"${importPath}"\` (тест у \`${testFilePath}\`, source у \`${file}\`)`,
    reason ? `Причина: ${reason}` : '',
    '',
    'Правила (СУВОРО):',
    '- Перший рядок: `import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "vitest"` — включай ЛИШЕ те що реально використовуєш',
    '- Імітуй залежності: `vi.mock("module", () => ({ fn: vi.fn() }))` + `vi.mocked(fn)`',
    '- НІКОЛИ `jest.*`, НІКОЛИ `require()`',
    `- ${exportsLine}`,
    '- Файл .mjs = чистий JavaScript, НЕ TypeScript. НІКОЛИ: `as Type`, `: TypeName`, generics',
    '- Замість `fn as vi.Mock` → `vi.mocked(fn)`',
    '- `vi.spyOn(process, "env")` НЕ ПРАЦЮЄ — для env: `vi.stubEnv("KEY", "val")` + `afterEach(() => vi.unstubAllEnvs())`',
    '- `vi.spyOn(Date).mockReturnValue(...)` НЕ ПРАЦЮЄ з `new Date()` — для часу: `vi.useFakeTimers()` + `vi.setSystemTime(new Date(...))` + `afterEach(() => vi.useRealTimers())`',
    `- Шлях до source файлу відносно тест-файлу: \`${importPath}\` (НЕ \`${file}\`)`,
    '- `describe()` callback НЕ може бути async — `await` тільки у top-level, `beforeAll(async()=>{})`, або `it(async()=>{})`',
    '- Для regex/escape функцій: НЕ ВГАДУЙ складний expected рядок. Тестуй один символ за раз де результат очевидний: `expect(esc("*")).toBe("\\\\*")`, `expect(esc("!")).toBe("\\\\!")`',
    '- Поверни ЛИШЕ код тесту у блоці ```js ... ``` — без пояснень',
    ...sideEffectsSection,
    ...(testRules ? ['', '## Конвенції тестів цього проєкту (.cursor/rules/n-test.mdc):', testRules] : []),
    '',
    `Джерело (\`${file}\`):`,
    '```js',
    content || '(недоступно)',
    '```',
    existingSection
  ]
    .filter(Boolean)
    .join('\n')
}

/**
 * Generates a test file for a single source file using the cloud LLM.
 * @param {{file: string, pct: number, reason: string}} fileInfo file coverage info
 * @param {string} dir project root
 * @param {PiCallFn} callTextFn cloud LLM caller
 * @returns {Promise<string|null>} written test path or null
 */
async function generateOneTest(fileInfo, dir, callTextFn) {
  const prompt = buildSingleFilePrompt(fileInfo, dir)
  let response
  try {
    response = await callTextFn(prompt, { cwd: dir, maxTokens: budgetFor('single-file').maxTokens })
  } catch (error) {
    if (MEMORY_ERROR_RE.test(error.message ?? '')) throw error
    console.error(`  ✗ pi помилка для ${fileInfo.file}: ${error.message}`)
    return null
  }
  const code = extractCode(response)
  if (!code) {
    console.error(`  ✗ pi не повернула код для ${fileInfo.file}`)
    return null
  }
  const testPath = join(dir, testCandidates(fileInfo.file)[0])
  mkdirSync(dirname(testPath), { recursive: true })
  writeFileSync(testPath, code + '\n', 'utf8')
  console.log(`  ✓ Записано: ${relative(dir, testPath)}`)
  return testPath
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolves the effective local model id.
 * @param {GenerateTestsOptions} opts generation options
 * @returns {string | null} local model id or null for cloud-only mode
 */
function resolveLocalModel(opts) {
  if (opts.localModel !== undefined) return opts.localModel
  return env.N_LOCAL_MIN_MODEL ?? null
}

/**
 * Handles one file inside the outer generation loop.
 * @param {{file: string, pct: number, reason: string}} fileInfo file coverage info
 * @param {string} dir project root
 * @param {PiCallFn} callTextFn cloud LLM caller
 * @param {PiCallFn | null} localFn local LLM caller
 * @param {GenerateOneFn | undefined} generateOne custom single-file generator
 * @param {typeof startChain} [makeChain] фабрика ланцюжка (інжект для тестів)
 * @returns {Promise<void>} resolves after generation for this file completes
 */
async function generateTestsForFile(fileInfo, dir, callTextFn, localFn, generateOne, makeChain = startChain) {
  console.log(`  → ${fileInfo.file} (${fileInfo.pct.toFixed(1)}%)`)

  if (generateOne) {
    await generateOne(fileInfo, dir)
    return
  }

  // Ланцюжок файлу: усі виклики (header, per-export local/cloud спроби,
  // vitest-retry, length-retry) — кроки одного chain.
  const chain = makeChain({ kind: 'test-generate', unit: fileInfo.file, cwd: dir })
  const chainedCloud = (prompt, callOpts = {}) => callTextFn(prompt, { ...callOpts, chain })
  const chainedLocal = localFn ? (prompt, callOpts = {}) => localFn(prompt, { ...callOpts, chain }) : null
  let failed = null
  try {
    const exportsInfo = extractExportsWithComplexity(readSourceSnippet(join(dir, fileInfo.file)))
    if (chainedLocal && exportsInfo.length > 0) {
      await generatePerExport(fileInfo, dir, chainedCloud, chainedLocal)
      return
    }

    await generateOneTest(fileInfo, dir, chainedCloud)
  } catch (error) {
    failed = String(error.message ?? error).slice(0, 200)
    throw error
  } finally {
    chain.end({ outcome: failed ? 'fail' : 'success', extra: failed ? { error: failed } : {} })
  }
}

/**
 * Generates tests for all given files.
 * Uses per-export tiered routing when local LLM is available;
 * falls back to single-file cloud generation otherwise.
 * @param {Array<{file: string, pct: number, reason: string}>} files files to generate tests for
 * @param {string} dir project root
 * @param {GenerateTestsOptions} [opts] generation options
 * @returns {Promise<void>} resolves after all requested files are processed
 */
export async function generateTests(files, dir, opts = {}) {
  if (files.length === 0) return

  const callTextFn = opts.callText ?? callText
  const localModel = resolveLocalModel(opts)
  const localFn = localModel
    ? (prompt, opts = {}) => callTextFn(prompt, { ...opts, model: localModel, cwd: dir })
    : null

  const mode = localFn ? `per-export (local:${localModel} + cloud)` : 'single-file (cloud)'
  console.log(`\n🤖 Генерую тести для ${files.length} файлів [${mode}]...\n`)

  for (const fileInfo of files) {
    await generateTestsForFile(fileInfo, dir, callTextFn, localFn, opts.generateOne)
  }
}
