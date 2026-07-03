/**
 * Per-file coverage via vitest + lcov.
 * Runs vitest (bundled with \@7n/test) in a single pass and returns
 * both per-file coverage data and failing tests.
 * Target projects do NOT need vitest or \@vitest/coverage-v8 installed.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { env } from 'node:process'
import { resolveVitestRun } from './lib/vitest-shim.mjs'

const TEST_FILE_RE = /\.(test|spec)\.[^.]+$|(?:^|[/\\])tests?[/\\]/
const VITEST_UNSUPPORTED_TEST_RE = /bun:test|Cannot find package 'bun/i
const MAX_ERRORS_PER_FILE = 5
const MAX_ERROR_LINES = 10

/**
 * @param {string} text lcov.info content
 * @returns {Array<{file: string, pct: number, linesFound: number, linesCovered: number}>} per-file coverage rows parsed from lcov
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
 * @returns {Array<{file: string, errors: string[]}>} список failing test-файлів з короткими помилками
 */
export function parseFailingTests(jsonPath, dir) {
  try {
    const data = JSON.parse(readFileSync(jsonPath, 'utf8'))
    return (
      (data.testResults ?? [])
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
          const errors =
            assertionErrors.length > 0
              ? assertionErrors
              : [
                  `Suite error: ${(r.message ?? r.failureMessage ?? 'module-level failure').split('\n').slice(0, MAX_ERROR_LINES).join('\n')}`
                ]
          return { file: relative(dir, r.testFilePath ?? r.name), errors }
        })
        .filter(f => !f.file.startsWith('..'))
        // Skip test files that use a non-vitest runner (bun:test, jest, etc.)
        // They are expected to fail and cannot be fixed by this tool.
        .filter(f => f.errors.every(e => !VITEST_UNSUPPORTED_TEST_RE.test(e)))
    )
  } catch {
    return []
  }
}

/**
 * Runs vitest coverage + JSON reporter in a single pass.
 * Returns per-file coverage and any failing tests detected in the same run.
 * @param {string} dir project root
 * @returns {Promise<{files: Array<{file: string, pct: number, linesFound: number, linesCovered: number}>, failingTests: Array<{file: string, errors: string[]}>}>} coverage rows and failing tests from one vitest run
 */
export async function measureCoveragePerFile(dir) {
  const lcovDir = await mkdtemp(join(tmpdir(), '7n-cov-'))
  const jsonResultsFile = join(lcovDir, 'test-results.json')

  const { bin, configArgs } = resolveVitestRun(dir)
  try {
    spawnSync(
      process.execPath,
      [
        bin,
        'run',
        ...configArgs,
        '--root',
        dir,
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
    try {
      await rm(lcovDir, { recursive: true, force: true })
    } catch {
      /* ignore cleanup failures */
    }
  }
}

/**
 * Files below the coverage threshold.
 * @param {Array<{file: string, pct: number}>} files список файлів із coverage-метриками
 * @param {number} [threshold] coverage floor; за замовчуванням `80`
 * @returns {Array<{file: string, pct: number}>} файли, чий coverage нижчий за threshold
 */
export function getUncoveredFiles(files, threshold = 80) {
  return files.filter(f => f.pct < threshold)
}

/**
 * Рендерить per-file line coverage як Markdown-таблицю без мутаційних даних.
 * Використовується для `COVERAGE.md`, коли мутаційне тестування пропущено
 * (`--no-mutation`) і провайдери `.n-cursor.json#rules` не викликались.
 * @param {Array<{file: string, pct: number, linesFound: number, linesCovered: number}>} files per-file coverage rows
 * @returns {string} Markdown з заголовком `# Coverage`
 */
export function renderPerFileMarkdown(files) {
  const sorted = files.toSorted((a, b) => a.pct - b.pct || a.file.localeCompare(b.file))
  const lines = [
    '# Coverage',
    '',
    '_Мутаційне тестування пропущено (`--no-mutation`) — лише per-file покриття рядків._',
    '',
    '| Файл | Рядки | % |',
    '| --- | --- | --- |'
  ]
  let coveredTotal = 0
  let foundTotal = 0
  for (const f of sorted) {
    lines.push(`| ${f.file} | ${f.linesCovered}/${f.linesFound} | ${f.pct.toFixed(2)}% |`)
    coveredTotal += f.linesCovered
    foundTotal += f.linesFound
  }
  const totalPct = foundTotal === 0 ? 100 : (coveredTotal / foundTotal) * 100
  lines.push(`| **Разом** | ${coveredTotal}/${foundTotal} | ${totalPct.toFixed(2)}% |`)
  return `${lines.join('\n')}\n`
}

const SOURCE_EXT_RE = /\.(mjs|js|ts|vue|py)$/
const IGNORE_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'out',
  '.git',
  '__pycache__',
  'coverage',
  '.cursor',
  '.claude',
  '.pi',
  'docs',
  'bin',
  'reports',
  'types'
])

// Config/tooling files that are not unit-testable source files.
const CONFIG_FILE_RE =
  /^(?:vitest|jest|eslint|prettier|stryker|babel|webpack|vite|rollup|tsconfig|jsconfig|knip)\.config\./

/**
 * Recursively finds source code files in a directory, excluding tests and
 * ignored directories. Used for bootstrap when no coverage data exists.
 * @param {string} dir project root
 * @returns {Promise<string[]>} relative paths to source files that look unit-testable
 */
export async function findSourceFiles(dir) {
  const results = []

  /**
   * @param {string} current absolute directory path
   * @param {string} relBase relative path prefix
   */
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
      } else if (
        entry.isFile() &&
        SOURCE_EXT_RE.test(entry.name) &&
        !entry.name.endsWith('.d.ts') &&
        !entry.name.endsWith('.d.mts') &&
        !CONFIG_FILE_RE.test(entry.name) &&
        !TEST_FILE_RE.test(rel)
      ) {
        results.push(rel)
      }
    }
  }

  await walk(dir, '')
  return results
}
