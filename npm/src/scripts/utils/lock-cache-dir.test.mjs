import { vi, describe, it, expect, beforeEach } from 'vitest'
import { resolveLockCacheDir } from './lock-cache-dir.mjs'

// Mock child_process's spawnSync function
const mockSpawnSync = vi.fn()
vi.mock('node:child_process', () => ({
  spawnSync: vi.fn()
}))

describe('resolveLockCacheDir', () => {
  const mockKey = 'test-key'
  const mockCwd = '/path/to/repo'
  const mockRepoRoot = '/path/to/repo'

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset default mock implementation for git command
    mockSpawnSync.mockImplementation((command, args, options) => {
      // Default to failure unless specified otherwise in tests
      if (command === 'git' && args[0] === 'rev-parse' && args[1] === '--git-common-dir') {
        return { status: 1, stdout: '', error: new Error('Git failed') }
      }
      return { status: 0, stdout: '', error: null }
    })
  })

  it('should return per-checkout cache path when git command fails or is unavailable (no common directory)', () => {
    // Setup mock to simulate git failure (status 1)
    mockSpawnSync.mockReturnValue({ status: 1, stdout: '', error: new Error('Not a git repo') })

    // Test with default CWD (process.cwd())
    const resultDefaultCwd = resolveLockCacheDir(mockKey, { spawn: mockSpawnSync })
    expect(resultDefaultCwd).toBe(`${process.cwd()}/node_modules/.cache/n-cursor/${mockKey}`)

    // Test with specified CWD
    const resultSpecificCwd = resolveLockCacheDir(mockKey, {
      cwd: mockCwd,
      spawn: mockSpawnSync
    })
    expect(resultSpecificCwd).toBe(`${mockCwd}/node_modules/.cache/n-cursor/${mockKey}`)
  })

  it('should return the common directory cache path when git command succeeds and returns a path', () => {
    // Simulate success where common directory is returned relative to repo root (e.g., .git)
    const relativeCommonDir = '.git'
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: relativeCommonDir,
      error: null
    })

    // Test with a known working directory (where commonDir calculation resolves correctly)
    const expectedPath = `${mockRepoRoot}/.git/n-cursor/${mockKey}`
    const result = resolveLockCacheDir(mockKey, {
      cwd: mockRepoRoot,
      spawn: mockSpawnSync
    })
    expect(result).toBe(expectedPath)

    // Test with different working directory (to ensure resolve() handles paths correctly)
    const anotherRepoRoot = '/tmp/test-repo'
    const expectedPath2 = `${anotherRepoRoot}/.git/n-cursor/${mockKey}`
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: relativeCommonDir,
      error: null
    })
    const result2 = resolveLockCacheDir(mockKey, {
      cwd: anotherRepoRoot,
      spawn: mockSpawnSync
    })
    expect(result2).toBe(expectedPath2)
  })

  it('should correctly handle an empty string output from git (treating it as no common directory found)', () => {
    // Simulate success (status 0) but empty stdout
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: '  ', // Trimmed to ''
      error: null
    })

    const result = resolveLockCacheDir(mockKey, {
      cwd: mockCwd,
      spawn: mockSpawnSync
    })
    expect(result).toBe(`${mockCwd}/node_modules/.cache/n-cursor/${mockKey}`)
  })
})
