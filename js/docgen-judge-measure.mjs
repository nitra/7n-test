#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    printUsage()
    process.exit(0)
  }

  if (args.length === 0) {
    process.exit(0)
  }

  const results = []

  for (const file of args) {
    const content = await readFile(file, 'utf8')
    const records = parseRecords(content)
    results.push(measureFile(file, records))
  }

  console.log(JSON.stringify({ files: results }, null, 2))
}

function printUsage() {
  console.log('Usage: node docgen-judge-measure.mjs <file1> <file2> ...')
}

function parseRecords(content) {
  const trimmed = content.trim()

  if (!trimmed) {
    return []
  }

  if (trimmed.startsWith('[')) {
    const parsed = JSON.parse(trimmed)
    return Array.isArray(parsed) ? parsed : [parsed]
  }

  return trimmed
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line))
}

function measureFile(file, records) {
  const scores = records.map(readScore).filter(score => Number.isFinite(score))
  const passed = records.filter(record => readPassed(record)).length

  return {
    file: path.relative(process.cwd(), file),
    records: records.length,
    scored: scores.length,
    passed,
    failed: records.length - passed,
    averageScore: scores.length === 0 ? null : round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  }
}

function readScore(record) {
  if (!record || typeof record !== 'object') {
    return Number.NaN
  }

  const score = record.score ?? record.totalScore ?? record.result?.score ?? record.result?.totalScore
  return typeof score === 'number' ? score : Number(score)
}

function readPassed(record) {
  if (!record || typeof record !== 'object') {
    return false
  }

  if (typeof record.passed === 'boolean') {
    return record.passed
  }

  if (typeof record.ok === 'boolean') {
    return record.ok
  }

  const score = readScore(record)
  return Number.isFinite(score) && score >= 0.8
}

function round(value) {
  return Math.round(value * 1000) / 1000
}
