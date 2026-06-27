import { vi, describe, it, expect, beforeEach } from 'vitest'
import {
  addCoverage,
  addMutation,
  formatCoverage,
  formatScore,
  renderMarkdown,
  resolveChangedScope,
  runCoverageSteps,
  runCoverageCli
} from './coverage.mjs'
import { applyVerdicts } from '../coverage-classify/apply.mjs'
import { classify } from '../coverage-classify/index.mjs'
import { collectChangedFilesSince, resolveChangedBase } from '../scripts/lib/changed-files.mjs'
import { readNCursorConfigLite } from '../scripts/lib/read-n-cursor-config-lite.mjs'

vi.mock('../coverage-classify/apply.mjs', () => ({ applyVerdicts: vi.fn() }))
vi.mock('../coverage-classify/index.mjs', () => ({ classify: vi.fn() }))
vi.mock('../scripts/lib/changed-files.mjs', () => ({
  collectChangedFilesSince: vi.fn(),
  resolveChangedBase: vi.fn()
}))
vi.mock('../scripts/lib/read-n-cursor-config-lite.mjs', () => ({
  readNCursorConfigLite: vi.fn()
}))
vi.mock('../scripts/utils/with-lock.mjs', () => ({
  withLock: vi.fn().mockResolvedValue(0)
}))
vi.mock('node:fs', () => ({ existsSync: vi.fn() }))
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn()
}))
vi.mock('node:path', () => ({
  join: vi.fn((...args) => args.join('/'))
}))
vi.mock('node:url', () => ({
  pathToFileURL: vi.fn(p => ({ href: `file://${p}` }))
}))

import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'

describe('coverage.mjs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(existsSync).mockReturnValue(false)
    vi.mocked(readFile).mockResolvedValue('{}')
    vi.mocked(writeFile).mockResolvedValue(undefined)
    vi.mocked(resolveChangedBase).mockReturnValue('HEAD~1')
    vi.mocked(collectChangedFilesSince).mockReturnValue(['src/a.js'])
    vi.mocked(readNCursorConfigLite).mockResolvedValue({ rules: [], disableRules: [] })
  })

  describe('addCoverage', () => {
    it('should correctly sum coverage totals', () => {
      const a = { lines: { covered: 5, total: 10 }, functions: { covered: 2, total: 5 } }
      const b = { lines: { covered: 3, total: 5 }, functions: { covered: 1, total: 2 } }
      const result = addCoverage(a, b)
      expect(result.lines.covered).toBe(8)
      expect(result.lines.total).toBe(15)
      expect(result.functions.covered).toBe(3)
      expect(result.functions.total).toBe(7)
    })
  })

  describe('addMutation', () => {
    it('should correctly sum mutation counts', () => {
      const a = { caught: 5, total: 10 }
      const b = { caught: 2, total: 4 }
      const result = addMutation(a, b)
      expect(result.caught).toBe(7)
      expect(result.total).toBe(14)
    })
  })

  describe('formatCoverage', () => {
    it('should format coverage correctly when total > 0', () => {
      expect(formatCoverage({ covered: 8, total: 10 })).toBe('80.00% (8/10)')
    })

    it('should handle zero total case', () => {
      expect(formatCoverage({ covered: 0, total: 0 })).toBe('— (0/0)')
    })

    it('should format coverage correctly for exact percentage', () => {
      expect(formatCoverage({ covered: 50, total: 100 })).toBe('50.00% (50/100)')
    })

    it('should format coverage correctly for non-integer percentage', () => {
      // 1/3 * 100 = 33.3333...
      expect(formatCoverage({ covered: 1, total: 3 })).toBe('33.33% (1/3)')
    })
  })

  describe('formatScore', () => {
    it('should format score correctly when total > 0', () => {
      expect(formatScore({ caught: 8, total: 10 })).toBe('80.00%')
    })

    it('should handle zero total case', () => {
      expect(formatScore({ caught: 0, total: 0 })).toBe('—')
    })
  })

  describe('renderMarkdown', () => {
    it('should render basic markdown without survived mutants', () => {
      const rows = [
        {
          area: 'rule1',
          coverage: { lines: { covered: 10, total: 10 }, functions: { covered: 5, total: 5 } },
          mutation: { caught: 10, total: 10 }
        }
      ]

      const markdown = renderMarkdown(rows)
      expect(markdown).toContain('# Coverage')
      expect(markdown).toContain('| rule1 | 100.00% (10/10) | 100.00% (5/5) | 10/10 | 100.00% |')
      expect(markdown).not.toContain('## Вцілілі мутанти')
      expect(markdown).not.toContain('## Allowed gaps')
    })

    it('should render markdown including survived mutants', () => {
      const survivedMutants = [
        {
          file: 'test.js',
          mutants: [
            {
              line: 10,
              col: 0,
              mutantType: 'AOR',
              original: 'a',
              replacement: 'b'
            }
          ],
          exampleTest: {
            testFile: 'test.spec.js',
            code: "test('example', () => expect(true))"
          },
          recommendationText: 'Перевірте цей варіант.'
        }
      ]
      const rows = [
        {
          area: 'rule1',
          coverage: { lines: { covered: 5, total: 10 }, functions: { covered: 1, total: 2 } },
          mutation: { caught: 5, total: 10 },
          survived: survivedMutants
        }
      ]

      const markdown = renderMarkdown(rows)
      expect(markdown).toContain('# Coverage')
      expect(markdown).toContain('## Вцілілі мутанти')
      expect(markdown).toContain('### test.js')
      expect(markdown).toContain('| 10 | `a` | `b` | AOR |')
      expect(markdown).toContain('**Приклад тесту** (`test.spec.js`):')
      expect(markdown).toContain("test('example', () => expect(true))")
    })

    it('should render survived mutant without exampleTest', () => {
      const survived = [
        { file: 'a.js', mutants: [{ line: 1, col: 0, mutantType: 'SR', original: 'x', replacement: 'y' }] }
      ]
      const rows = [
        {
          area: 'r',
          coverage: { lines: { covered: 0, total: 1 }, functions: { covered: 0, total: 1 } },
          mutation: { caught: 0, total: 1 },
          survived
        }
      ]
      const markdown = renderMarkdown(rows)
      expect(markdown).toContain('### a.js')
      expect(markdown).not.toContain('**Приклад тесту**')
    })

    it('should render allowed gaps section', () => {
      const rows = [
        {
          area: 'r',
          coverage: { lines: { covered: 5, total: 10 }, functions: { covered: 1, total: 2 } },
          mutation: { caught: 5, total: 10 }
        }
      ]
      const allowedGaps = [
        {
          file: 'src/util.js',
          mutant: { line: 5, original: 'a || b', replacement: 'a && b' },
          verdict: { verdict: 'equivalent', confidence: 0.9, reason: 'always true' }
        }
      ]
      const markdown = renderMarkdown(rows, allowedGaps)
      expect(markdown).toContain('## Allowed gaps')
      expect(markdown).toContain('### src/util.js')
      expect(markdown).toContain('equivalent')
      expect(markdown).toContain('0.90')
    })

    it('should sanitize pipe chars in verdict reason', () => {
      const rows = [
        {
          area: 'r',
          coverage: { lines: { covered: 1, total: 1 }, functions: { covered: 1, total: 1 } },
          mutation: { caught: 1, total: 1 }
        }
      ]
      const allowedGaps = [
        {
          file: 'f.js',
          mutant: { line: 1, original: 'x', replacement: 'y' },
          verdict: { verdict: 'glue', confidence: 1.0, reason: 'a|b pipe test' }
        }
      ]
      const markdown = renderMarkdown(rows, allowedGaps)
      expect(markdown).not.toMatch(/(?<!\|) a\|b /)
    })
  })

  describe('resolveChangedScope', () => {
    it('should return base and files from mocked dependencies', () => {
      const result = resolveChangedScope('/cwd')
      expect(result.base).toBe('HEAD~1')
      expect(result.files).toEqual(['src/a.js'])
    })
  })

  describe('runCoverageSteps', () => {
    it('should return 1 when rulesDir is not found (existsSync returns false)', async () => {
      vi.mocked(existsSync).mockReturnValue(false)
      const code = await runCoverageSteps({ cwd: '/cwd', rulesDir: null })
      expect(code).toBe(1)
    })

    it('should return 1 when no providers found (existsSync false skips provider load)', async () => {
      vi.mocked(existsSync).mockReturnValue(false)
      vi.mocked(readNCursorConfigLite).mockResolvedValue({ rules: ['rule1'], disableRules: [] })
      const code = await runCoverageSteps({ cwd: '/cwd', rulesDir: '/rules' })
      expect(code).toBe(1)
    })

    it('should return 0 for changed mode with no rows', async () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readNCursorConfigLite).mockResolvedValue({ rules: [], disableRules: [] })
      const code = await runCoverageSteps({ cwd: '/cwd', rulesDir: '/rules', changed: true })
      expect(code).toBe(0)
    })
  })

  describe('runCoverageCli', () => {
    it('should call withLock and return exit code', async () => {
      const { withLock } = await import('../scripts/utils/with-lock.mjs')
      vi.mocked(withLock).mockResolvedValue(1)
      const code = await runCoverageCli({ cwd: '/cwd', rulesDir: '/rules' })
      expect(code).toBe(1)
    })

    it('should call withLock twice when code=0 and fix=true', async () => {
      const { withLock } = await import('../scripts/utils/with-lock.mjs')
      vi.mocked(withLock).mockResolvedValue(0)
      await runCoverageCli({ cwd: '/cwd', rulesDir: '/rules', fix: true })
      expect(vi.mocked(withLock)).toHaveBeenCalledTimes(2)
    })

    it('should not call withLock twice when code=1 and fix=true', async () => {
      const { withLock } = await import('../scripts/utils/with-lock.mjs')
      vi.mocked(withLock).mockResolvedValue(1)
      const code = await runCoverageCli({ cwd: '/cwd', rulesDir: '/rules', fix: true })
      expect(vi.mocked(withLock)).toHaveBeenCalledTimes(1)
      expect(code).toBe(1)
    })
  })
})
