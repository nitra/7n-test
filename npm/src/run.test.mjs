import { vi, describe, it, expect, beforeEach } from 'vitest'
import { runAutoTest } from './run.mjs'

vi.mock('./coverage-per-file.mjs', () => ({
  measureCoveragePerFile: vi.fn(),
  getUncoveredFiles: vi.fn()
}))
vi.mock('./assess-need.mjs', () => ({ assessNeed: vi.fn() }))
vi.mock('./gen-tests.mjs', () => ({ generateTests: vi.fn() }))
vi.mock('./fix-tests.mjs', () => ({ fixFailingTests: vi.fn() }))
vi.mock('./coverage/coverage.mjs', () => ({ runCoverageSteps: vi.fn() }))
vi.mock('./scripts/utils/with-lock.mjs', () => ({ withLock: vi.fn() }))

import { measureCoveragePerFile, getUncoveredFiles } from './coverage-per-file.mjs'
import { assessNeed } from './assess-need.mjs'
import { generateTests } from './gen-tests.mjs'
import { fixFailingTests } from './fix-tests.mjs'
import { runCoverageSteps } from './coverage/coverage.mjs'
import { withLock } from './scripts/utils/with-lock.mjs'

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
    expect(assessNeed).not.toHaveBeenCalled()
    expect(generateTests).not.toHaveBeenCalled()
    expect(withLock).toHaveBeenCalledTimes(2)
    expect(runCoverageSteps).toHaveBeenCalledWith({ fix: true, cwd: mockDir })
    expect(runCoverageSteps).toHaveBeenCalledWith({ fix: false, cwd: mockDir })
  })

  it("should iterate when coverage doesn't reach threshold", async () => {
    vi.mocked(measureCoveragePerFile)
      .mockResolvedValueOnce(coverageResult([{ file: 'a.js', pct: 70.0 }]))
      .mockResolvedValueOnce(coverageResult([{ file: 'a.js', pct: 85.0 }]))
    vi.mocked(getUncoveredFiles)
      .mockReturnValueOnce([{ file: 'a.js', pct: 70.0 }])
      .mockReturnValueOnce([])
    vi.mocked(assessNeed).mockResolvedValueOnce([{ file: 'a.js', needsTests: true, pct: 70.0, reason: 'Low coverage' }])

    await runAutoTest(mockDir)

    expect(measureCoveragePerFile).toHaveBeenCalledTimes(2)
    expect(assessNeed).toHaveBeenCalledTimes(1)
    expect(generateTests).toHaveBeenCalledTimes(1)
    expect(withLock).toHaveBeenCalledTimes(2)
  })

  it('should stop iterating if uncovered count does not decrease', async () => {
    const uncovered = [
      { file: 'a.js', pct: 70.0 },
      { file: 'b.js', pct: 75.0 }
    ]
    vi.mocked(measureCoveragePerFile).mockResolvedValue(coverageResult(uncovered))
    vi.mocked(getUncoveredFiles).mockReturnValue(uncovered)
    vi.mocked(assessNeed).mockResolvedValue([{ file: 'a.js', needsTests: true, pct: 70.0, reason: 'low' }])

    await runAutoTest(mockDir)

    expect(measureCoveragePerFile).toHaveBeenCalledTimes(2)
    expect(assessNeed).toHaveBeenCalledTimes(1)
  })

  it('should stop iterating if LLM assesses no files need tests', async () => {
    vi.mocked(measureCoveragePerFile).mockResolvedValue(coverageResult([{ file: 'a.js', pct: 60.0 }]))
    vi.mocked(getUncoveredFiles).mockReturnValue([{ file: 'a.js', pct: 60.0 }])
    vi.mocked(assessNeed).mockResolvedValue([{ file: 'a.js', needsTests: false }])

    await runAutoTest(mockDir)

    expect(generateTests).not.toHaveBeenCalled()
    expect(assessNeed).toHaveBeenCalledTimes(1)
  })

  it('should handle case where coverage measurement returns no files', async () => {
    vi.mocked(measureCoveragePerFile).mockResolvedValue(coverageResult([]))

    await runAutoTest(mockDir)

    expect(getUncoveredFiles).not.toHaveBeenCalled()
    expect(assessNeed).not.toHaveBeenCalled()
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
