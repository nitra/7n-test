import { vi, describe, it, expect, beforeEach } from 'vitest'
import { collectChangedFiles, resolveChangedBase, collectChangedFilesSince } from './changed-files.mjs'
import { spawnSync } from 'node:child_process'

vi.mock('node:child_process', () => ({
  spawnSync: vi.fn()
}))

describe('resolveChangedBase', () => {
  const mockCwd = '/mock/repo'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return trimmed stdout when main succeeds', () => {
    vi.mocked(spawnSync).mockReturnValueOnce({ status: 0, error: null, stdout: 'abc123\n' })
    const result = resolveChangedBase(mockCwd)
    expect(result).toBe('abc123')
  })

  it('should try origin/main if main fails', () => {
    vi.mocked(spawnSync)
      .mockReturnValueOnce({ status: 1, error: null, stdout: '' })
      .mockReturnValueOnce({ status: 0, error: null, stdout: 'def456\n' })
    const result = resolveChangedBase(mockCwd)
    expect(result).toBe('def456')
  })

  it('should return null if both fail', () => {
    vi.mocked(spawnSync)
      .mockReturnValueOnce({ status: 1, error: null, stdout: '' })
      .mockReturnValueOnce({ status: 1, error: null, stdout: '' })
    const result = resolveChangedBase(mockCwd)
    expect(result).toBeNull()
  })
})

describe('collectChangedFiles', () => {
  const mockCwd = '/mock/repo'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return combined modified and untracked files', () => {
    vi.mocked(spawnSync)
      .mockReturnValueOnce({ status: 0, error: null, stdout: 'a.js\nb.ts\n' })
      .mockReturnValueOnce({ status: 0, error: null, stdout: 'c.mjs\n' })
    const result = collectChangedFiles(mockCwd)
    expect(result).toContain('a.js')
    expect(result).toContain('b.ts')
    expect(result).toContain('c.mjs')
  })

  it('should return empty array if no files changed', () => {
    vi.mocked(spawnSync)
      .mockReturnValueOnce({ status: 0, error: null, stdout: '\n' })
      .mockReturnValueOnce({ status: 0, error: null, stdout: '\n' })
    const result = collectChangedFiles(mockCwd)
    expect(result).toEqual([])
  })
})

describe('collectChangedFilesSince', () => {
  const mockCwd = '/mock/repo'
  const mockBase = 'base-sha'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw if base commit is not accessible', () => {
    vi.mocked(spawnSync).mockReturnValueOnce({ status: 1, error: null, stdout: '' })
    expect(() => collectChangedFilesSince(mockBase, mockCwd)).toThrow(/недосяжний/)
  })

  it('should return files if base is accessible', async () => {
    vi.mocked(spawnSync)
      .mockReturnValueOnce({ status: 0, error: null, stdout: 'sha\n' })
      .mockReturnValueOnce({ status: 0, error: null, stdout: 'x.js\n' })
      .mockReturnValueOnce({ status: 0, error: null, stdout: '' })
    const result = await collectChangedFilesSince(mockBase, mockCwd)
    expect(Array.isArray(result)).toBe(true)
  })

  it('should fallback to collectChangedFiles if base is null', async () => {
    vi.mocked(spawnSync)
      .mockReturnValueOnce({ status: 0, error: null, stdout: 'a.js\n' })
      .mockReturnValueOnce({ status: 0, error: null, stdout: '' })
    const result = await collectChangedFilesSince(null, mockCwd)
    expect(Array.isArray(result)).toBe(true)
  })
})
