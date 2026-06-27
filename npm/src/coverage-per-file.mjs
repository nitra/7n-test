/**
 * Per-file coverage via vitest + lcov.
 * Runs vitest (bundled with @7n/test) in a single pass and returns
 * both per-file coverage data and failing tests.
 * Target projects do NOT need vitest or @vitest/coverage-v8 installed.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { createRequire } from 'node:module'
import { join, relative, dirname } from 'node:path'
import { env } from 'node:process'

const _require = createRequire(import.meta.url)
const VITEST_BIN = join(
  dirname(_require.resolve('vitest/package.json')),
  'vitest.mjs'
)

const TEST_FILE_RE = /\.(test|spec)\.[^.]+$|[/\\]tests?[/\\]/
const MAX_ERRORS_PER_FILE = 5
const MAX_ERROR_LINES = 10

/**
 * @param {string} text lcov.info content
 * @returns {Array<{file: string, pct: number, linesFound: number, linesCovered: number}>}
 */
function parseLcovPerFile(text) {
  const files = []
  let currentFile = null
  let lf = 0
  let lh = 0
  for (const line of text.split('\n')) {
    if (line.startsWith('SF:')) {
      currentFile = line.slice(3).trim()
      lf = 0
      lh = 0
    } else if (line.startsWith('LF:')) {
      lf = Number(line.slice(3))
    } else if (line.startsWith('LH:')) {
      lh = Number(line.slice(3))
    } else if (line === 'end_of_record' && currentFile) {
      files.push({
        file: currentFile,
        pct: lf === 0 ? 100 : Math.round((lh / lf) * 10000) / 100,
        linesFound: lf,
        linesCovered: lh
      })
      currentFile = null
    }
  }
  return files
}

/**
 * @param {string} jsonPath path to vitest JSON results file
 * @param {string} dir project root for relative paths
 * @returns {Array<{file: string, errors: string[]}>}
 */
function parseFailingTests(jsonPath, dir) {
  try {
    const data = JSON.parse(readFileSync(jsonPath, 'utf8'))
    return (data.testResults ?? [])
      .filter(r => r.status === 'failed')
      .map(r => {
        const assertionErrors = (r.assertionResults ?? [])
          .filter(a => a.status === 'failed')
          .slice(0, MAX_ERRORS_PER_FILE)
          .map(a => {
            const name = [...(a.ancestorTitles ?? []), a.title].join(' > ')
            const msg = (a.failureMessages?.[0] ?? '').split('\n').slice(0, MAX_ERROR_LINES).join('\n')
            return `${name}:\n${msg}`
          })
        // Module-level errors (import/syntax) produce no assertionResults
        const errors = assertionErrors.length > 0
          ? assertionErrors
          : [`Suite error: ${(r.message ?? r.failureMessage ?? 'module-level failure').split('\n').slice(0, MAX_ERROR_LINES).join('\n')}`]
        return { file: relative(dir, r.testFilePath), errors }
      })
      .filter(f => !f.file.startsWith('..'))
  } catch {
    return []
  }
}

/**
 * Runs vitest coverage + JSON reporter in a single pass.
 * Returns per-file coverage and any failing tests detected in the same run.
 *
 * @param {string} dir project root
 * @returns {Promise<{files: Array<{file: string, pct: number, linesFound: number, linesCovered: number}>, failingTests: Array<{file: string, errors: string[]}>}>}
 */
export async function measureCoveragePerFile(dir) {
  const lcovDir = await mkdtemp(join(tmpdir(), '7n-cov-'))
  const jsonResultsFile = join(lcovDir, 'test-results.json')

  try {
    spawnSync(
      process.execPath,
      [
        VITEST_BIN,
        'run',
        '--passWithNoTests',
        '--coverage',
        '--coverage.reporter=lcov',
        `--coverage.reportsDirectory=${lcovDir}`,
        '--reporter=verbose',
        '--reporter=json',
        `--outputFile=${jsonResultsFile}`
      ],
      { cwd: dir, stdio: 'inherit', env }
    )

    const failingTests = existsSync(jsonResultsFile) ? parseFailingTests(jsonResultsFile, dir) : []

    const lcovPath = join(lcovDir, 'lcov.info')
    if (!existsSync(lcovPath)) return { files: [], failingTests }

    const allFiles = parseLcovPerFile(readFileSync(lcovPath, 'utf8'))
    const files = allFiles
      .map(f => ({ ...f, file: relative(dir, f.file) }))
      .filter(f => !f.file.startsWith('..') && !TEST_FILE_RE.test(f.file))

    return { files, failingTests }
  } finally {
    await rm(lcovDir, { recursive: true, force: true }).catch(() => {})
  }
}

/**
 * Files below the coverage threshold.
 * @param {Array<{file: string, pct: number}>} files
 * @param {number} [threshold=80]
 * @returns {Array<{file: string, pct: number}>}
 */
export function getUncoveredFiles(files, threshold = 80) {
  return files.filter(f => f.pct < threshold)
}

const SOURCE_EXT_RE = /\.(mjs|js|ts|vue|py)$/
const IGNORE_DIRS = new Set([
  'node_modules', 'dist', 'build', 'out', '.git', '__pycache__',
  'coverage', '.cursor', '.claude', '.pi', 'docs', 'bin', 'reports'
])

/**
 * Recursively finds source code files in a directory, excluding tests and
 * ignored directories. Used for bootstrap when no coverage data exists.
 *
 * @param {string} dir project root
 * @returns {Promise<string[]>} relative paths to source files
 */
export async function findSourceFiles(dir) {
  const results = []

  async function walk(current, relBase) {
    let entries
    try {
      entries = await readdir(current, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue
      const rel = relBase ? `${relBase}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.has(entry.name)) await walk(join(current, entry.name), rel)
      } else if (entry.isFile() && SOURCE_EXT_RE.test(entry.name) && !TEST_FILE_RE.test(rel)) {
        results.push(rel)
      }
    }
  }

  await walk(dir, '')
  return results
}
