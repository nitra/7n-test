/**
 * fix-tests: виявляє падаючі unit-тести і викликає pi-агента для їх виправлення.
 *
 * Порядок роботи:
 *   1. getFailingTests(dir) — запускає vitest run --reporter=json і повертає
 *      список падаючих файлів з повідомленнями про помилки.
 *   2. fixFailingTests(dir, opts) — якщо є падіння, будує prompt і викликає pi CLI
 *      в агентному режимі; перевіряє результат повторним getFailingTests.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, relative, dirname } from 'node:path'
import { env } from 'node:process'
import { findTestRules } from './gen-tests.mjs'

const _require = createRequire(import.meta.url)
const VITEST_BIN = join(dirname(_require.resolve('vitest/package.json')), 'vitest.mjs')

const MODEL = env.N_CURSOR_FIX_TESTS_MODEL ?? env.N_CLOUD_MAX_MODEL ?? ''
const MAX_ERRORS_PER_FILE = 5
const MAX_ERROR_LINES = 10

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

/**
 * Builds a prompt for pi agent to fix failing tests.
 * @param {Array<{file: string, errors: string[]}>} failures
 * @param {string} [dir] project root (used to load n-test.mdc rules)
 * @returns {string}
 */
export function buildFixTestsPrompt(failures, dir) {
  const testRules = dir ? findTestRules(dir) : null

  const fileList = failures
    .map(({ file, errors }) => {
      const errBlock = errors.join('\n\n')
      return `### \`${file}\`\n\`\`\`\n${errBlock}\n\`\`\``
    })
    .join('\n\n')

  return [
    'Виправ падаючі unit-тести. Для кожного файлу:',
    '1. Прочитай тест-файл і source-файл що він тестує',
    `2. Запусти: \`node ${VITEST_BIN} run <testFile>\` — переконайся в точній помилці`,
    '3. Виправ ЛИШЕ тест-файл — source-файли не чіпай',
    `4. Запусти тест ще раз: \`node ${VITEST_BIN} run <testFile>\` — переконайся що зелений`,
    '',
    '## Правила:',
    '- Міняй виключно тест-файли',
    '- Зберігай структуру тестів (describe/it/expect)',
    '- Якщо тест перевіряє неіснуючий API — адаптуй до реального',
    '- НЕ видаляй тести — лише виправляй',
    '- Якщо тест тестує видалений функціонал — закоментуй з поясненням чому',
    '- Файл .mjs = чистий JavaScript, НЕ TypeScript. НІКОЛИ: `as Type`, generics',
    '- Замість `fn as vi.Mock` → `vi.mocked(fn)`, замість `fn as jest.Mock` → `vi.mocked(fn)`',
    '- `vi.spyOn(process, "env")` НЕ ПРАЦЮЄ — use `vi.stubEnv("KEY", "val")`',
    '- `vi.spyOn(Date).mockReturnValue(...)` НЕ ПРАЦЮЄ з `new Date()` — use `vi.useFakeTimers()` + `vi.setSystemTime(new Date(...))` + `afterEach(() => vi.useRealTimers())`',
    ...(testRules ? ['', '## Конвенції тестів цього проєкту (.cursor/rules/n-test.mdc):', testRules] : []),
    '',
    '## Падаючі файли та помилки:',
    '',
    fileList
  ].join('\n')
}

/**
 * Calls pi CLI as agent (live output) to fix failing tests.
 * @param {string} prompt
 * @param {string} model provider/model-id або '' для pi-дефолту
 * @param {string} cwd
 */
function callPi(prompt, model, cwd) {
  const modelArgs = model ? ['--model', model] : []
  spawnSync('pi', ['-p', prompt, ...modelArgs, '--no-session'], {
    cwd,
    stdio: 'inherit',
    timeout: 900_000
  })
}

const MAX_FIX_ATTEMPTS = 3

/**
 * Detects and fixes failing tests using a pi agent (up to MAX_FIX_ATTEMPTS retries).
 * Returns immediately with count=0 if all tests are already passing.
 *
 * @param {string} dir project root
 * @param {{
 *   failures?: Array<{file: string, errors: string[]}>,
 *   callPi?: (prompt: string, model: string, cwd: string) => void
 * }} [opts]
 * @returns {Promise<{count: number, fixed: number, remaining: number}>}
 */
export async function fixFailingTests(dir, opts = {}) {
  const callPiFn = opts.callPi ?? callPi
  const failures = opts.failures ?? (await getFailingTests(dir))

  if (failures.length === 0) return { count: 0, fixed: 0, remaining: 0 }

  console.log(`\n🔧 Виправляю ${failures.length} падаючих test-файлів (pi agent)...\n`)
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
    callPiFn(prompt, MODEL, dir)
    remaining = await getFailingTests(dir)
  }

  const fixed = failures.length - remaining.length

  if (fixed > 0) console.log(`✓ Виправлено: ${fixed}/${failures.length} файлів`)
  if (remaining.length > 0) console.log(`⚠ Залишились падати: ${remaining.length} файлів`)

  return { count: failures.length, fixed, remaining: remaining.length }
}
