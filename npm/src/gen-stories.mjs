/**
 * Storybook CSF3 `.stories.*` generation for uncovered Vue components (single-shot
 * LLM per component, validated via the target's own Storybook vitest project).
 *
 * Simpler than gen-tests.mjs's per-export tiered pipeline: a Vue SFC is one unit
 * (one component), not many independently-testable exports — one story file is
 * the natural generation grain, not per-prop blocks.
 *
 * Validation runs `vitest run --project=storybook <story>` (browser mode, Playwright)
 * against the TARGET project's own local vitest — never the bundled shim (no
 * Storybook/Playwright setup there). When no local vitest is found the story is
 * still written, best-effort, with a warning (mirrors gen-tests.mjs's graceful
 * degradation for other missing-tooling cases).
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, relative } from 'node:path'
import { callText, MEMORY_ERROR_RE } from './lib/llm.mjs'
import { budgetFor } from '@7n/llm-lib/prompt-budget'
import { startChain } from '@7n/llm-lib/chain'
import { resolveVitestRun } from './lib/vitest-shim.mjs'

const MAX_SRC_BYTES = 6000
const STORY_MAX_ATTEMPTS = 5
const CODE_BLOCK_RE = /```(?:vue|js|javascript|mjs|ts|typescript)?\n([\s\S]*?)```/
const SCRIPT_LANG_TS_RE = /<script[^>]*\blang\s*=\s*["']ts["'][^>]*>/
const VUE_EXT_RE = /\.vue$/
const FRONTMATTER_RE = /^---[\s\S]*?---\n/

/**
 * Finds the project's n-test.mdc rules by walking up from dir (max 4 levels).
 * Duplicated from gen-tests.mjs (not imported) — importing it would drag in its
 * unrelated per-export pipeline deps (classify-exports, ast-analyze, runtime-probe)
 * just for this ~12-line helper.
 * @param {string} dir project root
 * @returns {string|null} rules text or null
 */
function findTestRules(dir) {
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
 * Reads a source file and trims it to the prompt budget.
 * @param {string} absPath absolute source path
 * @returns {string} source snippet or empty string when unavailable
 */
function readSourceSnippet(absPath) {
  if (!existsSync(absPath)) return ''
  const content = readFileSync(absPath, 'utf8')
  return content.length > MAX_SRC_BYTES ? `${content.slice(0, MAX_SRC_BYTES)}\n...(truncated)` : content
}

/**
 * Extracts the first fenced code block from LLM text output.
 * @param {string} text LLM output
 * @returns {string} extracted code or empty string
 */
function extractCode(text) {
  const m = CODE_BLOCK_RE.exec(text)
  return m ? m[1].trim() : ''
}

/**
 * Detects `<script lang="ts">`/`<script setup lang="ts">` — decides story file extension.
 * @param {string} content SFC source
 * @returns {'ts'|'js'} script language
 */
function detectScriptLang(content) {
  return SCRIPT_LANG_TS_RE.test(content) ? 'ts' : 'js'
}

/**
 * Component name from a `.vue` file path (basename without extension).
 * @param {string} file relative source path
 * @returns {string} component name
 */
function componentBaseName(file) {
  const base = file.split('/').pop() ?? file
  return base.replace(VUE_EXT_RE, '')
}

/**
 * Story file path next to the component (Storybook convention — not `tests/`).
 * @param {string} file relative `.vue` source path
 * @param {'ts'|'js'} lang script language
 * @returns {string} relative `.stories.<ext>` path
 */
function storyFilePath(file, lang) {
  const lastSlash = file.lastIndexOf('/')
  const dir = lastSlash === -1 ? '' : file.slice(0, lastSlash)
  const name = componentBaseName(file)
  return dir ? `${dir}/${name}.stories.${lang}` : `${name}.stories.${lang}`
}

/**
 * Builds the story-generation prompt for one Vue component.
 * @param {{file: string, pct: number}} fileInfo uncovered `.vue` file info
 * @param {string} dir project root
 * @returns {{prompt: string, storyRelPath: string, lang: 'ts'|'js'}} prompt and resolved paths
 */
function buildStoryPrompt(fileInfo, dir) {
  const { file } = fileInfo
  const absPath = join(dir, file)
  const content = readSourceSnippet(absPath)
  const lang = detectScriptLang(content)
  const name = componentBaseName(file)
  const storyRelPath = storyFilePath(file, lang)
  const componentFileName = file.split('/').pop() ?? file
  const testRules = findTestRules(dir)

  const prompt = [
    `Напиши Storybook CSF3 story-файл \`${storyRelPath}\` для Vue-компонента \`${file}\`.`,
    `Компонент: \`${name}\`, файл поряд: \`./${componentFileName}\``,
    '',
    'Правила (СУВОРО):',
    `- Перший рядок: import ${name} from './${componentFileName}'`,
    `- default export: { title: "<логічний шлях за структурою тек>", component: ${name} }`,
    '- Щонайменше один named export-story (наприклад Default) з `args`, що відповідають РЕАЛЬНИМ props компонента (defineProps/props option) — не вигадуй неіснуючі props',
    '- Формат CSF3 (Component Story Format 3) — БЕЗ legacy `storiesOf`, БЕЗ default function-based формату',
    `- Файл ${lang === 'ts' ? 'TypeScript — типізуй Meta/StoryObj через @storybook/vue3' : 'чистий JavaScript — без TS-синтаксису (as Type, generics)'}`,
    `- Поверни лише код у \`\`\`${lang} … \`\`\``,
    ...(testRules ? ['', '## Конвенції проєкту:', testRules] : []),
    '',
    `Source (${file}):`,
    '```vue',
    content || '(недоступно)',
    '```'
  ]
    .filter(Boolean)
    .join('\n')

  return { prompt, storyRelPath, lang }
}

/**
 * Wraps the original prompt with Storybook-vitest error feedback for a retry.
 * @param {string} basePrompt initial story prompt
 * @param {string} prevCode previous story code
 * @param {string} errors vitest error output
 * @param {number} attempt current attempt number
 * @returns {string} retry prompt text
 */
function buildStoryRetryPrompt(basePrompt, prevCode, errors, attempt) {
  return [
    basePrompt,
    '',
    '---',
    `## Спроба ${attempt}: попередній story-файл не пройшов Storybook vitest (browser mode)`,
    '',
    'Твій попередній варіант:',
    '```',
    prevCode,
    '```',
    '',
    'Помилки:',
    '```',
    errors,
    '```',
    '',
    'Поверни виправлений story-файл у ```… ```'
  ].join('\n')
}

/**
 * Validates a written story file against the target's own Storybook vitest project
 * (browser mode, Playwright). Only runs when the target has a local vitest install —
 * the bundled shim has no Storybook/Playwright setup, so browser mode can't work there.
 * @param {string} dir project root
 * @param {string} storyRelPath relative path to the story file (from dir)
 * @returns {{validated: boolean, passed: boolean, errors: string}} validation result
 */
function runStoryValidate(dir, storyRelPath) {
  const { bin, configArgs } = resolveVitestRun(dir)
  if (configArgs.length > 0) {
    // bundled/shim vitest — немає Playwright/Storybook у shim-конфізі, валідація неможлива
    return { validated: false, passed: true, errors: '' }
  }
  const result = spawnSync(
    process.execPath,
    [bin, 'run', '--project=storybook', '--root', dir, '--reporter=verbose', storyRelPath],
    { cwd: dir, encoding: 'utf8', timeout: 60_000, env: process.env }
  )
  if (result.status === 0) return { validated: true, passed: true, errors: '' }
  const out = (result.stdout ?? '') + (result.stderr ?? '')
  return { validated: true, passed: false, errors: out.slice(0, 3000) }
}

/**
 * Converts an LLM exception into loop-control state (mirrors gen-tests.mjs's
 * resolveLoopCallFailure — memory-guard errors propagate, other errors retry/stop).
 * @param {Error} error caught LLM error
 * @param {number} attempt current attempt number
 * @returns {{stop: boolean, lastErrors: string|null}} loop-control state
 */
function resolveStoryCallFailure(error, attempt) {
  if (MEMORY_ERROR_RE.test(error.message ?? '')) throw error
  console.error(`  ✗ pi помилка (спроба ${attempt}): ${error.message}`)
  if (attempt >= STORY_MAX_ATTEMPTS) return { stop: true, lastErrors: null }
  return { stop: false, lastErrors: `LLM error: ${error.message}` }
}

/**
 * Writes generated code to disk and validates it; removes the file on failed validation
 * so a failed attempt never leaves a broken story behind.
 * @param {string} dir project root
 * @param {string} storyRelPath relative story path
 * @param {string} code generated story code
 * @param {typeof runStoryValidate} validateFn validate function
 * @returns {{absStoryPath: string, validated: boolean, passed: boolean, errors: string}} write+validate result
 */
function writeAndValidateStory(dir, storyRelPath, code, validateFn) {
  const absStoryPath = join(dir, storyRelPath)
  mkdirSync(dirname(absStoryPath), { recursive: true })
  writeFileSync(absStoryPath, code + '\n', 'utf8')
  const result = validateFn(dir, storyRelPath)
  if (result.validated && !result.passed) rmSync(absStoryPath, { force: true })
  return { absStoryPath, ...result }
}

/**
 * Formats the "(спроба N)" suffix for the success log line (avoids a nested template).
 * @param {number} attempt attempt number
 * @returns {string} formatted suffix
 */
function formatAttemptSuffix(attempt) {
  return ` (спроба ${attempt})`
}

/**
 * Runs one LLM attempt: calls the model, extracts code, validates shape. Returns
 * `{code}` on success or `{retry: {lastCode, lastErrors}}` to continue the loop,
 * or `{stop: true}` to give up on this file.
 * @param {string} prompt prompt for this attempt
 * @param {import('./gen-tests.mjs').PiCallFn} callTextFn cloud LLM caller
 * @param {string} dir project root
 * @param {number} attempt current attempt number
 * @returns {Promise<{code: string}|{retry: {lastCode: string|null, lastErrors: string}}|{stop: true}>} attempt outcome
 */
async function runStoryAttempt(prompt, callTextFn, dir, attempt) {
  let resp
  try {
    resp = await callTextFn(prompt, { cwd: dir, maxTokens: budgetFor('single-file').maxTokens })
  } catch (error) {
    const failure = resolveStoryCallFailure(error, attempt)
    if (failure.stop) return { stop: true }
    return { retry: { lastCode: null, lastErrors: failure.lastErrors } }
  }

  const code = extractCode(resp)
  if (!code || !code.includes('export default')) {
    return {
      retry: {
        lastCode: code || null,
        lastErrors: 'Story-файл має містити default export з `component`. Поверни лише код у ```… ```'
      }
    }
  }
  return { code }
}

/**
 * Generates, validates (run → feedback retry) and writes one story file.
 * @param {{file: string, pct: number}} fileInfo uncovered `.vue` file info
 * @param {string} dir project root
 * @param {import('./gen-tests.mjs').PiCallFn} callTextFn cloud LLM caller
 * @param {typeof runStoryValidate} [validateFn] validate injection (для тестів)
 * @returns {Promise<string|null>} written story path or null
 */
async function generateOneStory(fileInfo, dir, callTextFn, validateFn = runStoryValidate) {
  const { file } = fileInfo
  const { prompt: basePrompt, storyRelPath } = buildStoryPrompt(fileInfo, dir)

  let lastCode = null
  let lastErrors = null

  for (let attempt = 1; attempt <= STORY_MAX_ATTEMPTS; attempt++) {
    const prompt =
      lastErrors && lastCode ? buildStoryRetryPrompt(basePrompt, lastCode, lastErrors, attempt) : basePrompt

    const outcome = await runStoryAttempt(prompt, callTextFn, dir, attempt)
    if (outcome.stop) return null
    if (outcome.retry) {
      console.log(`    ${file} ✗ спроба ${attempt} невдала → retry`)
      lastCode = outcome.retry.lastCode ?? lastCode
      lastErrors = outcome.retry.lastErrors
      continue
    }

    const { absStoryPath, validated, passed, errors } = writeAndValidateStory(
      dir,
      storyRelPath,
      outcome.code,
      validateFn
    )
    if (!validated) {
      console.log(`  ⚠ ${relative(dir, absStoryPath)}: локальний vitest не знайдено — записано без валідації`)
      return absStoryPath
    }
    if (passed) {
      const suffix = attempt > 1 ? formatAttemptSuffix(attempt) : ''
      console.log(`  ✓ Записано: ${relative(dir, absStoryPath)}${suffix}`)
      return absStoryPath
    }

    console.log(`    ${file} ✗ storybook vitest fail (спроба ${attempt}/${STORY_MAX_ATTEMPTS})`)
    lastCode = outcome.code
    lastErrors = errors
  }

  console.log(`  ⚠ ${file}: ${STORY_MAX_ATTEMPTS} спроб вичерпано — story не записано`)
  return null
}

/**
 * Generates `.stories.*` files for a list of uncovered Vue components.
 * Each file is one chain unit (ланцюжок для tracing/бюджету, паритет з generateTests).
 * @param {Array<{file: string, pct: number}>} files uncovered `.vue` files
 * @param {string} dir project root
 * @param {{callText?: import('./gen-tests.mjs').PiCallFn, validateStory?: typeof runStoryValidate, makeChain?: typeof startChain}} [opts] generation options
 * @returns {Promise<void>} resolves after all requested files are processed
 */
export async function generateStories(files, dir, opts = {}) {
  if (files.length === 0) return

  const callTextFn = opts.callText ?? callText
  const validateFn = opts.validateStory ?? runStoryValidate
  const makeChain = opts.makeChain ?? startChain

  console.log(`\n🎨 Генерую Storybook stories для ${files.length} Vue-компонентів...\n`)

  for (const fileInfo of files) {
    console.log(`  → ${fileInfo.file} (${fileInfo.pct.toFixed(1)}%)`)
    const chain = makeChain({ kind: 'story-generate', unit: fileInfo.file, cwd: dir })
    const chainedCloud = (prompt, callOpts = {}) => callTextFn(prompt, { ...callOpts, chain })
    let failed = null
    try {
      await generateOneStory(fileInfo, dir, chainedCloud, validateFn)
    } catch (error) {
      failed = String(error.message ?? error).slice(0, 200)
      throw error
    } finally {
      chain.end({ outcome: failed ? 'fail' : 'success', extra: failed ? { error: failed } : {} })
    }
  }
}
