/**
 * Test generation via pi SDK (one file at a time).
 *
 * Uses callText() for text-mode generation: gets raw code back,
 * extracts the ```js block, writes the file directly.
 * No subprocess, no confirmation prompts.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { callText } from './lib/pi-client.mjs'

const MAX_SRC_BYTES = 6000

/** Test file candidates relative to source file. */
function testCandidates(file) {
  const base = file.replace(/\.[^.]+$/, '')
  const lastSlash = base.lastIndexOf('/')
  const name = lastSlash === -1 ? base : base.slice(lastSlash + 1)
  const dir = lastSlash === -1 ? '' : base.slice(0, lastSlash)
  return [`${base}.test.mjs`, `${base}.test.js`, ...(dir ? [`${dir}/tests/${name}.test.mjs`] : [])]
}

/**
 * Extracts the first ```js...``` block from LLM text output.
 * @param {string} text
 * @returns {string}
 */
function extractCode(text) {
  const match = text.match(/```(?:js|javascript|mjs|ts)?\n([\s\S]*?)```/)
  return match ? match[1].trim() : ''
}

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

function buildSingleFilePrompt(fileInfo, dir) {
  const { file, pct, reason } = fileInfo
  const absPath = join(dir, file)
  let content = ''
  if (existsSync(absPath)) {
    content = readFileSync(absPath, 'utf8')
    if (content.length > MAX_SRC_BYTES) content = content.slice(0, MAX_SRC_BYTES) + '\n...(truncated)'
  }

  const existingTestFile = testCandidates(file).find(c => existsSync(join(dir, c)))
  let existingSection = ''
  if (existingTestFile) {
    const tc = readFileSync(join(dir, existingTestFile), 'utf8')
    existingSection = `\n\nІснуючий тест (доповни):\n\`\`\`js\n${tc.slice(0, 3000)}\n\`\`\``
  }

  return [
    `Напиши повний unit-тест для файлу \`${file}\` (покриття зараз ${pct.toFixed(1)}%).`,
    reason ? `Причина: ${reason}` : '',
    '',
    'Правила (СУВОРО):',
    '- Перший рядок: `import { vi, describe, it, expect, beforeEach } from "vitest"`',
    '- Мокуй залежності: `vi.mock("module", () => ({ fn: vi.fn() }))` + `vi.mocked(fn)`',
    '- НІКОЛИ `jest.*`, НІКОЛИ `require()`',
    '- Лише поведінкові тести — НЕ тестуй приватні деталі реалізації',
    '- Поверни ЛИШЕ код тесту у блоці ```js ... ``` — без пояснень',
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
 * Generates a test for one file via pi text mode.
 * @param {{file: string, pct: number, reason: string}} fileInfo
 * @param {string} dir
 * @param {Function} callTextFn
 * @returns {Promise<string|null>} written test path or null
 */
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
  writeFileSync(testPath, code + '\n', 'utf8')
  console.log(`  ✓ Записано: ${relative(dir, testPath)}`)
  return testPath
}

/**
 * Generates tests for all given files (one pi call per file).
 * @param {Array<{file: string, pct: number, reason: string}>} files
 * @param {string} dir project root
 * @param {{ callText?: Function, generateOne?: Function }} [opts]
 * @returns {Promise<void>}
 */
export async function generateTests(files, dir, opts = {}) {
  if (files.length === 0) return

  const callTextFn = opts.callText ?? callText
  const generateOneFn = opts.generateOne ?? ((f, d) => generateOneTest(f, d, callTextFn))

  console.log(`\n🤖 Генерую тести для ${files.length} файлів (pi SDK, по одному)...\n`)

  for (const fileInfo of files) {
    console.log(`  → ${fileInfo.file} (${fileInfo.pct.toFixed(1)}%)`)
    await generateOneFn(fileInfo, dir)
  }
}
