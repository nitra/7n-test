#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import process from 'node:process'

const files = process.argv.slice(2).filter(arg => arg && !arg.startsWith('-'))

if (files.length === 0) {
  process.exit(0)
}

const here = path.dirname(fileURLToPath(import.meta.url))
const judgeScript = path.resolve(here, 'docgen-judge-measure.mjs')
const result = spawnSync(process.execPath, [judgeScript, ...files], {
  stdio: 'inherit'
})

if (result.error) {
  throw result.error
}

process.exit(result.status ?? 1)
