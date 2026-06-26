#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import process from 'node:process';

const args = process.argv.slice(2);

if (args.length === 0) {
  process.exit(0);
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const measure = async (filePath) => {
  const content = await readFile(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const trimmed = content.trim();
  const nonEmptyLines = lines.filter((line) => line.trim() !== '');
  const hasFrontmatter = trimmed.startsWith('---\n') || trimmed.startsWith('---\r\n');
  const hasHeading = lines.some((line) => /^#\s+/.test(line));
  const hasBullets = lines.some((line) => /^-\s+/.test(line));
  const hasCodeFence = lines.some((line) => /^```/.test(line));

  let score = 0;
  score += hasFrontmatter ? 0.25 : 0;
  score += hasHeading ? 0.25 : 0;
  score += hasBullets ? 0.2 : 0;
  score += hasCodeFence ? 0.1 : 0;
  score += clamp(nonEmptyLines.length / 20, 0, 1) * 0.2;

  const normalizedScore = Number(clamp(score, 0, 1).toFixed(3));

  return {
    file: filePath,
    score: normalizedScore,
    degraded: normalizedScore < 0.6,
    metrics: {
      bytes: Buffer.byteLength(content, 'utf8'),
      lines: lines.length,
      nonEmptyLines: nonEmptyLines.length,
      hasFrontmatter,
      hasHeading,
      hasBullets,
      hasCodeFence
    }
  };
};

const results = [];
let hasError = false;

for (const filePath of args) {
  try {
    results.push(await measure(filePath));
  } catch (error) {
    hasError = true;
    results.push({
      file: filePath,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);

if (hasError) {
  process.exitCode = 1;
}
