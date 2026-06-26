import { resolve } from 'node:path'
import { cwd as getCwd } from 'node:process'

export async function run(args) {
  const [first] = args ?? []

  if (first === '--help' || first === '-h') {
    console.log('Usage: n [directory]')
    console.log('  Runs coverage analysis, generates missing tests, then mutation testing.')
    console.log('  Defaults to current directory when no argument is given.')
    return 0
  }

  const dir = first ? resolve(first) : getCwd()
  const { runAutoTest } = await import('./run.mjs')
  return runAutoTest(dir)
}
