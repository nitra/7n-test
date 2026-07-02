/**
 * Shared bundled-vitest utilities.
 *
 * Target projects do NOT need vitest installed — we use the vitest bundled
 * with `@7n/test` as a fallback, with a shim config so the run works even
 * without a vitest.config.js in the target project. When the target DOES
 * have vitest installed locally, its own binary is preferred instead: that
 * resolves the target's `vitest.config.*` (setupFiles, environment, plugins,
 * nested per-package configs) and third-party environment providers (e.g.
 * `happy-dom`) from the target's own `node_modules`, which the bundled copy
 * cannot see.
 */
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

const _require = createRequire(import.meta.url)
const _bundledVitestPkg = _require.resolve('vitest/package.json')
const _bundledVitestDir = dirname(_bundledVitestPkg)

/** Absolute path to the bundled vitest CLI (fallback when the target has no local vitest). */
export const VITEST_BIN = join(_bundledVitestDir, 'vitest.mjs')

/** Absolute path to the bundled vitest/config entry (for use in shim import). */
const VITEST_CONFIG_ENTRY = join(_bundledVitestDir, 'dist', 'config.js')

/**
 * Minimal vitest config written to OS temp, imported by the bundled vitest.
 * Using file:// URL so the import resolves from 7n-test's node_modules,
 * not from the target project's (possibly absent) vitest installation.
 */
export const VITEST_SHIM_CONFIG = join(tmpdir(), '7n-vitest-shim', 'vitest.config.mjs')

let _shimWritten = false

/** Ensures the bundled-vitest shim config file exists (idempotent). */
export function ensureVitestShim() {
  if (_shimWritten) return
  mkdirSync(dirname(VITEST_SHIM_CONFIG), { recursive: true })
  writeFileSync(
    VITEST_SHIM_CONFIG,
    `import { defineConfig } from ${JSON.stringify('file://' + VITEST_CONFIG_ENTRY)}\n` +
      `export default defineConfig({\n` +
      `  test: { environment: 'node' },\n` +
      `  coverage: {\n` +
      `    provider: 'v8',\n` +
      // Exclude test files that use non-vitest runners (bun:test, jest) from
      // the coverage scan so they don't cause import errors or skewed data.
      `    exclude: ['**/node_modules/**'],\n` +
      `  },\n` +
      `})\n`
  )
  _shimWritten = true
}

/**
 * Resolves which vitest binary and extra CLI args to run for a target project.
 * Prefers the target's own locally-installed vitest (native config discovery,
 * dependencies resolved from its own node_modules); falls back to the bundled
 * vitest + shim config when the target has no local vitest installed.
 * @param {string} dir target project root
 * @returns {{ bin: string, configArgs: string[] }} vitest bin path and `--config` args to prepend
 */
export function resolveVitestRun(dir) {
  try {
    const localPkg = _require.resolve('vitest/package.json', { paths: [dir] })
    return { bin: join(dirname(localPkg), 'vitest.mjs'), configArgs: [] }
  } catch {
    ensureVitestShim()
    return { bin: VITEST_BIN, configArgs: ['--config', VITEST_SHIM_CONFIG] }
  }
}
