import { vi, describe, it, expect, beforeEach } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { measureCoveragePerFile, getUncoveredFiles } from './coverage-per-file.mjs'

vi.mock('node:fs', () => ({ existsSync: vi.fn(), readFileSync: vi.fn() }))
vi.mock('node:fs/promises', () => ({ mkdtemp: vi.fn(), rm: vi.fn() }))
vi.mock('node:child_process', () => ({ spawnSync: vi.fn() }))
vi.mock('node:os', () => ({ tmpdir: () => '/tmp' }))
vi.mock('node:path', () => ({
  join: vi.fn((...a) => a.join('/')),
  relative: vi.fn((root, p) => p.replace(root + '/', ''))
}))

const SAMPLE_LCOV = `TN:
SF:/proj/src/a.js
LF:10
LH:8
end_of_record
TN:
SF:/proj/src/b.js
LF:5
LH:0
end_of_record
`

describe('coverage-per-file.mjs', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('measureCoveragePerFile', () => {
    it('returns per-file data from lcov.info', async () => {
      vi.mocked(mkdtemp).mockResolvedValue('/tmp/7n-cov-xxx')
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readFileSync).mockReturnValue(SAMPLE_LCOV)
      vi.mocked(rm).mockResolvedValue(undefined)

      const result = await measureCoveragePerFile('/proj')

      expect(vi.mocked(spawnSync)).toHaveBeenCalledWith(
        'bunx',
        expect.arrayContaining(['vitest', 'run', '--coverage', '--coverage.reporter=lcov']),
        expect.objectContaining({ cwd: '/proj' })
      )
      expect(result).toHaveLength(2)
      expect(result[0].pct).toBe(80)
      expect(result[1].pct).toBe(0)
    })

    it('returns [] when lcov.info is missing', async () => {
      vi.mocked(mkdtemp).mockResolvedValue('/tmp/7n-cov-xxx')
      vi.mocked(existsSync).mockReturnValue(false)
      vi.mocked(rm).mockResolvedValue(undefined)

      const result = await measureCoveragePerFile('/proj')
      expect(result).toEqual([])
    })
  })

  describe('getUncoveredFiles', () => {
    it('includes files below threshold', () => {
      const files = [
        { file: 'a.js', pct: 79 },
        { file: 'b.js', pct: 80 },
        { file: 'd.js', pct: 50 },
      ]
      const result = getUncoveredFiles(files, 80)
      expect(result.map(f => f.file)).toEqual(['a.js', 'd.js'])
    })

    it('returns [] when all files meet threshold', () => {
      expect(getUncoveredFiles([{ file: 'a.js', pct: 100 }], 80)).toEqual([])
    })
  })
})
