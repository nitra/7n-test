import { vi, describe, it, expect, beforeEach } from 'vitest'
import { runAutoTest } from './run.mjs'

vi.mock('node:fs', () => ({ readFileSync: vi.fn() }))
vi.mock('./coverage-per-file.mjs', () => ({
  measureCoveragePerFile: vi.fn(),
  getUncoveredFiles: vi.fn(),
  findSourceFiles: vi.fn()
}))
vi.mock('./assess-need.mjs', () => ({ quickClassify: vi.fn() }))
vi.mock('./gen-tests.mjs', () => ({ generateTests: vi.fn() }))
vi.mock('./fix-tests.mjs', () => ({ fixFailingTests: vi.fn() }))
vi.mock('./coverage/coverage.mjs', () => ({ runCoverageSteps: vi.fn() }))
vi.mock('./scripts/utils/with-lock.mjs', () => ({ withLock: vi.fn() }))

import { measureCoveragePerFile, getUncoveredFiles, findSourceFiles } from './coverage-per-file.mjs'
import { quickClassify } from './assess-need.mjs'
import { generateTests } from './gen-tests.mjs'
import { fixFailingTests } from './fix-tests.mjs'
import { runCoverageSteps } from './coverage/coverage.mjs'
import { withLock } from './scripts/utils/with-lock.mjs'
import { readFileSync } from 'node:fs'

const mockDir = '/mock/project/root'

function coverageResult(files, failingTests = []) {
  return { files, failingTests }
}

describe('runAutoTest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(withLock).mockImplementation(async (key, fn) => fn())
    vi.mocked(runCoverageSteps).mockResolvedValue(0)
    vi.mocked(fixFailingTests).mockResolvedValue({ count: 0, fixed: 0, remaining: 0 })
    vi.mocked(findSourceFiles).mockResolvedValue([])
    vi.mocked(readFileSync).mockReturnValue('const x = 1')
    vi.mocked(quickClassify).mockReturnValue(null)  // ambiguous → include
  })

  it('should complete successfully when all files meet the coverage threshold', async () => {
    vi.mocked(measureCoveragePerFile).mockResolvedValue(
      coverageResult([
        { file: 'a.js', pct: 90.0 },
        { file: 'b.js', pct: 85.0 }
      ])
    )
    vi.mocked(getUncoveredFiles).mockReturnValue([])

    const result = await runAutoTest(mockDir)

    expect(measureCoveragePerFile).toHaveBeenCalledWith(mockDir)
    expect(generateTests).not.toHaveBeenCalled()
    expect(withLock).toHaveBeenCalledTimes(2)
    expect(runCoverageSteps).toHaveBeenCalledWith({ fix: true, cwd: mockDir })
    expect(runCoverageSteps).toHaveBeenCalledWith({ fix: false, cwd: mockDir })
  })

  it('generates tests for all uncovered files without LLM assessment', async () => {
    vi.mocked(measureCoveragePerFile)
      .mockResolvedValueOnce(coverageResult([{ file: 'a.js', pct: 70.0 }]))
      .mockResolvedValueOnce(coverageResult([{ file: 'a.js', pct: 85.0 }]))
    vi.mocked(getUncoveredFiles)
      .mockReturnValueOnce([{ file: 'a.js', pct: 70.0 }])
      .mockReturnValueOnce([])

    await runAutoTest(mockDir)

    expect(measureCoveragePerFile).toHaveBeenCalledTimes(2)
    expect(generateTests).toHaveBeenCalledWith([{ file: 'a.js', pct: 70.0 }], mockDir)
    expect(generateTests).toHaveBeenCalledTimes(1)
  })

  it('should stop iterating if uncovered count does not decrease', async () => {
    const uncovered = [
      { file: 'a.js', pct: 70.0 },
      { file: 'b.js', pct: 75.0 }
    ]
    vi.mocked(measureCoveragePerFile).mockResolvedValue(coverageResult(uncovered))
    vi.mocked(getUncoveredFiles).mockReturnValue(uncovered)

    await runAutoTest(mockDir)

    expect(measureCoveragePerFile).toHaveBeenCalledTimes(2)
    expect(generateTests).toHaveBeenCalledWith(uncovered, mockDir)
    expect(generateTests).toHaveBeenCalledTimes(1)
  })

  it('should handle case where coverage measurement returns no files', async () => {
    vi.mocked(measureCoveragePerFile).mockResolvedValue(coverageResult([]))

    await runAutoTest(mockDir)

    expect(getUncoveredFiles).not.toHaveBeenCalled()
    expect(generateTests).not.toHaveBeenCalled()
  })

  it('should bootstrap tests when no coverage and no failing tests', async () => {
    vi.mocked(measureCoveragePerFile)
      .mockResolvedValueOnce(coverageResult([]))
      .mockResolvedValueOnce(coverageResult([{ file: 'src/a.js', pct: 90 }]))
    vi.mocked(findSourceFiles).mockResolvedValue(['src/a.js'])
    vi.mocked(readFileSync).mockReturnValue('export function foo() { if (x) return 1 }')
    vi.mocked(quickClassify).mockReturnValue(null)  // ambiguous → include
    vi.mocked(getUncoveredFiles).mockReturnValue([])

    await runAutoTest(mockDir)

    expect(findSourceFiles).toHaveBeenCalledWith(mockDir)
    expect(generateTests).toHaveBeenCalledTimes(1)
    expect(generateTests).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ file: 'src/a.js', pct: 0 })]),
      mockDir
    )
    expect(measureCoveragePerFile).toHaveBeenCalledTimes(2)
  })

  it('should stop bootstrap when quickClassify filters all files as re-exports', async () => {
    vi.mocked(measureCoveragePerFile).mockResolvedValue(coverageResult([]))
    vi.mocked(findSourceFiles).mockResolvedValue(['src/a.js'])
    vi.mocked(readFileSync).mockReturnValue('export { a } from "./a.js"')
    vi.mocked(quickClassify).mockReturnValue({ needsTests: false, reason: 'лише реекспорти' })

    await runAutoTest(mockDir)

    expect(generateTests).not.toHaveBeenCalled()
  })

  it('should include files where quickClassify returns true in bootstrap', async () => {
    vi.mocked(measureCoveragePerFile)
      .mockResolvedValueOnce(coverageResult([]))
      .mockResolvedValueOnce(coverageResult([{ file: 'src/a.js', pct: 90 }]))
    vi.mocked(findSourceFiles).mockResolvedValue(['src/a.js'])
    vi.mocked(quickClassify).mockReturnValue({ needsTests: true, reason: 'має логіку' })
    vi.mocked(getUncoveredFiles).mockReturnValue([])

    await runAutoTest(mockDir)

    expect(generateTests).toHaveBeenCalledWith(
      [{ file: 'src/a.js', pct: 0 }],
      mockDir
    )
  })

  it('should fix failing tests and retry when tests fail', async () => {
    vi.mocked(measureCoveragePerFile)
      .mockResolvedValueOnce(coverageResult([], [{ file: 'a.test.js', errors: ['err'] }]))
      .mockResolvedValueOnce(coverageResult([{ file: 'a.js', pct: 90.0 }]))
    vi.mocked(fixFailingTests).mockResolvedValueOnce({ count: 1, fixed: 1, remaining: 0 })
    vi.mocked(getUncoveredFiles).mockReturnValue([])

    await runAutoTest(mockDir)

    expect(fixFailingTests).toHaveBeenCalledTimes(1)
    expect(measureCoveragePerFile).toHaveBeenCalledTimes(2)
  })

  it('should return non-zero code when Phase 2 fix step fails', async () => {
    vi.mocked(measureCoveragePerFile).mockResolvedValue(coverageResult([{ file: 'a.js', pct: 90.0 }]))
    vi.mocked(getUncoveredFiles).mockReturnValue([])
    vi.mocked(runCoverageSteps).mockResolvedValue(1)

    const result = await runAutoTest(mockDir)

    expect(result).toBe(1)
    expect(withLock).toHaveBeenCalledTimes(1)
  })
})
