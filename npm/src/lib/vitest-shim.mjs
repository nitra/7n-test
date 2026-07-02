/**
 * Shared bundled-vitest utilities.
 *
 * Target projects do NOT need vitest installed — we use the vitest bundled
 * with `@7n/test`. The shim config bypasses any vitest.config.js in the target
 * project that would fail to load when the target doesn't have vitest as a
 * local dependency.
 */
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

const _require = createRequire(import.meta.url)
const _vitestPkg = _require.resolve('vitest/package.json')
const _vitestDir = dirname(_vitestPkg)

/** Absolute path to the bundled vitest CLI. */
export const VITEST_BIN = join(_vitestDir, 'vitest.mjs')

/** Absolute path to the bundled vitest/config entry (for use in shim import). */
const VITEST_CONFIG_ENTRY = join(_vitestDir, 'dist', 'config.js')

/**
 * Minimal vitest config written to OS temp, imported by bundled vitest.
 * Using file:// URL so the import resolves from 7n-test's node_modules,
 * not from the target project's (possibly absent) vitest installation.
 */
export const VITEST_SHIM_CONFIG = join(tmpdir(), '7n-vitest-shim', 'vitest.config.mjs')

let _shimWritten = false

/** Ensures the shim config file exists (idempotent). */
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
