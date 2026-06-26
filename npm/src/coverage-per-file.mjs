/**
 * Per-file coverage via vitest + lcov.
 * Runs `bunx vitest run --coverage --coverage.reporter=lcov` and parses lcov.info
 * per source file. Returns relative paths (to dir) with line coverage %.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { env } from 'node:process'

const TEST_FILE_RE = /\.(test|spec)\.[^.]+$|[/\\]tests?[/\\]/

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
 * Runs vitest coverage and returns per-file line coverage data.
 * @param {string} dir project root
 * @returns {Promise<Array<{file: string, pct: number, linesFound: number, linesCovered: number}>>}
 */
export async function measureCoveragePerFile(dir) {
  const lcovDir = await mkdtemp(join(tmpdir(), '7n-cov-'))
  try {
    spawnSync(
      'bunx',
      [
        'vitest',
        'run',
        '--passWithNoTests',
        '--coverage',
        '--coverage.reporter=lcov',
        `--coverage.reportsDirectory=${lcovDir}`
      ],
      { cwd: dir, stdio: 'inherit', env }
    )
    const lcovPath = join(lcovDir, 'lcov.info')
    if (!existsSync(lcovPath)) return []
    const allFiles = parseLcovPerFile(readFileSync(lcovPath, 'utf8'))
    return allFiles
      .map(f => ({ ...f, file: relative(dir, f.file) }))
      .filter(f => !f.file.startsWith('..') && !TEST_FILE_RE.test(f.file))
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
