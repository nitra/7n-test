import { vi, describe, it, expect, beforeEach } from 'vitest'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { buildGenTestsPrompt, generateTests, findTestRules } from './gen-tests.mjs'

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn()
}))
vi.mock('node:path', () => ({
  join: vi.fn((...a) => a.join('/')),
  relative: vi.fn((base, full) => {
    if (full.startsWith(base + '/')) return full.slice(base.length + 1)
    const b = base.split('/').filter(Boolean)
    const f = full.split('/').filter(Boolean)
    let common = 0
    while (common < b.length && common < f.length && b[common] === f[common]) common++
    return [...Array(b.length - common).fill('..'), ...f.slice(common)].join('/')
  }),
  dirname: vi.fn(p => p.split('/').slice(0, -1).join('/'))
}))
vi.mock('./lib/pi-client.mjs', () => ({ callText: vi.fn() }))
vi.mock('./classify-exports.mjs', () => ({
  extractExportsWithComplexity: vi.fn().mockReturnValue([])
}))

import { callText } from './lib/pi-client.mjs'
import { extractExportsWithComplexity } from './classify-exports.mjs'

const mockDir = '/proj'
const mockFile = 'src/a.js'
const LOCAL_MODEL = 'ollama/qwen2.5-coder:7b'

describe('buildGenTestsPrompt', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should include file path and coverage info in prompt', () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('const x = 1')
    const files = [{ file: mockFile, pct: 50, reason: 'Low coverage' }]
    const prompt = buildGenTestsPrompt(files, mockDir)
    expect(prompt).toContain(mockFile)
    expect(prompt).toContain('50')
  })

  it('should truncate source over 6000 bytes', () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('A'.repeat(6001))
    const files = [{ file: mockFile, pct: 80, reason: 'some reason' }]
    const prompt = buildGenTestsPrompt(files, mockDir)
    expect(prompt).toContain('(truncated)')
  })

  it('should handle missing source file', () => {
    vi.mocked(existsSync).mockReturnValue(false)
    const files = [{ file: mockFile, pct: 0, reason: 'no file' }]
    const prompt = buildGenTestsPrompt(files, mockDir)
    expect(typeof prompt).toBe('string')
  })
})

describe('findTestRules', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when n-test.mdc not found', () => {
    vi.mocked(existsSync).mockReturnValue(false)
    expect(findTestRules('/proj')).toBeNull()
  })

  it('returns file content without YAML frontmatter when found', () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('---\ntitle: rules\n---\n## Правила\n- тест у tests/')
    const result = findTestRules('/proj')
    expect(result).toContain('## Правила')
    expect(result).not.toContain('---')
  })
})

// ---------------------------------------------------------------------------
// generateTests — single-file mode (no local model configured)
// ---------------------------------------------------------------------------

describe('generateTests — single-file mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.N_TEST_LOCAL_MODEL
    vi.mocked(extractExportsWithComplexity).mockReturnValue([])
  })

  it('writes test file when pi returns code', async () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('const x = 1')
    vi.mocked(callText).mockResolvedValue("```js\ntest('a', () => {})\n```")
    await generateTests([{ file: mockFile, pct: 50, reason: 'low' }], mockDir)
    expect(writeFileSync).toHaveBeenCalled()
  })

  it('skips write when pi returns no code block', async () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('const x = 1')
    vi.mocked(callText).mockResolvedValue('no code here')
    await generateTests([{ file: mockFile, pct: 50, reason: 'low' }], mockDir)
    expect(writeFileSync).not.toHaveBeenCalled()
  })

  it('prompt includes TypeScript prohibition and env mocking rules', async () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('const x = 1')
    vi.mocked(callText).mockResolvedValue('')
    await generateTests([{ file: mockFile, pct: 0, reason: '' }], mockDir)
    const prompt = vi.mocked(callText).mock.calls[0][0]
    expect(prompt).toContain('.mjs = чистий JavaScript')
    expect(prompt).toContain('as Type')
    expect(prompt).toContain('vi.mocked(fn)')
    expect(prompt).toContain('vi.stubEnv')
    expect(prompt).toContain('vi.useFakeTimers')
  })

  it('prompt contains testFilePath and importPath', async () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('const x = 1')
    vi.mocked(callText).mockResolvedValue('')
    // src/a.js → test at src/tests/a.test.mjs → import path = ../a.js
    await generateTests([{ file: mockFile, pct: 0, reason: '' }], mockDir)
    const prompt = vi.mocked(callText).mock.calls[0][0]
    expect(prompt).toContain('../a.js')
    expect(prompt).toContain('src/tests/a.test.mjs')
  })

  it('prompt includes exports list when source has named exports', async () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('export function foo() {}\nexport const bar = 1')
    vi.mocked(callText).mockResolvedValue('')
    await generateTests([{ file: mockFile, pct: 0, reason: '' }], mockDir)
    const prompt = vi.mocked(callText).mock.calls[0][0]
    expect(prompt).toContain('foo')
    expect(prompt).toContain('bar')
    expect(prompt).toContain('Тестуй ЛИШЕ публічний API (exports)')
  })

  it('prompt warns about side-effects when top-level call detected', async () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('checkEnv([...])\nexport function send() {}')
    vi.mocked(callText).mockResolvedValue('')
    await generateTests([{ file: mockFile, pct: 0, reason: '' }], mockDir)
    const prompt = vi.mocked(callText).mock.calls[0][0]
    expect(prompt).toContain('side-effect')
    expect(prompt).toContain('await import(')
  })

  it('prompt includes n-test.mdc rules when found in project', async () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync)
      .mockReturnValueOnce('const x = 1')
      .mockReturnValue('## Правила\n- тести у tests/')
    vi.mocked(callText).mockResolvedValue('')
    await generateTests([{ file: mockFile, pct: 0, reason: '' }], mockDir)
    const prompt = vi.mocked(callText).mock.calls[0][0]
    expect(prompt).toContain('Конвенції тестів цього проєкту')
    expect(prompt).toContain('тести у tests/')
  })
})

// ---------------------------------------------------------------------------
// generateTests — per-export mode (opts.localModel provided)
// ---------------------------------------------------------------------------

describe('generateTests — per-export mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.N_TEST_LOCAL_MODEL
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('export function foo() {}\nexport const BAR = 42')
  })

  it('generates header via cloud when localModel is set', async () => {
    vi.mocked(extractExportsWithComplexity).mockReturnValue([
      { name: 'foo', complexity: 'simple' }
    ])
    vi.mocked(callText).mockResolvedValue("```js\nimport { vi } from 'vitest'\n```")

    await generateTests([{ file: mockFile, pct: 0, reason: '' }], mockDir, {
      localModel: LOCAL_MODEL
    })

    expect(callText).toHaveBeenCalled()
    const [headerPrompt, headerOpts] = vi.mocked(callText).mock.calls[0]
    expect(headerPrompt).toContain('header')
    expect(headerPrompt).toContain('без describe')
    // header call uses cloud (no model override)
    expect(headerOpts?.model).toBeUndefined()
  })

  it('routes simple exports to local pi model', async () => {
    vi.mocked(extractExportsWithComplexity).mockReturnValue([
      { name: 'foo', complexity: 'simple' }
    ])
    vi.mocked(callText).mockResolvedValue("```js\nimport { vi } from 'vitest'\n```")

    await generateTests([{ file: mockFile, pct: 0, reason: '' }], mockDir, {
      localModel: LOCAL_MODEL
    })

    // Second call (block for 'foo') should use the local model
    const calls = vi.mocked(callText).mock.calls
    expect(calls.length).toBeGreaterThanOrEqual(2)
    const blockCall = calls.find(([, opts]) => opts?.model === LOCAL_MODEL)
    expect(blockCall).toBeDefined()
    expect(blockCall[0]).toContain('foo')
  })

  it('falls back to cloud when local block is invalid (contains require)', async () => {
    vi.mocked(extractExportsWithComplexity).mockReturnValue([
      { name: 'foo', complexity: 'simple' }
    ])
    vi.mocked(callText)
      .mockResolvedValueOnce("```js\nimport { vi } from 'vitest'\n```") // header (cloud)
      .mockResolvedValueOnce("```js\nconst x = require('x')\ndescribe('foo', () => {})\n```") // local
      .mockResolvedValueOnce("```js\ndescribe('foo', () => { it('ok', () => {}) })\n```") // cloud fallback

    await generateTests([{ file: mockFile, pct: 0, reason: '' }], mockDir, {
      localModel: LOCAL_MODEL
    })

    const calls = vi.mocked(callText).mock.calls
    // header + local attempt + cloud fallback = 3 calls
    expect(calls).toHaveLength(3)
    // Third call is cloud fallback (no model option)
    expect(calls[2][1]?.model).toBeUndefined()
  })

  it('routes complex exports directly to cloud without local call', async () => {
    vi.mocked(extractExportsWithComplexity).mockReturnValue([
      { name: 'send', complexity: 'complex' }
    ])
    vi.mocked(callText).mockResolvedValue("```js\nimport { vi } from 'vitest'\n```")

    await generateTests([{ file: mockFile, pct: 0, reason: '' }], mockDir, {
      localModel: LOCAL_MODEL
    })

    const calls = vi.mocked(callText).mock.calls
    // header + 'send' block = 2 calls, neither uses local model
    expect(calls).toHaveLength(2)
    expect(calls.every(([, opts]) => opts?.model !== LOCAL_MODEL)).toBe(true)
  })

  it('writes merged file when header and blocks succeed', async () => {
    vi.mocked(extractExportsWithComplexity).mockReturnValue([
      { name: 'foo', complexity: 'trivial' }
    ])
    vi.mocked(callText)
      .mockResolvedValueOnce("```js\nimport { vi } from 'vitest'\n```") // header
      .mockResolvedValueOnce("```js\ndescribe('foo', () => { it('ok', () => {}) })\n```") // local block

    await generateTests([{ file: mockFile, pct: 0, reason: '' }], mockDir, {
      localModel: LOCAL_MODEL
    })

    expect(writeFileSync).toHaveBeenCalledOnce()
    const written = vi.mocked(writeFileSync).mock.calls[0][1]
    expect(written).toContain("import { vi }")
    expect(written).toContain("describe('foo'")
  })

  it('falls back to single-file mode when extractExportsWithComplexity returns empty', async () => {
    vi.mocked(extractExportsWithComplexity).mockReturnValue([])
    vi.mocked(callText).mockResolvedValue("```js\ntest('a', () => {})\n```")

    await generateTests([{ file: mockFile, pct: 0, reason: '' }], mockDir, {
      localModel: LOCAL_MODEL
    })

    // Empty exports → single-file cloud mode (one call, no model override)
    expect(callText).toHaveBeenCalledOnce()
    expect(vi.mocked(callText).mock.calls[0][1]?.model).toBeUndefined()
  })

  it('uses localModel from N_TEST_LOCAL_MODEL env when no opts.localModel', async () => {
    process.env.N_TEST_LOCAL_MODEL = LOCAL_MODEL
    vi.mocked(extractExportsWithComplexity).mockReturnValue([
      { name: 'foo', complexity: 'simple' }
    ])
    vi.mocked(callText).mockResolvedValue("```js\nimport { vi } from 'vitest'\n```")

    await generateTests([{ file: mockFile, pct: 0, reason: '' }], mockDir)

    const localCall = vi.mocked(callText).mock.calls.find(([, opts]) => opts?.model === LOCAL_MODEL)
    expect(localCall).toBeDefined()

    delete process.env.N_TEST_LOCAL_MODEL
  })

  it('opts.localModel = null forces cloud-only even when env is set', async () => {
    process.env.N_TEST_LOCAL_MODEL = LOCAL_MODEL
    vi.mocked(extractExportsWithComplexity).mockReturnValue([
      { name: 'foo', complexity: 'simple' }
    ])
    vi.mocked(callText).mockResolvedValue("```js\ntest('a', () => {})\n```")

    await generateTests([{ file: mockFile, pct: 0, reason: '' }], mockDir, { localModel: null })

    const allModels = vi.mocked(callText).mock.calls.map(([, o]) => o?.model)
    expect(allModels.every(m => !m)).toBe(true)

    delete process.env.N_TEST_LOCAL_MODEL
  })
})
