import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * Imports a fresh vitest-shim module instance so its module-level cache is reset.
 * @returns {Promise<typeof import('../vitest-shim.mjs')>} freshly loaded module
 */
function freshShim() {
  vi.resetModules()
  return import('../vitest-shim.mjs')
}

describe('vitest-shim.mjs', () => {
  let projectDir

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), '7n-shim-test-'))
  })

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true })
  })

  describe('ensureVitestShim', () => {
    it('writes a plain node-environment config', async () => {
      const { ensureVitestShim, VITEST_SHIM_CONFIG } = await freshShim()
      ensureVitestShim()
      const content = readFileSync(VITEST_SHIM_CONFIG, 'utf8')
      expect(content).toContain(`environment: 'node'`)
      expect(content).toContain(`provider: 'v8'`)
    })
  })

  describe('resolveVitestRun', () => {
    it('prefers the target project own locally-installed vitest, without --config', async () => {
      mkdirSync(join(projectDir, 'node_modules', 'vitest'), { recursive: true })
      writeFileSync(join(projectDir, 'node_modules', 'vitest', 'package.json'), JSON.stringify({ name: 'vitest' }))
      writeFileSync(join(projectDir, 'node_modules', 'vitest', 'vitest.mjs'), '')

      const { resolveVitestRun } = await freshShim()
      const { bin, configArgs } = resolveVitestRun(projectDir)

      expect(bin).toContain('node_modules/vitest/vitest.mjs')
      expect(configArgs).toEqual([])
    })

    it('falls back to the bundled vitest + shim config when the target has no local vitest', async () => {
      const { resolveVitestRun, VITEST_BIN, VITEST_SHIM_CONFIG } = await freshShim()
      const { bin, configArgs } = resolveVitestRun(projectDir)

      expect(bin).toBe(VITEST_BIN)
      expect(configArgs).toEqual(['--config', VITEST_SHIM_CONFIG])
      expect(readFileSync(VITEST_SHIM_CONFIG, 'utf8')).toContain(`environment: 'node'`)
    })
  })
})
