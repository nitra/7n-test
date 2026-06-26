import { vi, describe, it, expect, beforeEach } from 'vitest'
import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { fixSurvivedMutants, buildFixPrompt } from './coverage-fix.mjs'

vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }))
vi.mock('node:child_process', () => ({ spawnSync: vi.fn() }))
vi.mock('node:path', () => ({ join: vi.fn((...a) => a.join('/')) }))

const ROOT = '/proj'
const survived = [
  {
    file: 'src/util.js',
    mutants: [{ line: 5, col: 2, mutantType: 'BooleanLiteral', original: 'true', replacement: 'false' }],
    exampleTest: null,
    recommendationText: null
  }
]

describe('coverage-fix.mjs', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('fixSurvivedMutants', () => {
    it('logs and returns early when survived is empty', async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      await fixSurvivedMutants([], ROOT)
      expect(logSpy).toHaveBeenCalledWith('✓ Всі мутанти вбиті — доповнення тестів не потрібне')
      expect(vi.mocked(spawnSync)).not.toHaveBeenCalled()
      logSpy.mockRestore()
    })

    it('calls pi agent for non-empty survived list', async () => {
      vi.mocked(readFile).mockResolvedValue('const x = true')
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await fixSurvivedMutants(survived, ROOT)

      expect(vi.mocked(spawnSync)).toHaveBeenCalledWith(
        'pi',
        expect.arrayContaining(['-p', expect.any(String), '--no-session']),
        expect.objectContaining({ cwd: ROOT, stdio: 'inherit' })
      )
      logSpy.mockRestore()
    })
  })

  describe('buildFixPrompt', () => {
    it('contains mutant details', async () => {
      vi.mocked(readFile).mockResolvedValue('line1\nline2\nline3\nline4\nline5\nline6\n')
      const prompt = await buildFixPrompt(survived, ROOT)
      expect(prompt).toContain('src/util.js')
      expect(prompt).toContain('Рядок 5')
      expect(prompt).toContain('true')
      expect(prompt).toContain('false')
    })

    it('handles missing source file gracefully', async () => {
      vi.mocked(readFile).mockRejectedValue(new Error('ENOENT'))
      const prompt = await buildFixPrompt(survived, ROOT)
      expect(prompt).toContain('src/util.js')
    })
  })
})
