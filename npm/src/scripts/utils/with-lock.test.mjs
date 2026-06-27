import { vi, describe, it, expect, beforeEach } from 'vitest'
import { shouldDedup, withLock } from './with-lock.mjs'

vi.mock('node:fs', () => ({
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
  rmSync: vi.fn()
}))
vi.mock('node:os', () => ({ hostname: vi.fn(() => 'test-host') }))
vi.mock('node:path', () => ({ join: vi.fn((...args) => args.join('/')) }))
vi.mock('node:timers/promises', () => ({ setTimeout: vi.fn().mockResolvedValue(undefined) }))
vi.mock('./lock-cache-dir.mjs', () => ({ resolveLockCacheDir: vi.fn(() => '/cache/test-key') }))
vi.mock('./worktree-fingerprint.mjs', () => ({ worktreeFingerprint: vi.fn(() => 'fp-123') }))

import * as fs from 'node:fs'

const LOCK_DIR = '/cache/test-key/lock'
const OWNER_FILE = `${LOCK_DIR}/owner.json`
const RESULT_FILE = '/cache/test-key/result.json'

describe('shouldDedup', () => {
  it('throws when result is null (no null guard)', () => {
    expect(() => shouldDedup(null, 'fp', 60000)).toThrow(TypeError)
  })

  it('returns false when exitCode is non-zero', () => {
    expect(shouldDedup({ exitCode: 1, fingerprint: 'fp', finishedAt: Date.now() - 1000 }, 'fp', 60000)).toBe(false)
  })

  it('returns false when fingerprint is null', () => {
    expect(shouldDedup({ exitCode: 0, fingerprint: null, finishedAt: Date.now() - 1000 }, null, 60000)).toBe(false)
  })

  it('returns false when fingerprint does not match', () => {
    expect(shouldDedup({ exitCode: 0, fingerprint: 'old', finishedAt: Date.now() - 1000 }, 'new', 60000)).toBe(false)
  })

  it('returns false when ttl exceeded', () => {
    expect(shouldDedup({ exitCode: 0, fingerprint: 'fp', finishedAt: Date.now() - 70000 }, 'fp', 60000)).toBe(false)
  })

  it('returns true when all conditions met', () => {
    expect(shouldDedup({ exitCode: 0, fingerprint: 'fp', finishedAt: Date.now() - 1000 }, 'fp', 60000)).toBe(true)
  })

  it('returns true when finishedAt is missing (NaN comparison returns false >= ttl = false → true)', () => {
    expect(shouldDedup({ exitCode: 0, fingerprint: 'fp', finishedAt: undefined }, 'fp', 60000)).toBe(true)
  })

  it('returns false when result has no fingerprint property', () => {
    expect(shouldDedup({ exitCode: 0, finishedAt: Date.now() - 1000 }, 'fp', 60000)).toBe(false)
  })
})

describe('withLock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(process, 'once').mockImplementation(() => process)
    vi.spyOn(process, 'off').mockImplementation(() => process)
    vi.spyOn(process, 'kill').mockImplementation(() => true)
  })

  it('acquires lock and runs fn when no cached result', async () => {
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined)
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    vi.mocked(fs.writeFileSync).mockReturnValue(undefined)
    vi.mocked(fs.rmSync).mockReturnValue(undefined)
    const runFn = vi.fn().mockResolvedValue(0)

    const code = await withLock('test-key', runFn, { cacheDir: '/cache/test-key' })

    expect(runFn).toHaveBeenCalledTimes(1)
    expect(code).toBe(0)
    expect(fs.rmSync).toHaveBeenCalledWith(LOCK_DIR, { recursive: true, force: true })
    expect(fs.writeFileSync).toHaveBeenCalledWith(RESULT_FILE, expect.stringContaining('"exitCode":0'))
  })

  it('skips runFn and returns 0 when dedup matches', async () => {
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined)
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ exitCode: 0, fingerprint: 'fp-123', finishedAt: Date.now() - 1000 })
    )
    vi.mocked(fs.rmSync).mockReturnValue(undefined)
    const runFn = vi.fn()

    const code = await withLock('test-key', runFn, { cacheDir: '/cache/test-key', ttl: 60000 })

    expect(runFn).not.toHaveBeenCalled()
    expect(code).toBe(0)
    expect(fs.rmSync).toHaveBeenCalledWith(LOCK_DIR, { recursive: true, force: true })
  })

  it('cleans stale lock (by timeout) and re-acquires', async () => {
    let lockExists = true
    vi.mocked(fs.mkdirSync).mockImplementation(dir => {
      if (dir === LOCK_DIR && lockExists) {
        const err = new Error('EEXIST')
        err.code = 'EEXIST'
        throw err
      }
    })
    vi.mocked(fs.readFileSync).mockImplementation(file => {
      if (file === OWNER_FILE)
        return JSON.stringify({
          pid: 9999,
          host: 'test-host',
          startedAt: Date.now() - 2_000_000,
          fingerprint: 'fp-123'
        })
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    vi.mocked(fs.rmSync).mockImplementation(() => {
      lockExists = false
    })
    vi.mocked(fs.writeFileSync).mockReturnValue(undefined)
    const runFn = vi.fn().mockResolvedValue(0)

    const code = await withLock('test-key', runFn, { cacheDir: '/cache/test-key' })

    expect(fs.rmSync).toHaveBeenCalledWith(LOCK_DIR, { recursive: true, force: true })
    expect(runFn).toHaveBeenCalledTimes(1)
    expect(code).toBe(0)
  })

  it('throws fail-closed when waitTimeout exceeded with fail policy', async () => {
    vi.mocked(fs.mkdirSync).mockImplementation(dir => {
      if (dir === LOCK_DIR) {
        const err = new Error('EEXIST')
        err.code = 'EEXIST'
        throw err
      }
    })
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ pid: 9999, host: 'other-host', startedAt: Date.now(), fingerprint: 'fp' })
    )

    await expect(
      withLock('test-key', vi.fn(), {
        cacheDir: '/cache/test-key',
        waitTimeout: 0,
        onWaitTimeout: 'fail',
        pollInterval: 0
      })
    ).rejects.toThrow(/fail-closed/)
  })

  it('runs unlocked when waitTimeout exceeded with run-unlocked policy', async () => {
    vi.mocked(fs.mkdirSync).mockImplementation(dir => {
      if (dir === LOCK_DIR) {
        const err = new Error('EEXIST')
        err.code = 'EEXIST'
        throw err
      }
    })
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ pid: 9999, host: 'other-host', startedAt: Date.now(), fingerprint: 'fp' })
    )
    const runFn = vi.fn().mockResolvedValue(42)

    const code = await withLock('test-key', runFn, {
      cacheDir: '/cache/test-key',
      waitTimeout: 0,
      onWaitTimeout: 'run-unlocked',
      pollInterval: 0
    })

    expect(runFn).toHaveBeenCalledTimes(1)
    expect(code).toBe(42)
  })
})
