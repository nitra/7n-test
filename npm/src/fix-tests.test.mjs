import { vi, describe, it, expect, beforeEach } from 'vitest'
import { getFailingTests, buildFixTestsPrompt, fixFailingTests } from './fix-tests.mjs'

vi.mock('node:child_process', () => ({ spawnSync: vi.fn() }))
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn()
}))
vi.mock('node:fs/promises', () => ({
  mkdtemp: vi.fn().mockResolvedValue('/tmp/7n-fix-test'),
  rm: vi.fn().mockResolvedValue(undefined)
}))
vi.mock('node:os', () => ({ tmpdir: vi.fn(() => '/tmp') }))
vi.mock('node:path', () => ({
  join: vi.fn((...args) => args.join('/')),
  relative: vi.fn((base, full) => full.replace(base + '/', '')),
  dirname: vi.fn(p => p.split('/').slice(0, -1).join('/'))
}))

import * as fs from 'node:fs'

const mockDir = '/proj'

const mockVitestResult = {
  numTotalTestSuites: 2,
  numFailedTestSuites: 1,
  testResults: [
    {
      testFilePath: '/proj/src/foo.test.mjs',
      status: 'failed',
      assertionResults: [
        {
          ancestorTitles: ['foo'],
          title: 'should return bar',
          status: 'failed',
          failureMessages: ['AssertionError: expected 1 to equal 2\n  at foo.test.mjs:5:10']
        }
      ]
    },
    {
      testFilePath: '/proj/src/ok.test.mjs',
      status: 'passed',
      assertionResults: []
    }
  ]
}

describe('getFailingTests', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty array when outputFile does not exist', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false)
    const result = await getFailingTests(mockDir)
    expect(result).toEqual([])
  })

  it('returns failing files with errors parsed from JSON', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockVitestResult))

    const result = await getFailingTests(mockDir)

    expect(result).toHaveLength(1)
    expect(result[0].file).toBe('src/foo.test.mjs')
    expect(result[0].errors).toHaveLength(1)
    expect(result[0].errors[0]).toContain('foo > should return bar')
    expect(result[0].errors[0]).toContain('AssertionError')
  })

  it('excludes passed test files', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockVitestResult))

    const result = await getFailingTests(mockDir)
    expect(result.every(f => f.file !== 'src/ok.test.mjs')).toBe(true)
  })

  it('returns empty array when JSON is empty', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ testResults: [] }))
    const result = await getFailingTests(mockDir)
    expect(result).toEqual([])
  })

  it('returns empty array on JSON parse error', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue('not-json')
    const result = await getFailingTests(mockDir)
    expect(result).toEqual([])
  })
})

describe('buildFixTestsPrompt', () => {
  it('includes failing file names', () => {
    const prompt = buildFixTestsPrompt([{ file: 'src/foo.test.mjs', errors: ['foo > bar:\nAssertionError'] }])
    expect(prompt).toContain('src/foo.test.mjs')
    expect(prompt).toContain('AssertionError')
  })

  it('includes pi agent instructions', () => {
    const prompt = buildFixTestsPrompt([{ file: 'x.test.mjs', errors: ['err'] }])
    expect(prompt).toContain('bunx vitest run')
    expect(prompt).toContain('source-файли не чіпай')
  })

  it('handles multiple failing files', () => {
    const prompt = buildFixTestsPrompt([
      { file: 'a.test.mjs', errors: ['err1'] },
      { file: 'b.test.mjs', errors: ['err2'] }
    ])
    expect(prompt).toContain('a.test.mjs')
    expect(prompt).toContain('b.test.mjs')
  })
})

describe('fixFailingTests', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns count=0 when no failures', async () => {
    const result = await fixFailingTests(mockDir, { failures: [] })
    expect(result).toEqual({ count: 0, fixed: 0, remaining: 0 })
  })

  it('calls pi agent when there are failures', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ testResults: [] }))

    const mockCallPi = vi.fn()
    const failures = [{ file: 'src/foo.test.mjs', errors: ['err'] }]

    const result = await fixFailingTests(mockDir, { failures, callPi: mockCallPi })

    expect(mockCallPi).toHaveBeenCalledOnce()
    expect(mockCallPi).toHaveBeenCalledWith(expect.stringContaining('src/foo.test.mjs'), expect.any(String), mockDir)
  })

  it('returns correct fixed/remaining counts', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ testResults: [] }))

    const failures = [
      { file: 'a.test.mjs', errors: ['err'] },
      { file: 'b.test.mjs', errors: ['err'] }
    ]

    const result = await fixFailingTests(mockDir, { failures, callPi: vi.fn() })

    expect(result.count).toBe(2)
    expect(result.fixed).toBe(2)
    expect(result.remaining).toBe(0)
  })

  it('reports remaining failures when agent cannot fix all', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        testResults: [
          {
            testFilePath: '/proj/b.test.mjs',
            status: 'failed',
            assertionResults: [
              { ancestorTitles: [], title: 'still failing', status: 'failed', failureMessages: ['err'] }
            ]
          }
        ]
      })
    )

    const failures = [
      { file: 'a.test.mjs', errors: ['err'] },
      { file: 'b.test.mjs', errors: ['err'] }
    ]

    const result = await fixFailingTests(mockDir, { failures, callPi: vi.fn() })

    expect(result.count).toBe(2)
    expect(result.fixed).toBe(1)
    expect(result.remaining).toBe(1)
  })
})
