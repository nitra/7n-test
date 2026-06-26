/**
 * LLM assessment via pi CLI: does an uncovered file actually need unit tests?
 * Uses `pi --mode text --no-tools --no-session` for structured JSON replies.
 * Model: N_CLOUD_MIN_MODEL env → pi default.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { env } from 'node:process'

const MAX_CONTENT_BYTES = 6000
const MODEL = env.N_CLOUD_MIN_MODEL ?? ''

const SYSTEM_PROMPT = `You are a test-need classifier for JS/TS source files.

Given a source file with low test coverage, decide if unit tests are worthwhile.

Reply ONLY with a JSON object (no markdown fence):
{"needsTests": true|false, "reason": "one sentence in Ukrainian"}

needsTests: false when:
- File only contains types, interfaces, constants, or re-exports with no logic
- Thin config or index file that just wires up other modules
- Behavior is fully covered by integration/e2e tests (name them)

needsTests: true when:
- File contains utility functions, parsers, transformers with branches
- Business logic with conditions or non-trivial contracts
- Pure functions that can be unit-tested cheaply`

/**
 * @param {string} prompt
 * @returns {string} stdout from pi
 */
function callPiText(prompt) {
  const modelArgs = MODEL ? ['--model', MODEL] : []
  const r = spawnSync('pi', ['-p', prompt, ...modelArgs, '--no-session', '--mode', 'text', '--no-tools'], {
    encoding: 'utf8',
    timeout: 60_000,
    env
  })
  if (r.error) throw new Error(`pi error: ${r.error.message}`)
  if (r.status !== 0) throw new Error(`pi exit ${r.status}: ${r.stderr?.slice(0, 200) ?? ''}`)
  return r.stdout?.trim() ?? ''
}

/**
 * @param {{file: string, pct: number}} fileInfo
 * @param {string} dir project root
 * @returns {{file: string, pct: number, needsTests: boolean, reason: string}}
 */
function assessOne(fileInfo, dir) {
  const absPath = join(dir, fileInfo.file)
  if (!existsSync(absPath)) return { ...fileInfo, needsTests: false, reason: 'файл недоступний' }

  let content = readFileSync(absPath, 'utf8')
  if (content.length > MAX_CONTENT_BYTES) content = content.slice(0, MAX_CONTENT_BYTES) + '\n...(truncated)'

  const prompt =
    `${SYSTEM_PROMPT}\n\n` +
    `## File: ${fileInfo.file} (current coverage: ${fileInfo.pct.toFixed(1)}%)\n\n` +
    `\`\`\`\n${content}\n\`\`\``

  try {
    const text = callPiText(prompt)
    const match = text.match(/\{[\s\S]*?"needsTests"[\s\S]*?\}/)
    const parsed = JSON.parse(match?.[0] ?? '{}')
    return {
      file: fileInfo.file,
      pct: fileInfo.pct,
      needsTests: parsed.needsTests !== false,
      reason: typeof parsed.reason === 'string' ? parsed.reason : ''
    }
  } catch {
    return { file: fileInfo.file, pct: fileInfo.pct, needsTests: true, reason: 'оцінка не вдалась — вважаємо що потрібні тести' }
  }
}

/**
 * Assess a list of uncovered files: do they need tests?
 * @param {Array<{file: string, pct: number}>} files
 * @param {string} dir project root
 * @returns {Array<{file: string, pct: number, needsTests: boolean, reason: string}>}
 */
export function assessNeed(files, dir) {
  return files.map(f => assessOne(f, dir))
}
