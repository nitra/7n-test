/**
 * LLM assessment via pi SDK: does an uncovered file actually need unit tests?
 * Uses callText() (no tools) for structured JSON replies.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { callText } from './lib/pi-client.mjs'

const MAX_CONTENT_BYTES = 6000

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
 * @param {{file: string, pct: number}} fileInfo
 * @param {string} dir project root
 * @param {Function} [callTextFn] injectable for tests
 * @returns {Promise<{file: string, pct: number, needsTests: boolean, reason: string}>}
 */
async function assessOne(fileInfo, dir, callTextFn) {
  const absPath = join(dir, fileInfo.file)
  if (!existsSync(absPath)) return { ...fileInfo, needsTests: false, reason: 'файл недоступний' }

  let content = readFileSync(absPath, 'utf8')
  if (content.length > MAX_CONTENT_BYTES) content = content.slice(0, MAX_CONTENT_BYTES) + '\n...(truncated)'

  const prompt =
    `${SYSTEM_PROMPT}\n\n` +
    `## File: ${fileInfo.file} (current coverage: ${fileInfo.pct.toFixed(1)}%)\n\n` +
    `\`\`\`\n${content}\n\`\`\``

  try {
    const text = await callTextFn(prompt, { cwd: dir })
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
 * @param {{ callText?: Function }} [opts]
 * @returns {Promise<Array<{file: string, pct: number, needsTests: boolean, reason: string}>>}
 */
export async function assessNeed(files, dir, opts = {}) {
  const callTextFn = opts.callText ?? callText
  return Promise.all(files.map(f => assessOne(f, dir, callTextFn)))
}
