import { vi, describe, it, expect, beforeEach } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
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
vi.mock('./lib/pi-client.mjs', () => ({ callText: vi.fn() }))

const mockDir = '/proj'
const mockFiles = [
  { file: 'src/a.js', pct: 50, reason: 'Low coverage' },
  { file: 'src/b.js', pct: 10, reason: '' },
]

describe('gen-tests.mjs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(existsSync).mockReturnValue(false)
  })

  describe('buildGenTestsPrompt', () => {
    it('includes file sections', () => {
      const prompt = buildGenTestsPrompt(mockFiles, mockDir)
      expect(prompt).toContain('### `src/a.js` (покриття: 50.0%)')
      expect(prompt).toContain('Причина: Low coverage')
      expect(prompt).toContain('### `src/b.js` (покриття: 10.0%)')
    })

    it('includes file content when readable', () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readFileSync).mockReturnValue('export const x = 1')
      const prompt = buildGenTestsPrompt([mockFiles[0]], mockDir)
      expect(prompt).toContain('export const x = 1')
    })
  })

  describe('generateTests', () => {
    it('does nothing when files list is empty', async () => {
      const generateOne = vi.fn()
      await generateTests([], mockDir, { generateOne })
      expect(generateOne).not.toHaveBeenCalled()
    })

    it('calls generateOne for each file', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const generateOne = vi.fn().mockResolvedValue('/proj/src/a.test.mjs')
      await generateTests(mockFiles, mockDir, { generateOne })
      expect(generateOne).toHaveBeenCalledTimes(2)
      expect(generateOne).toHaveBeenCalledWith(mockFiles[0], mockDir)
      expect(generateOne).toHaveBeenCalledWith(mockFiles[1], mockDir)
      consoleSpy.mockRestore()
    })
  })
})
