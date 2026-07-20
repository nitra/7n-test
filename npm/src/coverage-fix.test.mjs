import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFile } from 'node:fs/promises'
import { env } from 'node:process'
import { fixSurvivedMutants, buildFixPrompt, batchSurvived } from './coverage-fix.mjs'

vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }))
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

/**
 * Будує SurvivedFileGroup з `n` однаковими мутантами — для тестів batching-логіки,
 * де важлива лише кількість мутантів на файл, не їхній вміст.
 * @param {string} file відносний шлях файлу
 * @param {number} n кількість мутантів
 * @returns {object} SurvivedFileGroup
 */
function groupWith(file, n) {
  return {
    file,
    mutants: Array.from({ length: n }, (_, i) => ({
      line: i + 1,
      col: 0,
      mutantType: 'BooleanLiteral',
      original: 'true',
      replacement: 'false'
    })),
    exampleTest: null,
    recommendationText: null
  }
}

describe('coverage-fix.mjs', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => {
    delete env.N_CURSOR_COVERAGE_FIX_BATCH_MUTANTS
  })

  describe('batchSurvived', () => {
    it('returns empty array for empty input', () => {
      expect(batchSurvived([], 40)).toEqual([])
    })

    it('keeps groups under budget in a single batch', () => {
      const groups = [groupWith('a.js', 5), groupWith('b.js', 5)]
      expect(batchSurvived(groups, 40)).toEqual([groups])
    })

    it('splits into new batch once budget would be exceeded', () => {
      const a = groupWith('a.js', 25)
      const b = groupWith('b.js', 20)
      expect(batchSurvived([a, b], 40)).toEqual([[a], [b]])
    })

    it('keeps a single group that alone exceeds budget in its own batch (never split)', () => {
      const big = groupWith('big.js', 100)
      expect(batchSurvived([big], 40)).toEqual([[big]])
    })
  })

  describe('fixSurvivedMutants', () => {
    it('logs and returns early when survived is empty', async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {
        return
      })
      const callPi = vi.fn()
      const result = await fixSurvivedMutants([], ROOT, { callPi })
      expect(logSpy).toHaveBeenCalledWith('✓ Всі мутанти вбиті — доповнення тестів не потрібне')
      expect(callPi).not.toHaveBeenCalled()
      expect(result).toEqual({ fixed: [], failed: [] })
      logSpy.mockRestore()
    })

    it('calls pi agent for non-empty survived list', async () => {
      vi.mocked(readFile).mockResolvedValue('const x = true')
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {
        return
      })
      const callPi = vi.fn(() => Promise.resolve())

      const result = await fixSurvivedMutants(survived, ROOT, { callPi })

      expect(callPi).toHaveBeenCalledWith(expect.any(String), expect.any(String), { cwd: ROOT })
      expect(result).toEqual({ fixed: ['src/util.js'], failed: [] })
      logSpy.mockRestore()
    })

    it('splits large survived lists into multiple batches, one agent call each', async () => {
      vi.mocked(readFile).mockResolvedValue('const x = true')
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {
        return
      })
      const callPi = vi.fn(() => Promise.resolve())
      const big = [groupWith('a.js', 25), groupWith('b.js', 20)]

      const result = await fixSurvivedMutants(big, ROOT, { callPi })

      expect(callPi).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ fixed: ['a.js', 'b.js'], failed: [] })
      logSpy.mockRestore()
    })

    it('one failing batch does not block the others and is reported, not thrown', async () => {
      vi.mocked(readFile).mockResolvedValue('const x = true')
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {
        return
      })
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        return
      })
      const callPi = vi.fn().mockRejectedValueOnce(new Error('skill timeout 900000ms')).mockResolvedValueOnce()
      const big = [groupWith('a.js', 25), groupWith('b.js', 20)]

      const result = await fixSurvivedMutants(big, ROOT, { callPi })

      expect(result).toEqual({
        fixed: ['b.js'],
        failed: [{ files: ['a.js'], error: 'skill timeout 900000ms' }]
      })
      expect(callPi).toHaveBeenCalledTimes(2)
      logSpy.mockRestore()
      errSpy.mockRestore()
    })

    it('honors N_CURSOR_COVERAGE_FIX_BATCH_MUTANTS override', async () => {
      env.N_CURSOR_COVERAGE_FIX_BATCH_MUTANTS = '3'
      vi.mocked(readFile).mockResolvedValue('const x = true')
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {
        return
      })
      const callPi = vi.fn(() => Promise.resolve())
      const groups = [groupWith('a.js', 2), groupWith('b.js', 2)]

      await fixSurvivedMutants(groups, ROOT, { callPi })

      expect(callPi).toHaveBeenCalledTimes(2)
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
