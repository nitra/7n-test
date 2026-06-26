import { vi, describe, it, expect, beforeEach } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { buildGenTestsPrompt, generateTests } from './gen-tests.mjs'

vi.mock('node:fs', () => ({ existsSync: vi.fn(), readFileSync: vi.fn() }))
vi.mock('node:child_process', () => ({ spawnSync: vi.fn() }))
vi.mock('node:path', () => ({ join: vi.fn((...a) => a.join('/')), relative: vi.fn((_, p) => p) }))

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

    it('includes vitest rule', () => {
      const prompt = buildGenTestsPrompt(mockFiles, mockDir)
      expect(prompt).toContain('vitest')
      expect(prompt).toContain('vi.mock')
    })

    it('includes file content when readable', () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readFileSync).mockReturnValue('export const x = 1')
      const prompt = buildGenTestsPrompt([mockFiles[0]], mockDir)
      expect(prompt).toContain('export const x = 1')
    })
  })

  describe('generateTests', () => {
    it('does nothing when files list is empty', () => {
      generateTests([], mockDir)
      expect(vi.mocked(spawnSync)).not.toHaveBeenCalled()
    })

    it('calls pi agent with prompt', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      generateTests(mockFiles, mockDir)
      expect(vi.mocked(spawnSync)).toHaveBeenCalledWith(
        'pi',
        expect.arrayContaining(['-p', expect.stringContaining('src/a.js')]),
        expect.objectContaining({ cwd: mockDir })
      )
      consoleSpy.mockRestore()
    })
  })
})
