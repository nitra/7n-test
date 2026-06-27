import { vi, describe, it, expect, beforeEach } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { measureCoveragePerFile, getUncoveredFiles, findSourceFiles } from './coverage-per-file.mjs'

vi.mock('node:fs', () => ({ existsSync: vi.fn(), readFileSync: vi.fn() }))
vi.mock('node:fs/promises', () => ({ mkdtemp: vi.fn(), rm: vi.fn(), readdir: vi.fn() }))
vi.mock('node:child_process', () => ({ spawnSync: vi.fn() }))
vi.mock('node:os', () => ({ tmpdir: () => '/tmp' }))
vi.mock('node:path', () => ({
  join: vi.fn((...a) => a.join('/')),
  relative: vi.fn((root, p) => p.replace(root + '/', '')),
  dirname: vi.fn(p => p.split('/').slice(0, -1).join('/'))
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

const SAMPLE_JSON_RESULTS = JSON.stringify({
  testResults: [
    {
      name: '/proj/src/a.test.js',
      status: 'passed',
      assertionResults: [{ status: 'passed', title: 'works', ancestorTitles: [] }]
    }
  ]
})

const SAMPLE_JSON_RESULTS_FAILING = JSON.stringify({
  testResults: [
    {
      name: '/proj/src/b.test.js',
      status: 'failed',
      assertionResults: [
        {
          status: 'failed',
          title: 'does something',
          ancestorTitles: ['b'],
          failureMessages: ['Expected 1 to equal 2']
        }
      ]
    }
  ]
})

describe('coverage-per-file.mjs', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('measureCoveragePerFile', () => {
    it('returns { files, failingTests } from lcov.info and json results', async () => {
      vi.mocked(mkdtemp).mockResolvedValue('/tmp/7n-cov-xxx')
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readFileSync).mockImplementation(p => {
        if (String(p).endsWith('test-results.json')) return SAMPLE_JSON_RESULTS
        return SAMPLE_LCOV
      })
      vi.mocked(rm).mockResolvedValue(undefined)

      const result = await measureCoveragePerFile('/proj')

      expect(vi.mocked(spawnSync)).toHaveBeenCalledWith(
        expect.stringContaining('node'),
        expect.arrayContaining(['run', '--coverage', '--coverage.reporter=lcov', '--reporter=json']),
        expect.objectContaining({ cwd: '/proj' })
      )
      expect(result).toHaveProperty('files')
      expect(result).toHaveProperty('failingTests')
      expect(result.files).toHaveLength(2)
      expect(result.files[0].pct).toBe(80)
      expect(result.files[1].pct).toBe(0)
      expect(result.failingTests).toHaveLength(0)
    })

    it('returns failing tests when json reports failures', async () => {
      vi.mocked(mkdtemp).mockResolvedValue('/tmp/7n-cov-xxx')
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readFileSync).mockImplementation(p => {
        if (String(p).endsWith('test-results.json')) return SAMPLE_JSON_RESULTS_FAILING
        return SAMPLE_LCOV
      })
      vi.mocked(rm).mockResolvedValue(undefined)

      const result = await measureCoveragePerFile('/proj')

      expect(result.failingTests).toHaveLength(1)
      expect(result.failingTests[0].file).toBe('src/b.test.js')
      expect(result.failingTests[0].errors[0]).toContain('b > does something')
    })

    it('returns { files: [], failingTests: [] } when lcov.info is missing and no json', async () => {
      vi.mocked(mkdtemp).mockResolvedValue('/tmp/7n-cov-xxx')
      vi.mocked(existsSync).mockReturnValue(false)
      vi.mocked(rm).mockResolvedValue(undefined)

      const result = await measureCoveragePerFile('/proj')
      expect(result).toEqual({ files: [], failingTests: [] })
    })

    it('returns failingTests even when lcov.info is missing', async () => {
      vi.mocked(mkdtemp).mockResolvedValue('/tmp/7n-cov-xxx')
      vi.mocked(existsSync).mockImplementation(p => String(p).endsWith('test-results.json'))
      vi.mocked(readFileSync).mockImplementation(() => SAMPLE_JSON_RESULTS_FAILING)
      vi.mocked(rm).mockResolvedValue(undefined)

      const result = await measureCoveragePerFile('/proj')
      expect(result.files).toEqual([])
      expect(result.failingTests).toHaveLength(1)
    })

    it('detects module-level suite errors (empty assertionResults)', async () => {
      const suiteErrorJson = JSON.stringify({
        testResults: [
          {
            name: '/proj/src/index.test.mjs',
            status: 'failed',
            message: 'Error: vi.spyOn() can only spy on a function. Received object.',
            assertionResults: []
          }
        ]
      })
      vi.mocked(mkdtemp).mockResolvedValue('/tmp/7n-cov-xxx')
      vi.mocked(existsSync).mockImplementation(p => String(p).endsWith('test-results.json'))
      vi.mocked(readFileSync).mockImplementation(() => suiteErrorJson)
      vi.mocked(rm).mockResolvedValue(undefined)

      const result = await measureCoveragePerFile('/proj')
      expect(result.failingTests).toHaveLength(1)
      expect(result.failingTests[0].file).toBe('src/index.test.mjs')
      expect(result.failingTests[0].errors[0]).toContain('Suite error')
      expect(result.failingTests[0].errors[0]).toContain('vi.spyOn')
    })
  })

  describe('getUncoveredFiles', () => {
    it('includes files below threshold', () => {
      const files = [
        { file: 'a.js', pct: 79 },
        { file: 'b.js', pct: 80 },
        { file: 'd.js', pct: 50 }
      ]
      const result = getUncoveredFiles(files, 80)
      expect(result.map(f => f.file)).toEqual(['a.js', 'd.js'])
    })

    it('returns [] when all files meet threshold', () => {
      expect(getUncoveredFiles([{ file: 'a.js', pct: 100 }], 80)).toEqual([])
    })
  })

  describe('findSourceFiles', () => {
    function makeEntry(name, isDirectory = false) {
      return { name, isDirectory: () => isDirectory, isFile: () => !isDirectory }
    }

    it('returns source files excluding tests and node_modules', async () => {
      vi.mocked(readdir)
        .mockResolvedValueOnce([
          makeEntry('src', true),
          makeEntry('node_modules', true),
          makeEntry('index.js')
        ])
        .mockResolvedValueOnce([
          makeEntry('a.mjs'),
          makeEntry('a.test.mjs'),
          makeEntry('b.ts')
        ])

      const result = await findSourceFiles('/proj')
      expect(result).toContain('index.js')
      expect(result).toContain('src/a.mjs')
      expect(result).toContain('src/b.ts')
      expect(result).not.toContain('src/a.test.mjs')
      expect(result.some(f => f.includes('node_modules'))).toBe(false)
    })

    it('returns empty array when no source files exist', async () => {
      vi.mocked(readdir).mockResolvedValue([])
      const result = await findSourceFiles('/proj')
      expect(result).toEqual([])
    })

    it('skips hidden directories', async () => {
      vi.mocked(readdir).mockResolvedValueOnce([
        makeEntry('.git', true),
        makeEntry('src.js')
      ])
      const result = await findSourceFiles('/proj')
      expect(result).toEqual(['src.js'])
    })
  })
})
