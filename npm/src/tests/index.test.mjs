import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

import { run } from '../index.js'
import { runCoverageCli } from '../coverage/coverage.mjs'
import { runAutoTest } from '../run.mjs'
import { runStorybookCli } from '../storybook-run.mjs'

// vi.mock hoist-иться vitest-ом над імпортами — порядок у джерелі не впливає.
vi.mock('../coverage/coverage.mjs', () => ({
  runCoverageCli: vi.fn().mockResolvedValue(0)
}))

vi.mock('../run.mjs', () => ({
  runAutoTest: vi.fn().mockResolvedValue(0)
}))

vi.mock('../storybook-run.mjs', () => ({
  runStorybookCli: vi.fn().mockResolvedValue(0)
}))

describe('run', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('coverage subcommand', () => {
    it('делегує в runCoverageCli з cwd поточного процесу', async () => {
      const code = await run(['coverage'])

      expect(runCoverageCli).toHaveBeenCalledWith({ cwd: process.cwd(), fix: false, changed: false })
      expect(runAutoTest).not.toHaveBeenCalled()
      expect(code).toBe(0)
    })

    it('прокидає --fix у runCoverageCli', async () => {
      await run(['coverage', '--fix'])

      expect(runCoverageCli).toHaveBeenCalledWith(expect.objectContaining({ fix: true, changed: false }))
    })

    it('прокидає --changed у runCoverageCli', async () => {
      await run(['coverage', '--changed'])

      expect(runCoverageCli).toHaveBeenCalledWith(expect.objectContaining({ fix: false, changed: true }))
    })

    it('повертає exit code від runCoverageCli', async () => {
      vi.mocked(runCoverageCli).mockResolvedValueOnce(1)

      const code = await run(['coverage'])

      expect(code).toBe(1)
    })
  })

  describe('storybook subcommand (швидкий PR-гейт канону Storybook)', () => {
    it('делегує в runStorybookCli з cwd поточного процесу', async () => {
      const code = await run(['storybook'])

      expect(runStorybookCli).toHaveBeenCalledWith({ cwd: process.cwd() })
      expect(runAutoTest).not.toHaveBeenCalled()
      expect(runCoverageCli).not.toHaveBeenCalled()
      expect(code).toBe(0)
    })

    it('повертає exit code від runStorybookCli', async () => {
      vi.mocked(runStorybookCli).mockResolvedValueOnce(1)

      expect(await run(['storybook'])).toBe(1)
    })
  })

  describe('дефолтний auto-test flow', () => {
    it('делегує в runAutoTest з поточним каталогом, коли directory не передано', async () => {
      await run([])

      expect(runAutoTest).toHaveBeenCalledWith(process.cwd(), { noMutation: false })
      expect(runCoverageCli).not.toHaveBeenCalled()
    })

    it('резолвить переданий directory', async () => {
      await run(['./some-dir'])

      const [dirArg] = vi.mocked(runAutoTest).mock.calls[0]
      expect(dirArg.endsWith('some-dir')).toBe(true)
    })

    it('прокидає --no-mutation', async () => {
      await run(['--no-mutation'])

      expect(runAutoTest).toHaveBeenCalledWith(process.cwd(), { noMutation: true })
    })
  })

  describe('--help', () => {
    it('друкує usage і повертає 0 без виклику runAutoTest/runCoverageCli', async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(vi.fn())

      const code = await run(['--help'])

      expect(code).toBe(0)
      expect(runAutoTest).not.toHaveBeenCalled()
      expect(runCoverageCli).not.toHaveBeenCalled()
      expect(logSpy).toHaveBeenCalled()

      logSpy.mockRestore()
    })
  })
})
