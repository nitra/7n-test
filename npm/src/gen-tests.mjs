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
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'
import { callText } from './lib/pi-client.mjs'
import { extractExportsWithComplexity } from './classify-exports.mjs'

const MAX_SRC_BYTES = 6000

// ---------------------------------------------------------------------------
// Helpers shared across strategies
// ---------------------------------------------------------------------------

/** Extracts names of exported symbols from JS/TS source. */
function extractExports(content) {
  return [...content.matchAll(/^export\s+(?:async\s+)?(?:const|function|class|let)\s+(\w+)/gm)].map(m => m[1])
}

/** Detects top-level function calls that run as side-effects on module load. */
const TOP_LEVEL_CALL_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/m

/**
 * Test file candidates relative to source file.
 * Primary: tests/ subdirectory (per n-test.mdc convention).
 */
function testCandidates(file) {
  const base = file.replace(/\.[^.]+$/, '')
  const lastSlash = base.lastIndexOf('/')
  const name = lastSlash === -1 ? base : base.slice(lastSlash + 1)
  const dir = lastSlash === -1 ? '' : base.slice(0, lastSlash)
  const testsDir = dir ? `${dir}/tests` : 'tests'
  return [`${testsDir}/${name}.test.mjs`, `${base}.test.mjs`, `${base}.test.js`]
}

/** Extracts the first ```js…``` block from LLM text output. */
function extractCode(text) {
  const match = text.match(/```(?:js|javascript|mjs|ts)?\n([\s\S]*?)```/)
  return match ? match[1].trim() : ''
}

/**
 * Finds the project's n-test.mdc rules by walking up from dir (max 4 levels).
 * @param {string} dir project root
 * @returns {string|null}
 */
export function findTestRules(dir) {
  let current = dir
  for (let i = 0; i < 4; i++) {
    const candidate = join(current, '.cursor/rules/n-test.mdc')
    if (existsSync(candidate)) {
      return readFileSync(candidate, 'utf8')
        .replace(/^---[\s\S]*?---\n/, '')
        .trim()
    }
    const parent = dirname(current)
    if (parent === current) break
    current = parent
  }
  return null
}

/** Resolves importPath and testFilePath for a source file relative to its test. */
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
 */
function isValidBlock(block) {
  if (!block?.trim()) return false
  if (!block.includes('describe(')) return false
  if (/\brequire\s*\(/.test(block)) return false
  if (/\bjest\./.test(block)) return false
  if (/\bas\s+vi\.Mock/.test(block)) return false
  if (/\bas\s+jest\.Mock/.test(block)) return false
  if (/:\s*\w*Mock\b/.test(block)) return false // TypeScript annotation remnants
  return true
}

/**
 * Combines a shared header with individual describe() blocks.
 * Strips stray import lines that models sometimes add to blocks.
 */
function mergeBlocks(header, blocks) {
  if (!header?.trim()) return null
  const clean = blocks
    .filter(Boolean)
    .map(b =>
      b
        .replace(/^import\s[^;]+;?\n?/gm, '')
        .replace(/^\/\/ .+\n/gm, '')
        .trim()
    )
    .filter(Boolean)
  if (clean.length === 0) return null
  return [header.trim(), '', ...clean].join('\n\n')
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

/** Builds the prompt for generating the shared header (no describe blocks). */
function buildHeaderPrompt({ file, testFilePath, importPath, hasSideEffects, content, exports, testRules }) {
  const importLine = hasSideEffects
    ? `const { ${exports.join(', ')} } = await import("${importPath}")`
    : `import { ${exports.join(', ')} } from "${importPath}"`

  return [
    `Створи ЛИШЕ header unit-тест файлу (без describe/it блоків).`,
    `Тест-файл: \`${testFilePath}\`  Source: \`${file}\``,
    '',
    'Включи:',
    '- `import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"`',
    '- vi.mock() для кожної зовнішньої залежності (не для node:*)  ',
    `- ${importLine}`,
    '- beforeEach: vi.stubEnv для всіх env-змінних, vi.useFakeTimers() якщо є new Date(), vi.clearAllMocks()',
    '- afterEach: vi.restoreAllMocks(), vi.unstubAllEnvs(), vi.useRealTimers()',
    'НЕ ПИШИ describe() або it() — тільки setup.',
    'Поверни лише код у ```js … ```',
    ...(testRules ? ['', '## Конвенції проєкту (.cursor/rules/n-test.mdc):', testRules] : []),
    '',
    `Source (${file}):`,
    '```js',
    content || '(недоступно)',
    '```'
  ].join('\n')
}

/** Builds the prompt for a single describe() block for one export. */
function buildBlockPrompt({ exp, file, testFilePath, importPath, content, header, testRules }) {
  // Best-effort: extract only the region of source relevant to this export
  const startRe = new RegExp(`export\\s+(?:async\\s+)?(?:const|function)\\s+${exp.name}\\b`)
  const startMatch = startRe.exec(content)
  let snippet = content
  if (startMatch) {
    const after = content.slice(startMatch.index + startMatch[0].length)
    const nextExport = /^export\s/m.exec(after)
    const end = nextExport ? nextExport.index : Math.min(after.length, 2000)
    snippet = startMatch[0] + after.slice(0, end)
  }

  return [
    `Тест-файл: \`${testFilePath}\`  Source import: \`"${importPath}"\``,
    '',
    'Header вже написано (НЕ дублюй import/beforeEach/afterEach):',
    '```js',
    header,
    '```',
    '',
    `Напиши ЛИШЕ \`describe("${exp.name}", () => { … })\` для \`${exp.name}\`.`,
    `Складність: ${exp.complexity} — ${exp.complexity === 'trivial' ? 'константа, 1-2 прості перевірки' : exp.complexity === 'simple' ? 'чиста функція' : 'async/fetch/Date/env'}`,
    '',
    'Правила (СУВОРО):',
    '- Без import, без beforeEach — тільки describe',
    '- ESM only (без require), vi.* (без jest.*)',
    '- vi.mocked(fn) замість type-кастингу',
    '- toBe для примітивів, toEqual для обʼєктів/масивів',
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
// Per-export generation
// ---------------------------------------------------------------------------

/**
 * Generates a test file using per-export tiered routing:
 *   - Cloud for shared header
 *   - Local → cloud fallback for trivial/simple exports
 *   - Cloud directly for complex exports
 *
 * @param {{file: string, pct: number, reason: string}} fileInfo
 * @param {string} dir
 * @param {Function} callTextFn   cloud LLM caller
 * @param {Function} callLocalFn  local LLM caller
 * @returns {Promise<string|null>} written test path or null
 */
async function generatePerExport(fileInfo, dir, callTextFn, callLocalFn) {
  const { file, pct } = fileInfo
  const absPath = join(dir, file)
  let content = ''
  if (existsSync(absPath)) {
    content = readFileSync(absPath, 'utf8')
    if (content.length > MAX_SRC_BYTES) content = content.slice(0, MAX_SRC_BYTES) + '\n...(truncated)'
  }

  const { testFilePath, importPath } = resolveTestPaths(file)
  const hasSideEffects = content.length > 0 && TOP_LEVEL_CALL_RE.test(content)
  const exports = extractExports(content)
  const exportsWithComplexity = extractExportsWithComplexity(content)
  const testRules = findTestRules(dir)

  // Step 1: shared header via cloud
  console.log(`    header → cloud`)
  let header
  try {
    const headerResp = await callTextFn(
      buildHeaderPrompt({ file, testFilePath, importPath, hasSideEffects, content, exports, testRules }),
      { cwd: dir }
    )
    header = extractCode(headerResp)
  } catch (err) {
    console.error(`  ✗ cloud header error: ${err.message}`)
    return null
  }
  if (!header) {
    console.error(`  ✗ cloud не повернув header для ${file}`)
    return null
  }

  // Step 2: per-export describe blocks
  const blocks = []
  const ctx = { file, testFilePath, importPath, content, header, testRules }

  for (const exp of exportsWithComplexity) {
    const isSimple = exp.complexity === 'trivial' || exp.complexity === 'simple'
    let block = null

    if (isSimple && callLocalFn) {
      console.log(`    ${exp.name} (${exp.complexity}) → local`)
      try {
        const localResp = await callLocalFn(buildBlockPrompt({ exp, ...ctx }))
        const candidate = extractCode(localResp)
        if (isValidBlock(candidate)) {
          block = candidate
          console.log(`    ${exp.name} ✓ local`)
        } else {
          console.log(`    ${exp.name} ✗ local invalid → cloud fallback`)
        }
      } catch (err) {
        console.log(`    ${exp.name} ✗ local error (${err.message}) → cloud fallback`)
      }
    }

    if (!block) {
      const tier = isSimple ? 'cloud fallback' : 'cloud'
      console.log(`    ${exp.name} (${exp.complexity}) → ${tier}`)
      try {
        const cloudResp = await callTextFn(buildBlockPrompt({ exp, ...ctx }), { cwd: dir })
        block = extractCode(cloudResp)
      } catch (err) {
        console.error(`  ✗ cloud error for ${exp.name}: ${err.message}`)
      }
    }

    if (block) blocks.push(block)
  }

  // Step 3: merge and write
  const code = mergeBlocks(header, blocks)
  if (!code) {
    console.error(`  ✗ merge failed for ${file}`)
    return null
  }

  const testPath = join(dir, testFilePath)
  mkdirSync(dirname(testPath), { recursive: true })
  writeFileSync(testPath, code + '\n', 'utf8')
  console.log(`  ✓ Записано: ${relative(dir, testPath)} (${blocks.length} блоків)`)
  return testPath
}

// ---------------------------------------------------------------------------
// Single-file (fallback) generation
// ---------------------------------------------------------------------------

/**
 * Builds a display-only summary prompt (used in tests).
 * @param {Array<{file: string, pct: number, reason: string}>} files
 * @param {string} dir
 * @returns {string}
 */
export function buildGenTestsPrompt(files, dir) {
  return files
    .map(({ file, pct, reason }) => {
      const absPath = join(dir, file)
      let content = ''
      if (existsSync(absPath)) {
        content = readFileSync(absPath, 'utf8')
        if (content.length > MAX_SRC_BYTES) content = content.slice(0, MAX_SRC_BYTES) + '\n...(truncated)'
      }
      return (
        `### \`${file}\` (покриття: ${pct.toFixed(1)}%)\n` +
        (reason ? `Причина: ${reason}\n\n` : '') +
        (content ? `\`\`\`js\n${content}\n\`\`\`` : '(вміст недоступний)')
      )
    })
    .join('\n\n')
}

/** Builds the single-file prompt (fallback when per-export unavailable). */
function buildSingleFilePrompt(fileInfo, dir) {
  const { file, pct, reason } = fileInfo
  const absPath = join(dir, file)
  let content = ''
  if (existsSync(absPath)) {
    content = readFileSync(absPath, 'utf8')
    if (content.length > MAX_SRC_BYTES) content = content.slice(0, MAX_SRC_BYTES) + '\n...(truncated)'
  }

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
    '- Мокуй залежності: `vi.mock("module", () => ({ fn: vi.fn() }))` + `vi.mocked(fn)`',
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

async function generateOneTest(fileInfo, dir, callTextFn) {
  const prompt = buildSingleFilePrompt(fileInfo, dir)
  let response
  try {
    response = await callTextFn(prompt, { cwd: dir })
  } catch (err) {
    console.error(`  ✗ pi помилка для ${fileInfo.file}: ${err.message}`)
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
 * Generates tests for all given files.
 * Uses per-export tiered routing when local LLM is available;
 * falls back to single-file cloud generation otherwise.
 *
 * @param {Array<{file: string, pct: number, reason: string}>} files
 * @param {string} dir project root
 * @param {{ callText?: Function, callLocal?: Function, generateOne?: Function }} [opts]
 */
export async function generateTests(files, dir, opts = {}) {
  if (files.length === 0) return

  const callTextFn = opts.callText ?? callText

  // Local model: explicit opts.localModel OR env N_LOCAL_MIN_MODEL OR null (cloud-only)
  const localModel = opts.localModel !== undefined ? opts.localModel : (process.env.N_LOCAL_MIN_MODEL ?? null)

  // Wrap pi callText with the local model id so callLocalFn has the same signature as callTextFn
  const localFn = localModel ? prompt => callTextFn(prompt, { model: localModel, cwd: dir }) : null

  const mode = localFn ? `per-export (local:${localModel} + cloud)` : 'single-file (cloud)'
  console.log(`\n🤖 Генерую тести для ${files.length} файлів [${mode}]...\n`)

  for (const fileInfo of files) {
    console.log(`  → ${fileInfo.file} (${fileInfo.pct.toFixed(1)}%)`)

    if (opts.generateOne) {
      await opts.generateOne(fileInfo, dir)
      continue
    }

    const exportsInfo = extractExportsWithComplexity(
      existsSync(join(dir, fileInfo.file)) ? readFileSync(join(dir, fileInfo.file), 'utf8').slice(0, MAX_SRC_BYTES) : ''
    )

    const usePerExport = localFn && exportsInfo.length > 0
    if (usePerExport) {
      await generatePerExport(fileInfo, dir, callTextFn, localFn)
    } else {
      await generateOneTest(fileInfo, dir, callTextFn)
    }
  }
}
