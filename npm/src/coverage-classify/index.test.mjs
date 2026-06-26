import { vi, describe, it, expect, beforeEach } from 'vitest'
import { classify } from './index.mjs'
import { deriveCacheKey, readCache, writeCache } from './cache.mjs'
import * as models from '../lib/models.mjs'

// Mocking external dependencies heavily
vi.mock('./cache.mjs', () => ({
  readCache: vi.fn(),
  writeCache: vi.fn(),
  deriveCacheKey: vi.fn()
}))
vi.mock('../lib/models.mjs', () => ({
  resolveModel: vi.fn(),
  CLOUD_MIN: ''
}))

describe('classify', () => {
  const mockCwd = '/mock/root'
  const mockSurvived = [
    {
      file: 'src/test.js',
      mutants: [
        {
          file: 'src/test.js',
          line: 10,
          col: 1,
          replacement: 'R1'
        }
      ],
      exampleTest: null
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(models.resolveModel).mockReturnValue('mock_model')
    vi.mocked(deriveCacheKey).mockReturnValue('mock_key')
    vi.mocked(readCache).mockReturnValue({ version: 1, model: 'mock_model+cloud', entries: {} })
  })

  it('should use cached verdict if available', async () => {
    const cachedVerdict = { verdict: 'ok', confidence: 1.0, reason: 'Cached' }
    vi.mocked(readCache).mockReturnValue({
      version: 1,
      model: 'mock_model+cloud',
      entries: { mock_key: { verdict: 'ok', confidence: 1.0, reason: 'Cached' } }
    })

    const results = await classify(mockSurvived, mockCwd)

    expect(vi.mocked(deriveCacheKey)).toHaveBeenCalled()
    expect(results[0].verdict.verdict).toBe('ok')
  })

  it('should run Tier 1 classification if cache misses', async () => {
    const validVerdict = JSON.stringify({
      verdict: 'worth-testing',
      confidence: 0.8,
      reason: 'This mutant changes core logic and needs a dedicated test to verify',
      suggestedTest: 'check it'
    })
    const mockCallModel = vi.fn().mockReturnValue(validVerdict)

    await classify(mockSurvived, mockCwd, { callModel: mockCallModel })

    expect(mockCallModel).toHaveBeenCalledWith(expect.any(String), 'mock_model')
    expect(mockCallModel).toHaveBeenCalledTimes(1)
  })

  it('should run Tier 2 classification on Tier 1 failure', async () => {
    const validVerdict = JSON.stringify({
      verdict: 'equivalent',
      confidence: 0.9,
      reason: 'This mutant is semantically equivalent to the original code'
    })
    const mockCallModel = vi
      .fn()
      .mockImplementationOnce(() => {
        throw new Error('Tier 1 Fail')
      })
      .mockReturnValueOnce(validVerdict)

    await classify(mockSurvived, mockCwd, { callModel: mockCallModel })

    expect(mockCallModel).toHaveBeenCalledTimes(2)
    expect(mockCallModel).toHaveBeenNthCalledWith(1, expect.any(String), 'mock_model')
    expect(mockCallModel).toHaveBeenNthCalledWith(2, expect.any(String), '')
  })

  it('should fallback to conservative verdict if both tiers fail', async () => {
    // Both Tiers throw
    const mockCallModel = vi.fn().mockRejectedValue(new Error('Both Tiers Fail'))

    await classify(mockSurvived, mockCwd, { callModel: mockCallModel })

    // Check fallback verdict was applied
    const results = await classify(mockSurvived, mockCwd, { callModel: mockCallModel })
    expect(results[0].verdict.verdict).toBe('worth-testing')
    expect(results[0].verdict.confidence).toBe(0)
  })
})
