import { vi, describe, it, expect, beforeEach } from 'vitest'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { buildGenTestsPrompt, generateTests } from './gen-tests.mjs'

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn()
}))
vi.mock('node:path', () => ({
  join: vi.fn((...a) => a.join('/')),
  relative: vi.fn((_, p) => p)
}))
vi.mock('./lib/pi-client.mjs', () => ({
  callText: vi.fn()
}))

import { callText } from './lib/pi-client.mjs'

const mockDir = '/proj'
const mockFile = 'src/a.js'

describe('buildGenTestsPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

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

describe('generateTests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should write test file when pi returns code', async () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('const x = 1')
    vi.mocked(callText).mockResolvedValue("```js\ntest('a', () => {})\n```")
    const files = [{ file: mockFile, pct: 50, reason: 'low' }]
    await generateTests(files, mockDir)
    expect(writeFileSync).toHaveBeenCalled()
  })

  it('should skip if pi returns no code block', async () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('const x = 1')
    vi.mocked(callText).mockResolvedValue('no code here')
    const files = [{ file: mockFile, pct: 50, reason: 'low' }]
    const written = await generateTests(files, mockDir)
    expect(writeFileSync).not.toHaveBeenCalled()
  })
})
