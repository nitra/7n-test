import { resolve } from 'node:path'
import { cwd as getCwd } from 'node:process'

export async function run(args) {
  const flags = (args ?? []).filter(a => a.startsWith('--'))
  const positional = (args ?? []).filter(a => !a.startsWith('--'))
  const [first] = positional

  if (flags.includes('--help') || flags.includes('-h') || first === '--help' || first === '-h') {
    console.log('Usage: n [directory] [--no-mutation]')
    console.log('  Runs coverage analysis, generates missing tests, then mutation testing.')
    console.log('  --no-mutation  Skip mutation testing phase.')
    console.log('  Defaults to current directory when no argument is given.')
    console.log('Usage: n coverage [--fix] [--changed]')
    console.log('  Coverage + mutation testing only (no test generation) — writes COVERAGE.md.')
    console.log('  --fix      Agent fixes survived mutants, then re-runs coverage.')
    console.log('  --changed  Scope to files changed vs merge-base with main — no COVERAGE.md write.')
    return 0
  }

  if (first === 'coverage') {
    const { runCoverageCli } = await import('./coverage/coverage.mjs')
    return runCoverageCli({
      cwd: getCwd(),
      fix: flags.includes('--fix'),
      changed: flags.includes('--changed')
    })
  }

  const dir = first ? resolve(first) : getCwd()
  const noMutation = flags.includes('--no-mutation')
  const { runAutoTest } = await import('./run.mjs')
  return runAutoTest(dir, { noMutation })
}
