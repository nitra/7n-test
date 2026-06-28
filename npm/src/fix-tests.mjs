/**
 * fix-tests: виявляє падаючі unit-тести і виправляє їх через pi SDK (text mode).
 *
 * Порядок роботи:
 *   1. getFailingTests(dir) — запускає vitest run --reporter=json і повертає
 *      список падаючих файлів з повідомленнями про помилки.
 *   2. fixFailingTests(dir, opts) — для кожного падаючого файлу:
 *        a. Читає поточний вміст тест-файлу та source-файлу
 *        b. callText → отримує виправлений код у ```js блоці
 *        c. writeFileSync → записує файл напряму (без Edit тулів агента)
 *        d. Повторює до MAX_FIX_ATTEMPTS якщо ще залишились падіння
 *
 * Перехід з callAgent (Edit-інструменти) на callText+write усуває проблему
 * точного матчу рядків що містять URL, backtick-рядки та спецсимволи.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, relative, dirname } from 'node:path'
import { env } from 'node:process'
import { callText } from './lib/pi-client.mjs'
import { findTestRules } from './gen-tests.mjs'

const _require = createRequire(import.meta.url)
const VITEST_BIN = join(dirname(_require.resolve('vitest/package.json')), 'vitest.mjs')

const MODEL = env.N_CURSOR_FIX_TESTS_MODEL ?? env.N_CLOUD_MAX_MODEL ?? undefined
const MAX_ERRORS_PER_FILE = 5
const MAX_ERROR_LINES = 10
const MAX_SRC_BYTES = 4000

/**
 * Runs vitest in JSON mode and returns failing test files with error messages.
 * @param {string} dir project root
 * @returns {Promise<Array<{file: string, errors: string[]}>>}
 */
export async function getFailingTests(dir) {
  const tmpDir = await mkdtemp(join(tmpdir(), '7n-fix-'))
  const outputFile = join(tmpDir, 'results.json')

  try {
    spawnSync(
      process.execPath,
      [VITEST_BIN, 'run', '--reporter=json', `--outputFile=${outputFile}`, '--passWithNoTests'],
      {
        cwd: dir,
        stdio: 'inherit',
        env
      }
    )

    if (!existsSync(outputFile)) return []

    let data
    try {
      data = JSON.parse(readFileSync(outputFile, 'utf8'))
    } catch {
      return []
    }

    return (data.testResults ?? [])
      .filter(r => r.status === 'failed')
      .map(r => {
        const assertionErrors = (r.assertionResults ?? [])
          .filter(a => a.status === 'failed')
          .slice(0, MAX_ERRORS_PER_FILE)
          .map(a => {
            const name = [...(a.ancestorTitles ?? []), a.title].join(' > ')
            const msg = (a.failureMessages?.[0] ?? '').split('\n').slice(0, MAX_ERROR_LINES).join('\n')
            return `${name}:\n${msg}`
          })
        const errors =
          assertionErrors.length > 0
            ? assertionErrors
            : [
                `Suite error: ${(r.message ?? r.failureMessage ?? 'module-level failure').split('\n').slice(0, MAX_ERROR_LINES).join('\n')}`
              ]
        return { file: relative(dir, r.testFilePath ?? r.name), errors }
      })
      .filter(f => !f.file.startsWith('..'))
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}

/** Extracts the first ```js…``` block from LLM text output. */
function extractCode(text) {
  const match = text.match(/```(?:js|javascript|mjs|ts)?\n([\s\S]*?)```/)
  return match ? match[1].trim() : ''
}

/**
 * Builds a prompt to fix one failing test file.
 * Includes current file content so the LLM doesn't need file-read tools.
 */
export function buildFixTestsPrompt(failures, dir) {
  const testRules = dir ? findTestRules(dir) : null

  const sections = failures.map(({ file, errors }) => {
    const absPath = dir ? join(dir, file) : file
    const testCode = existsSync(absPath) ? readFileSync(absPath, 'utf8').slice(0, 6000) : '(файл не знайдено)'

    // Heuristically find source file: strip tests/ prefix from path
    const sourcePath = absPath.replace(/[/\\]tests[/\\]([^/\\]+)\.test\.mjs$/, '/$1.js')
    const sourceCode =
      sourcePath !== absPath && existsSync(sourcePath) ? readFileSync(sourcePath, 'utf8').slice(0, MAX_SRC_BYTES) : null

    const errBlock = errors.join('\n\n')

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
  })

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
 * Parses multiple ```js blocks with <!-- file: path --> markers from LLM response.
 * @param {string} text
 * @returns {Array<{file: string, code: string}>}
 */
function parseFixedFiles(text) {
  const results = []
  const blockRe = /<!--\s*file:\s*([^\n>]+?)\s*-->\s*```(?:js|javascript|mjs|ts)?\n([\s\S]*?)```/g
  let match
  while ((match = blockRe.exec(text)) !== null) {
    const file = match[1].trim()
    const code = match[2].trim()
    if (file && code) results.push({ file, code })
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
 * Detects and fixes failing tests using pi SDK text mode + direct writeFileSync.
 * Returns immediately with count=0 if all tests are already passing.
 *
 * @param {string} dir project root
 * @param {{
 *   failures?: Array<{file: string, errors: string[]}>,
 *   callTextFn?: (prompt: string, opts?: object) => Promise<string>
 * }} [opts]
 * @returns {Promise<{count: number, fixed: number, remaining: number}>}
 */
export async function fixFailingTests(dir, opts = {}) {
  const callTextFn = opts.callTextFn ?? (prompt => callText(prompt, { model: MODEL, cwd: dir }))
  const failures = opts.failures ?? (await getFailingTests(dir))

  if (failures.length === 0) return { count: 0, fixed: 0, remaining: 0 }

  console.log(`\n🔧 Виправляю ${failures.length} падаючих test-файлів (pi text mode)...\n`)
  for (const f of failures) {
    console.log(`  • ${f.file} (${f.errors.length} помилок)`)
  }
  console.log()

  let remaining = failures
  for (let attempt = 1; attempt <= MAX_FIX_ATTEMPTS && remaining.length > 0; attempt++) {
    if (attempt > 1) {
      console.log(`\n🔄 Спроба ${attempt}/${MAX_FIX_ATTEMPTS}: залишилось ${remaining.length} файлів...\n`)
    }

    const prompt = buildFixTestsPrompt(remaining, dir)
    let response = ''
    try {
      response = await callTextFn(prompt)
    } catch (err) {
      console.error(`  ✗ pi помилка: ${err.message}`)
      break
    }

    const fixed = parseFixedFiles(response)

    if (fixed.length === 0) {
      console.error('  ✗ pi не повернула виправлений код')
      break
    }

    for (const { file, code } of fixed) {
      // Resolve which file to write
      let absPath
      if (file) {
        absPath = join(dir, file)
      } else if (remaining.length === 1) {
        absPath = join(dir, remaining[0].file)
      } else {
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

    remaining = await getFailingTests(dir)
  }

  const fixedCount = failures.length - remaining.length

  if (fixedCount > 0) console.log(`✓ Виправлено: ${fixedCount}/${failures.length} файлів`)
  if (remaining.length > 0) console.log(`⚠ Залишились падати: ${remaining.length} файлів`)

  return { count: failures.length, fixed: fixedCount, remaining: remaining.length }
}
