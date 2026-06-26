/**
 * Test generation via pi agent.
 * Reads source files, builds a rich prompt, and runs pi in agent mode
 * so it can find/create test files and verify them with bun test.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { env } from 'node:process'

const MAX_SRC_BYTES = 4000
const MODEL = env.N_CURSOR_COVERAGE_FIX_MODEL ?? env.N_CLOUD_MAX_MODEL ?? ''

/** Test file candidates relative to source file. */
function testCandidates(file) {
  const base = file.replace(/\.[^.]+$/, '')
  const lastSlash = base.lastIndexOf('/')
  const name = lastSlash === -1 ? base : base.slice(lastSlash + 1)
  const dir = lastSlash === -1 ? '' : base.slice(0, lastSlash)
  return [
    `${base}.test.mjs`,
    `${base}.test.js`,
    `${base}.test.ts`,
    ...(dir ? [`${dir}/tests/${name}.test.mjs`, `${dir}/tests/${name}.test.js`] : [])
  ]
}

/**
 * Builds the pi agent prompt for test generation.
 * @param {Array<{file: string, pct: number, reason: string}>} files
 * @param {string} dir project root
 * @returns {string}
 */
export function buildGenTestsPrompt(files, dir) {
  const sections = []
  for (const { file, pct, reason } of files) {
    const absPath = join(dir, file)
    let content = ''
    if (existsSync(absPath)) {
      content = readFileSync(absPath, 'utf8')
      if (content.length > MAX_SRC_BYTES) content = content.slice(0, MAX_SRC_BYTES) + '\n...(truncated)'
    }

    const existingTest = testCandidates(file).find(c => existsSync(join(dir, c)))
    let existingTestSection = ''
    if (existingTest) {
      const testContent = readFileSync(join(dir, existingTest), 'utf8')
      existingTestSection = `\n\nІснуючий тест-файл (\`${existingTest}\`):\n\`\`\`js\n${testContent.slice(0, 2000)}\n\`\`\``
    }

    sections.push(
      `### \`${file}\` (покриття: ${pct.toFixed(1)}%)\n` +
        (reason ? `Причина: ${reason}\n\n` : '') +
        (content ? `\`\`\`js\n${content}\n\`\`\`` : '(вміст недоступний)') +
        existingTestSection
    )
  }

  return [
    'ДІЯ: Негайно напиши unit-тести для кожного з наступних файлів. Без запитань, без підтверджень — одразу пиши файли.',
    '',
    'Для кожного файлу: створи або відредагуй відповідний `*.test.mjs` поруч із джерелом,',
    'напиши тести що покривають основну логіку, гілки та граничні випадки.',
    '',
    '## Файли для покриття',
    '',
    ...sections,
    '',
    '## Обовʼязкові правила (дотримуйся СУВОРО)',
    '- НЕ змінюй source-файли — лише test-файли (`*.test.mjs`).',
    '- Фреймворк: **vitest**. Перший рядок кожного тест-файлу: `import { vi, describe, it, expect, beforeEach } from "vitest"`',
    '- Мокування: `vi.mock(...)`, `vi.fn()`, `vi.clearAllMocks()` — НІКОЛИ `jest.*`.',
    '- Після кожного файлу виконай `bun test <шлях-до-тесту>` і переконайся що 0 fail.',
    '- Не питай підтвердження — пиши всі файли підряд самостійно.',
    '- Якщо файл лише re-export або типи — пропусти і продовж до наступного.'
  ].join('\n')
}

/**
 * Runs pi agent to generate tests for the given files.
 * @param {Array<{file: string, pct: number, reason: string}>} files files that need tests
 * @param {string} dir project root
 * @param {{ callPi?: Function }} [opts]
 */
export function generateTests(files, dir, opts = {}) {
  if (files.length === 0) return

  const prompt = buildGenTestsPrompt(files, dir)
  console.log(`\n🤖 Генерую тести для ${files.length} файлів через pi агента...\n`)

  const callPiFn = opts.callPi ?? callPi
  callPiFn(prompt, MODEL, dir)
}

/**
 * @param {string} prompt
 * @param {string} model
 * @param {string} cwd
 */
function callPi(prompt, model, cwd) {
  const modelArgs = model ? ['--model', model] : []
  spawnSync('pi', ['-p', prompt, ...modelArgs, '--no-session'], {
    cwd,
    stdio: 'inherit',
    env,
    timeout: 900_000
  })
}
