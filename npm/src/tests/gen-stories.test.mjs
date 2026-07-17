import { vi, describe, it, expect, beforeEach } from 'vitest'
import { existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { generateStories } from '../gen-stories.mjs'
import { callText } from '../lib/llm.mjs'
import { resolveVitestRun } from '../lib/vitest-shim.mjs'

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  rmSync: vi.fn()
}))
vi.mock('node:path', () => ({
  join: vi.fn((...a) => a.join('/')),
  relative: vi.fn((base, full) => (full.startsWith(base + '/') ? full.slice(base.length + 1) : full)),
  dirname: vi.fn(p => p.split('/').slice(0, -1).join('/'))
}))
// runStoryValidate спавнить реальний сабпроцес лише коли тест НЕ передає opts.validateStory —
// у більшості кейсів валідацію інжектимо напряму, тож spawnSync тут для запасу/для тесту
// дефолтного runStoryValidate (гілка resolveVitestRun з local vitest).
vi.mock('node:child_process', () => ({
  spawnSync: vi.fn().mockReturnValue({ status: 0, stdout: '', stderr: '' })
}))
vi.mock('../lib/llm.mjs', async importOriginal => {
  const actual = await importOriginal()
  return { callText: vi.fn(), MEMORY_ERROR_RE: actual.MEMORY_ERROR_RE }
})
vi.mock('../lib/vitest-shim.mjs', () => ({
  resolveVitestRun: vi.fn()
}))

const mockDir = '/proj'
const CSF3_CODE =
  "```js\nimport Card from './Card.vue'\nexport default { component: Card }\nexport const Default = {}\n```"

describe('generateStories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(existsSync).mockReturnValue(false) // немає n-test.mdc за замовч.
    vi.mocked(readFileSync).mockReturnValue('<template><div /></template>\n')
  })

  it('does nothing for an empty file list', async () => {
    await generateStories([], mockDir)
    expect(callText).not.toHaveBeenCalled()
  })

  it('writes a validated story next to the component', async () => {
    vi.mocked(callText).mockResolvedValue(CSF3_CODE)
    const validateStory = vi.fn().mockReturnValue({ validated: true, passed: true, errors: '' })

    await generateStories([{ file: 'src/Card.vue', pct: 0 }], mockDir, { validateStory })

    expect(writeFileSync).toHaveBeenCalledWith(
      '/proj/src/Card.stories.js',
      expect.stringContaining("import Card from './Card.vue'"),
      'utf8'
    )
    expect(validateStory).toHaveBeenCalledWith(mockDir, 'src/Card.stories.js')
    expect(rmSync).not.toHaveBeenCalled()
  })

  it('uses .stories.ts for <script setup lang="ts">', async () => {
    vi.mocked(existsSync).mockImplementation(p => !String(p).includes('n-test.mdc'))
    vi.mocked(readFileSync).mockReturnValue('<script setup lang="ts">defineProps<{x:number}>()</script>\n')
    vi.mocked(callText).mockResolvedValue(
      "```ts\nimport Card from './Card.vue'\nexport default { component: Card }\n```"
    )
    const validateStory = vi.fn().mockReturnValue({ validated: true, passed: true, errors: '' })

    await generateStories([{ file: 'src/Card.vue', pct: 0 }], mockDir, { validateStory })

    expect(writeFileSync).toHaveBeenCalledWith('/proj/src/Card.stories.ts', expect.any(String), 'utf8')
  })

  it('includes project n-test.mdc conventions in the prompt when present', async () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockImplementation(p =>
      String(p).includes('n-test.mdc') ? '---\ntitle: x\n---\n## Правила\n- тест поряд' : '<template />'
    )
    vi.mocked(callText).mockResolvedValue(CSF3_CODE)
    const validateStory = vi.fn().mockReturnValue({ validated: true, passed: true, errors: '' })

    await generateStories([{ file: 'src/Card.vue', pct: 0 }], mockDir, { validateStory })

    const prompt = vi.mocked(callText).mock.calls[0][0]
    expect(prompt).toContain('тест поряд')
  })

  it('retries with vitest error feedback and eventually succeeds', async () => {
    vi.mocked(callText).mockResolvedValueOnce(CSF3_CODE).mockResolvedValueOnce(CSF3_CODE)
    const validateStory = vi
      .fn()
      .mockReturnValueOnce({ validated: true, passed: false, errors: 'render error: missing prop' })
      .mockReturnValueOnce({ validated: true, passed: true, errors: '' })

    const result = await generateStories([{ file: 'src/Card.vue', pct: 0 }], mockDir, { validateStory })

    expect(callText).toHaveBeenCalledTimes(2)
    expect(validateStory).toHaveBeenCalledTimes(2)
    const retryPrompt = vi.mocked(callText).mock.calls[1][0]
    expect(retryPrompt).toContain('render error: missing prop')
    expect(result).toBeUndefined() // generateStories не повертає значення, лише side-effects
  })

  it('removes the file on failed validation before retry', async () => {
    vi.mocked(callText).mockResolvedValue(CSF3_CODE)
    const validateStory = vi.fn().mockReturnValue({ validated: true, passed: false, errors: 'fail' })

    await generateStories([{ file: 'src/Card.vue', pct: 0 }], mockDir, { validateStory })

    expect(rmSync).toHaveBeenCalledWith('/proj/src/Card.stories.js', { force: true })
  })

  it('gives up after STORY_MAX_ATTEMPTS failed validations', async () => {
    vi.mocked(callText).mockResolvedValue(CSF3_CODE)
    const validateStory = vi.fn().mockReturnValue({ validated: true, passed: false, errors: 'always fails' })

    await generateStories([{ file: 'src/Card.vue', pct: 0 }], mockDir, { validateStory })

    expect(callText).toHaveBeenCalledTimes(5)
    expect(validateStory).toHaveBeenCalledTimes(5)
  })

  it('writes without validation when no local vitest is found (validated: false)', async () => {
    vi.mocked(callText).mockResolvedValue(CSF3_CODE)
    const validateStory = vi.fn().mockReturnValue({ validated: false, passed: true, errors: '' })

    await generateStories([{ file: 'src/Card.vue', pct: 0 }], mockDir, { validateStory })

    expect(writeFileSync).toHaveBeenCalledTimes(1)
    expect(callText).toHaveBeenCalledTimes(1) // жодного retry — прийнято одразу
    expect(rmSync).not.toHaveBeenCalled()
  })

  it('retries when the LLM returns no valid default export', async () => {
    vi.mocked(callText).mockResolvedValueOnce('no code fences here').mockResolvedValueOnce(CSF3_CODE)
    const validateStory = vi.fn().mockReturnValue({ validated: true, passed: true, errors: '' })

    await generateStories([{ file: 'src/Card.vue', pct: 0 }], mockDir, { validateStory })

    expect(callText).toHaveBeenCalledTimes(2)
    const retryPrompt = vi.mocked(callText).mock.calls[1][0]
    expect(retryPrompt).toContain('default export')
  })

  it('propagates memory-guard errors without retrying', async () => {
    const memErr = new Error('omlx memory guard: prefill would require too much RAM')
    vi.mocked(callText).mockRejectedValue(memErr)

    await expect(generateStories([{ file: 'src/Card.vue', pct: 0 }], mockDir, {})).rejects.toThrow(memErr.message)

    expect(callText).toHaveBeenCalledTimes(1)
  })

  it('stops after STORY_MAX_ATTEMPTS on repeated LLM errors (non-memory)', async () => {
    vi.mocked(callText).mockRejectedValue(new Error('rate limited'))

    await generateStories([{ file: 'src/Card.vue', pct: 0 }], mockDir, {})

    expect(callText).toHaveBeenCalledTimes(5)
  })

  it('falls back to the real runStoryValidate (bundled shim → validated:false) when no validateStory injected', async () => {
    vi.mocked(callText).mockResolvedValue(CSF3_CODE)
    vi.mocked(resolveVitestRun).mockReturnValue({ bin: '/bundled/vitest.mjs', configArgs: ['--config', 'shim.mjs'] })

    await generateStories([{ file: 'src/Card.vue', pct: 0 }], mockDir, {})

    expect(writeFileSync).toHaveBeenCalledTimes(1)
    expect(callText).toHaveBeenCalledTimes(1)
  })

  it('processes multiple files independently, each as its own chain unit', async () => {
    vi.mocked(callText).mockResolvedValue(CSF3_CODE)
    const validateStory = vi.fn().mockReturnValue({ validated: true, passed: true, errors: '' })

    await generateStories(
      [
        { file: 'src/Card.vue', pct: 0 },
        { file: 'src/Button.vue', pct: 20 }
      ],
      mockDir,
      { validateStory }
    )

    expect(callText).toHaveBeenCalledTimes(2)
    expect(validateStory).toHaveBeenCalledWith(mockDir, 'src/Card.stories.js')
    expect(validateStory).toHaveBeenCalledWith(mockDir, 'src/Button.stories.js')
  })
})
