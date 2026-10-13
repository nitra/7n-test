import { resolve } from 'node:path'
import { cwd as getCwd } from 'node:process'

/**
 * CLI-диспетчер `@7n/test`: `--help`, `coverage` (nightly-повний вимір з mutation
 * testing), `storybook` (швидкий PR-гейт канону Storybook) або дефолтний
 * auto-test flow по директорії.
 * @param {string[]} args аргументи CLI (без node/script)
 * @returns {Promise<number>} exit code
 */
export async function run(args) {
  const flags = new Set((args ?? []).filter(a => a.startsWith('--')))
  const positional = (args ?? []).find(a => !a.startsWith('--'))
  const first = positional

  if (flags.has('--help') || flags.has('-h') || first === '--help' || first === '-h') {
    console.log('Usage: n [directory] [--no-mutation]')
    console.log('  Runs coverage analysis, generates missing tests, then mutation testing.')
    console.log('  --no-mutation  Skip mutation testing phase.')
    console.log('  Defaults to current directory when no argument is given.')
    console.log('Usage: n coverage [--fix] [--changed]')
    console.log('  Coverage + mutation testing only (no test generation) — writes COVERAGE.md.')
    console.log('  --fix      Agent fixes survived mutants, then re-runs coverage.')
    console.log('  --changed  Scope to files changed vs merge-base with main — no COVERAGE.md write.')
    console.log('Usage: n storybook')
    console.log('  Fast PR gate for Storybook packages: vitest run --project=storybook per root.')
    console.log('  Storybook canon split: PR — this fast run only; nightly — full `n coverage`.')
    return 0
  }

  if (first === 'coverage') {
    const { runCoverageCli } = await import('./coverage/coverage.mjs')
    return runCoverageCli({
      cwd: getCwd(),
      fix: flags.has('--fix'),
      changed: flags.has('--changed')
    })
  }

  if (first === 'storybook') {
    const { runStorybookCli } = await import('./storybook-run.mjs')
    return runStorybookCli({ cwd: getCwd() })
  }

  const dir = first ? resolve(first) : getCwd()
  const noMutation = flags.has('--no-mutation')
  const { runAutoTest } = await import('./run.mjs')
  return runAutoTest(dir, { noMutation })
}
