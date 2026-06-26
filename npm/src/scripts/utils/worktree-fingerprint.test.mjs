import { vi, describe, it, expect, beforeEach } from 'vitest'
import { spawnSync } from 'node:child_process'
import { worktreeFingerprint } from './worktree-fingerprint.mjs'

// Mocking node:child_process's spawnSync (or spawn if we mock the dependency)
// Since the function uses an injected 'spawn' which defaults to spawnSync,
// we will mock the underlying 'spawn' behavior to control the return value of the 'git' helper.

// We mock the entire module that might be used internally, if 'spawn' is not provided.
// Since the dependency is node:child_process, and it's used inside the function scope,
// we need to mock 'node:child_process' if we were to test the default path.

// For simplicity and adhering to best practices for testing complex system calls:
// We mock the function passed as the first argument (spawn) if it's not provided,
// or we mock the global 'spawnSync' if we are testing the default path.

vi.mock('node:child_process', () => ({
  spawnSync: vi.fn()
}))

// Helper function to simulate a successful git call response
const createMockGitResponse = (stdout, status = 0, error = null) => ({
  status: status,
  error: error,
  stdout: stdout,
  stderr: '' // Assuming no stderr for success
})

describe('worktreeFingerprint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock for spawnSync before each test
    vi.mocked(spawnSync).mockImplementation(() => {
      // This mock implementation must return an object that mimics the structure
      // that the internal 'git' helper expects from spawnSync (status, stdout, error)
      // Since the original code calls `spawn('git', args, { encoding: 'utf8' })`
      // and expects a return value with `r.status`, `r.error`, `r.stdout`,
      // we simulate this structure when mockSpawnSync is called.
      return {
        status: 0,
        stdout: '',
        error: null
      }
    })
  })

  it('should return a valid SHA256 hash for a fully committed and tracked repository', async () => {
    // 1. Test for 'rev-parse HEAD'
    vi.mocked(spawnSync).mockReturnValueOnce({ status: 0, stdout: 'a1b2c3d4e5f67890a1b2c3d4e5f67890', error: null })

    // 2. Test for 'diff HEAD' (should return empty for clean repo)
    vi.mocked(spawnSync).mockReturnValueOnce({ status: 0, stdout: '', error: null })

    // 3. Test for 'ls-files -z --others --exclude-standard' (no untracked files)
    vi.mocked(spawnSync).mockReturnValueOnce({ status: 0, stdout: '', error: null })

    // For hash-object, we only need to mock it if there are files.
    // Since untrackedFiles is empty, this is skipped.

    const hash = worktreeFingerprint()
    expect(typeof hash).toBe('string')
    expect(hash.length).toBe(64)
  })

  it('should return null if the repository is not initialized (git command fails)', async () => {
    // Simulate failure for the very first call (e.g., 'rev-parse HEAD')
    vi.mocked(spawnSync).mockReturnValueOnce({ status: 128, stdout: '', error: 'Not a git repository' })

    const hash = worktreeFingerprint()
    expect(hash).toBeNull()
  })

  it('should return null if any required git command fails during the fingerprint generation', async () => {
    // 1. Success for HEAD
    vi.mocked(spawnSync).mockReturnValueOnce({ status: 0, stdout: 'a1b2c3d4e5f67890a1b2c3d4e5f67890', error: null })
    // 2. Failure for diff HEAD
    vi.mocked(spawnSync).mockReturnValueOnce({ status: 1, stdout: '', error: 'Something went wrong' })

    const hash = worktreeFingerprint()
    expect(hash).toBeNull()
  })

  it('should correctly generate hash when untracked files exist', async () => {
    const mockCommitHash = 'commitHash123'
    const mockDiffText = 'diffContent'
    const fileA = 'fileA.txt'
    const fileB = 'fileB.js'
    const hashA = 'hashA_abc'
    const hashB = 'hashB_xyz'

    // 1. rev-parse HEAD
    vi.mocked(spawnSync).mockReturnValueOnce({ status: 0, stdout: mockCommitHash, error: null })
    // 2. diff HEAD
    vi.mocked(spawnSync).mockReturnValueOnce({ status: 0, stdout: mockDiffText, error: null })
    // 3. ls-files (return two files separated by NULL byte)
    vi.mocked(spawnSync).mockReturnValueOnce({ status: 0, stdout: `${fileA}\0${fileB}\0`, error: null })
    // 4. hash-object fileA
    vi.mocked(spawnSync).mockReturnValueOnce({ status: 0, stdout: hashA, error: null })
    // 5. hash-object fileB
    vi.mocked(spawnSync).mockReturnValueOnce({ status: 0, stdout: hashB, error: null })

    const hash = worktreeFingerprint()
    expect(typeof hash).toBe('string')
    expect(hash.length).toBe(64)
  })

  it('should correctly handle an empty repository (no untracked files) and return a hash', async () => {
    const mockCommitHash = 'commitHash123'
    const mockDiffText = 'diffContent'

    // 1. rev-parse HEAD
    vi.mocked(spawnSync).mockReturnValueOnce({ status: 0, stdout: mockCommitHash, error: null })
    // 2. diff HEAD
    vi.mocked(spawnSync).mockReturnValueOnce({ status: 0, stdout: mockDiffText, error: null })
    // 3. ls-files (no untracked files)
    vi.mocked(spawnSync).mockReturnValueOnce({ status: 0, stdout: '', error: null })

    const hash = worktreeFingerprint()
    expect(typeof hash).toBe('string')
    expect(hash.length).toBe(64)
  })
})
