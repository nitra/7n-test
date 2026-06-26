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
    return 0
  }

  const dir = first ? resolve(first) : getCwd()
  const noMutation = flags.includes('--no-mutation')
  const { runAutoTest } = await import('./run.mjs')
  return runAutoTest(dir, { noMutation })
}
