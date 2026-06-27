# Coverage

| Область | Рядки              | Функції        | Вбито мутацій | Score  |
| ------- | ------------------ | -------------- | ------------- | ------ |
| JS      | 69.50% (1570/2259) | 59.74% (46/77) | 555/1695      | 32.74% |

## Вцілілі мутанти

````json
[
  {
    "file": "npm/src/assess-need.mjs",
    "mutants": [
      {
        "line": 11,
        "col": 23,
        "mutantType": "StringLiteral",
        "original": "You are a test-need classifier for JS/TS source files.\n\nGiven a source file with low test coverage, decide if unit tests are worthwhile.\n\nReply ONLY with a JSON object (no markdown fence):\n{\"needsTests\": true|false, \"reason\": \"one sentence in Ukrainian\"}\n\nneedsTests: false when:\n- File only contains types, interfaces, constants, or re-exports with no logic\n- Thin config or index file that just wires up other modules\n- Behavior is fully covered by integration/e2e tests (name them)\n\nneedsTests: true when:\n- File contains utility functions, parsers, transformers with branches\n- Business logic with conditions or non-trivial contracts\n- Pure functions that can be unit-tested cheaply`",
        "replacement": "``"
      },
      {
        "line": 39,
        "col": 7,
        "mutantType": "ConditionalExpression",
        "original": "ontent.length > MAX_CONTENT_BYTES)",
        "replacement": "true"
      },
      {
        "line": 39,
        "col": 7,
        "mutantType": "EqualityOperator",
        "original": "ontent.length > MAX_CONTENT_BYTES)",
        "replacement": "content.length >= MAX_CONTENT_BYTES"
      },
      {
        "line": 39,
        "col": 53,
        "mutantType": "MethodExpression",
        "original": "ontent.slice(0, MAX_CONTENT_BYTES) ",
        "replacement": "content"
      },
      {
        "line": 42,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "${SYSTEM_PROMPT}\\n\\n` ",
        "replacement": "``"
      },
      {
        "line": 48,
        "col": 30,
        "mutantType": "Regex",
        "original": "\\{[\\s\\S]*?\"needsTests\"[\\s\\S]*?\\}/)",
        "replacement": "/\\{[\\S\\S]*?\"needsTests\"[\\s\\S]*?\\}/"
      },
      {
        "line": 48,
        "col": 30,
        "mutantType": "Regex",
        "original": "\\{[\\s\\S]*?\"needsTests\"[\\s\\S]*?\\}/)",
        "replacement": "/\\{[\\s\\s]*?\"needsTests\"[\\s\\S]*?\\}/"
      },
      {
        "line": 49,
        "col": 31,
        "mutantType": "OptionalChaining",
        "original": "atch?.[0] ",
        "replacement": "match[0]"
      },
      {
        "line": 49,
        "col": 45,
        "mutantType": "StringLiteral",
        "original": "{}')",
        "replacement": "\"\""
      },
      {
        "line": 54,
        "col": 67,
        "mutantType": "StringLiteral",
        "original": "'",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 57,
        "col": 80,
        "mutantType": "StringLiteral",
        "original": "оцінка не вдалась — вважаємо що потрібні тести' ",
        "replacement": "\"\""
      }
    ],
    "exampleTest": {
      "testFile": "npm/src/assess-need.test.mjs",
      "code": "  it('returns needsTests:false when file not found', async () => {\n    vi.mocked(existsSync).mockReturnValue(false)\n    const result = await assessNeed([{ file: 'src/a.mjs', pct: 0 }], DIR, { callText: mockCallText })\n    expect(result[0].needsTests).toBe(false)\n    expect(result[0].reason).toBe('файл недоступний')\n    expect(mockCallText).not.toHaveBeenCalled()\n  })"
    },
    "recommendationText": null
  },
  {
    "file": "npm/src/coverage/coverage.mjs",
    "mutants": [
      {
        "line": 33,
        "col": 47,
        "mutantType": "StringLiteral",
        "original": "@nitra',",
        "replacement": "\"\""
      },
      {
        "line": 33,
        "col": 57,
        "mutantType": "StringLiteral",
        "original": "cursor',",
        "replacement": "\"\""
      },
      {
        "line": 33,
        "col": 67,
        "mutantType": "StringLiteral",
        "original": "rules')",
        "replacement": "\"\""
      },
      {
        "line": 97,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "',",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 99,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "| --- | --- | --- | --- | --- |'",
        "replacement": "\"\""
      },
      {
        "line": 110,
        "col": 16,
        "mutantType": "StringLiteral",
        "original": "',",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 110,
        "col": 42,
        "mutantType": "StringLiteral",
        "original": "',",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 110,
        "col": 46,
        "mutantType": "StringLiteral",
        "original": "```json',",
        "replacement": "\"\""
      },
      {
        "line": 110,
        "col": 95,
        "mutantType": "StringLiteral",
        "original": "```')",
        "replacement": "\"\""
      },
      {
        "line": 113,
        "col": 18,
        "mutantType": "StringLiteral",
        "original": "',",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 113,
        "col": 43,
        "mutantType": "StringLiteral",
        "original": "',",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 113,
        "col": 47,
        "mutantType": "StringLiteral",
        "original": "| Рядок | Оригінал | Заміна | Тип |',",
        "replacement": "\"\""
      },
      {
        "line": 113,
        "col": 86,
        "mutantType": "StringLiteral",
        "original": "| --- | --- | --- | --- |')",
        "replacement": "\"\""
      },
      {
        "line": 117,
        "col": 11,
        "mutantType": "ConditionalExpression",
        "original": "roup.exampleTest)",
        "replacement": "true"
      },
      {
        "line": 119,
        "col": 11,
        "mutantType": "StringLiteral",
        "original": "',",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 121,
        "col": 11,
        "mutantType": "StringLiteral",
        "original": "',",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 122,
        "col": 11,
        "mutantType": "StringLiteral",
        "original": "```js',",
        "replacement": "\"\""
      },
      {
        "line": 123,
        "col": 11,
        "mutantType": "LogicalOperator",
        "original": "roup.exampleTest.code ?? '',",
        "replacement": "group.exampleTest.code && ''"
      },
      {
        "line": 124,
        "col": 11,
        "mutantType": "StringLiteral",
        "original": "```'",
        "replacement": "\"\""
      },
      {
        "line": 127,
        "col": 11,
        "mutantType": "ConditionalExpression",
        "original": "roup.recommendationText)",
        "replacement": "true"
      },
      {
        "line": 127,
        "col": 11,
        "mutantType": "ConditionalExpression",
        "original": "roup.recommendationText)",
        "replacement": "false"
      },
      {
        "line": 127,
        "col": 37,
        "mutantType": "BlockStatement",
        "original": "\n        lines.push('', '**Що треба протестувати:**', '', group.recommendationText)\n      }",
        "replacement": "{}"
      },
      {
        "line": 128,
        "col": 20,
        "mutantType": "StringLiteral",
        "original": "',",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 128,
        "col": 24,
        "mutantType": "StringLiteral",
        "original": "**Що треба протестувати:**',",
        "replacement": "\"\""
      },
      {
        "line": 128,
        "col": 54,
        "mutantType": "StringLiteral",
        "original": "',",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 133,
        "col": 7,
        "mutantType": "ConditionalExpression",
        "original": "llowedGaps.length > 0)",
        "replacement": "true"
      },
      {
        "line": 133,
        "col": 7,
        "mutantType": "ConditionalExpression",
        "original": "llowedGaps.length > 0)",
        "replacement": "false"
      },
      {
        "line": 133,
        "col": 7,
        "mutantType": "EqualityOperator",
        "original": "llowedGaps.length > 0)",
        "replacement": "allowedGaps.length >= 0"
      },
      {
        "line": 133,
        "col": 7,
        "mutantType": "EqualityOperator",
        "original": "llowedGaps.length > 0)",
        "replacement": "allowedGaps.length <= 0"
      },
      {
        "line": 166,
        "col": 24,
        "mutantType": "StringLiteral",
        "original": "\\n')",
        "replacement": "\"\""
      }
    ],
    "exampleTest": {
      "testFile": "npm/src/coverage/coverage.test.mjs",
      "code": "    it(\"should correctly sum coverage totals\", () => {\n      const a = { lines: { covered: 5, total: 10 }, functions: { covered: 2, total: 5 } }\n      const b = { lines: { covered: 3, total: 5 }, functions: { covered: 1, total: 2 } }\n      const result = addCoverage(a, b)\n      expect(result.lines.covered).toBe(8)\n      expect(result.lines.total).toBe(15)\n      expect(result.functions.covered).toBe(3)\n      expect(result.functions.total).toBe(7)\n    })"
    },
    "recommendationText": null
  },
  {
    "file": "npm/src/coverage-classify/apply.mjs",
    "mutants": [
      {
        "line": 10,
        "col": 46,
        "mutantType": "StringLiteral",
        "original": "defensive',",
        "replacement": "\"\""
      },
      {
        "line": 10,
        "col": 59,
        "mutantType": "StringLiteral",
        "original": "glue',",
        "replacement": "\"\""
      },
      {
        "line": 10,
        "col": 67,
        "mutantType": "StringLiteral",
        "original": "wrapper']",
        "replacement": "\"\""
      },
      {
        "line": 19,
        "col": 48,
        "mutantType": "EqualityOperator",
        "original": "erdict.confidence >= threshold",
        "replacement": "verdict.confidence > threshold"
      },
      {
        "line": 48,
        "col": 28,
        "mutantType": "ObjectLiteral",
        "original": " file: group.file, mutant, verdict })",
        "replacement": "{}"
      }
    ],
    "exampleTest": {
      "testFile": "npm/src/coverage-classify/apply.test.mjs",
      "code": "  it(\"should mark equivalent mutants as allowed gaps if confidence >= threshold\", () => {\n    const result = applyVerdicts(mockRows, mockVerdicts, 0.8)\n    expect(result.allowedGaps).toHaveLength(1)\n    expect(result.rows[0].mutation.total).toBe(9)\n    expect(result.rows[0].survived).toHaveLength(0)\n  })"
    },
    "recommendationText": null
  },
  {
    "file": "npm/src/coverage-classify/cache.mjs",
    "mutants": [
      {
        "line": 29,
        "col": 25,
        "mutantType": "StringLiteral",
        "original": "git',",
        "replacement": "\"\""
      },
      {
        "line": 29,
        "col": 32,
        "mutantType": "ArrayDeclaration",
        "original": "'hash-object', filePath],",
        "replacement": "[]"
      },
      {
        "line": 29,
        "col": 33,
        "mutantType": "StringLiteral",
        "original": "hash-object',",
        "replacement": "\"\""
      },
      {
        "line": 29,
        "col": 59,
        "mutantType": "ObjectLiteral",
        "original": " encoding: 'utf8' })",
        "replacement": "{}"
      },
      {
        "line": 29,
        "col": 71,
        "mutantType": "StringLiteral",
        "original": "utf8' ",
        "replacement": "\"\""
      },
      {
        "line": 44,
        "col": 7,
        "mutantType": "ConditionalExpression",
        "original": "blobHash)",
        "replacement": "true"
      },
      {
        "line": 57,
        "col": 7,
        "mutantType": "ConditionalExpression",
        "original": "existsSync(cachePath))",
        "replacement": "false"
      },
      {
        "line": 59,
        "col": 53,
        "mutantType": "StringLiteral",
        "original": "utf8')",
        "replacement": "\"\""
      },
      {
        "line": 60,
        "col": 9,
        "mutantType": "OptionalChaining",
        "original": "ata?.version ",
        "replacement": "data.version"
      },
      {
        "line": 61,
        "col": 9,
        "mutantType": "ConditionalExpression",
        "original": "data.entries || typeof data.entries !== 'object' || Array.isArray(data.entries))",
        "replacement": "false"
      },
      {
        "line": 61,
        "col": 9,
        "mutantType": "LogicalOperator",
        "original": "data.entries || typeof data.entries !== 'object' || Array.isArray(data.entries))",
        "replacement": "(!data.entries || typeof data.entries !== 'object') && Array.isArray(data.entries)"
      },
      {
        "line": 61,
        "col": 9,
        "mutantType": "ConditionalExpression",
        "original": "data.entries || typeof data.entries !== 'object' ",
        "replacement": "false"
      },
      {
        "line": 61,
        "col": 9,
        "mutantType": "LogicalOperator",
        "original": "data.entries || typeof data.entries !== 'object' ",
        "replacement": "!data.entries && typeof data.entries !== 'object'"
      },
      {
        "line": 61,
        "col": 26,
        "mutantType": "ConditionalExpression",
        "original": "ypeof data.entries !== 'object' ",
        "replacement": "false"
      }
    ],
    "exampleTest": {
      "testFile": "npm/src/coverage-classify/cache.test.mjs",
      "code": "    it('uses git hash-object when available', () => {\n      vi.mocked(existsSync).mockReturnValue(true)\n      vi.mocked(execFileSync).mockReturnValue('abc123\\n')\n      expect(deriveBlobHash(FILE)).toBe('abc123')\n    })"
    },
    "recommendationText": null
  },
  {
    "file": "npm/src/coverage-classify/index.mjs",
    "mutants": [
      {
        "line": 25,
        "col": 11,
        "mutantType": "StringLiteral",
        "original": "LLM-classification unavailable, conservative fallback (treat as worth-testing)'",
        "replacement": "\"\""
      },
      {
        "line": 48,
        "col": 18,
        "mutantType": "StringLiteral",
        "original": "${SYSTEM_PROMPT}\\n\\n${buildUserPrompt({ ...mutant, file: group.file }, cwd)}`",
        "replacement": "``"
      },
      {
        "line": 49,
        "col": 15,
        "mutantType": "StringLiteral",
        "original": "${group.file}:${mutant.line}:${mutant.col}`",
        "replacement": "``"
      },
      {
        "line": 53,
        "col": 51,
        "mutantType": "StringLiteral",
        "original": "min')",
        "replacement": "\"\""
      },
      {
        "line": 61,
        "col": 20,
        "mutantType": "StringLiteral",
        "original": "⚠ coverage classify: ${loc} both tiers failed: ${error.message}`)",
        "replacement": "``"
      },
      {
        "line": 75,
        "col": 21,
        "mutantType": "LogicalOperator",
        "original": "pts.cachePath ?? join(cwd, 'npm/reports/coverage-classify.cache.json')",
        "replacement": "opts.cachePath && join(cwd, 'npm/reports/coverage-classify.cache.json')"
      },
      {
        "line": 75,
        "col": 49,
        "mutantType": "StringLiteral",
        "original": "npm/reports/coverage-classify.cache.json')",
        "replacement": "\"\""
      },
      {
        "line": 77,
        "col": 38,
        "mutantType": "StringLiteral",
        "original": "min')",
        "replacement": "\"\""
      },
      {
        "line": 80,
        "col": 7,
        "mutantType": "ConditionalExpression",
        "original": "ache.model !== cacheModel)",
        "replacement": "false"
      },
      {
        "line": 88,
        "col": 25,
        "mutantType": "StringLiteral",
        "original": "${group.file}:${mutant.line}:${mutant.col}:${mutant.replacement}`",
        "replacement": "``"
      },
      {
        "line": 103,
        "col": 13,
        "mutantType": "ConditionalExpression",
        "original": "acheKey)",
        "replacement": "true"
      },
      {
        "line": 103,
        "col": 13,
        "mutantType": "ConditionalExpression",
        "original": "acheKey)",
        "replacement": "false"
      },
      {
        "line": 103,
        "col": 23,
        "mutantType": "BlockStatement",
        "original": "\n          cache.entries[cacheKey] = { ...verdict, classifiedAt: new Date().toISOString() }\n        }",
        "replacement": "{}"
      }
    ],
    "exampleTest": {
      "testFile": "npm/src/coverage-classify/index.test.mjs",
      "code": "  it(\"should use cached verdict if available\", async () => {\n    const cachedVerdict = { verdict: \"ok\", confidence: 1.0, reason: \"Cached\" }\n    vi.mocked(readCache).mockReturnValue({ version: 1, model: \"mock_model+cloud\", entries: { \"mock_key\": { verdict: \"ok\", confidence: 1.0, reason: \"Cached\" } } })\n    \n    const results = await classify(mockSurvived, mockCwd)\n    \n    expect(vi.mocked(deriveCacheKey)).toHaveBeenCalled()\n    expect(results[0].verdict.verdict).toBe(\"ok\")\n  })"
    },
    "recommendationText": null
  },
  {
    "file": "npm/src/coverage-classify/prompt.mjs",
    "mutants": [
      {
        "line": 13,
        "col": 30,
        "mutantType": "StringLiteral",
        "original": "You are a mutation testing classifier.\n\nFor each survived Stryker mutant, classify it into exactly one verdict:\n\n- **worth-testing**: pure logic with real branches that should be tested. The mutant\n  exposes a missing assertion in a unit test. Recommend a test approach.\n- **equivalent**: the mutated code is behaviorally indistinguishable from the original\n  (e.g., both branches produce the same observable output, or the mutant lies on dead\n  code). You MUST cite a concrete reason referencing input flow or output equivalence.\n- **defensive**: the branch guards against an impossible state given input contracts\n  or type system. You MUST identify the invariant that makes the state unreachable.\n- **glue**: thin CLI entrypoint, factory, or boilerplate (e.g., runStandardRule\n  wrapper, fix.mjs stubs). Integration tests via subprocess cover the behavior.\n  Name the integration test or pattern.\n- **wrapper**: thin shell around an external tool (spawnSync, fetch, dynamic import).\n  The wrapper has no logic worth unit-testing in isolation; behavior comes from the\n  wrapped tool. Name the integration test or pattern.\n\nOutput ONLY a single JSON object matching this schema:\n\n\\`\\`\\`\n{\n  \"verdict\": \"worth-testing\" | \"equivalent\" | \"defensive\" | \"glue\" | \"wrapper\",\n  \"confidence\": number 0-1,\n  \"reason\": string (20-500 chars; concrete code-level reference, not \"seems like\"),\n  \"suggestedTest\": string (max 300 chars; required only when verdict is worth-testing)\n}\n\\`\\`\\`\n\nConfidence guidance:\n- 0.9+: cite specific code fragment, identifier, or input contract proving the verdict.\n- 0.7-0.9: strong inference from visible code structure.\n- <0.7: ambiguity, lacking context, or unfamiliar pattern. Be honest.\n\nNever invent integration test names. If you cannot identify a covering test, use\nworth-testing with low confidence instead of glue/wrapper.\n`",
        "replacement": "``"
      },
      {
        "line": 70,
        "col": 46,
        "mutantType": "BlockStatement",
        "original": "\n  const absPath = join(cwd, mutant.file)\n\n  // Source context\n  let srcContext = '(source file unavailable)'\n  if (existsSync(absPath)) {\n    const lines = readFileSync(absPath, 'utf8').split('\\n')\n    const start = Math.max(0, mutant.line - 1 - CONTEXT_LINES)\n    const end = Math.min(lines.length, mutant.line + CONTEXT_LINES)\n    srcContext = lines\n      .slice(start, end)\n      .map((l, i) => `${start + i + 1}: ${l}`)\n      .join('\\n')\n  }\n\n  // Existing tests\n  const testPath = join(dirname(absPath), 'tests', `${basename(absPath, '.mjs')}.test.mjs`)\n  let existingTests = '(no test file)'\n  if (existsSync(testPath)) {\n    const content = readFileSync(testPath, 'utf8')\n    if (content.split('\\n').length > TEST_FILE_MAX_LINES) {\n      existingTests = extractTestTitles(content)\n    } else {\n      existingTests = content\n    }\n  }\n\n  // Recent git activity (graceful если нет git або untracked)\n  let recentActivity = '(no git history)'\n  try {\n    const out = execFileSync('git', ['log', '-1', '--format=%ar', '--', absPath], {\n      cwd,\n      encoding: 'utf8',\n      stdio: ['ignore', 'pipe', 'ignore']\n    }).trim()\n    if (out) recentActivity = out\n  } catch {\n    // git unavailable or file untracked — keep placeholder\n  }\n\n  return `# Mutant\nFile: ${mutant.file}\nLine: ${mutant.line}:${mutant.col}\nType: ${mutant.mutantType}\nOriginal code: \\`${mutant.original}\\`\nMutated to: \\`${mutant.replacement}\\`\n\n# Source context (±${CONTEXT_LINES} lines)\n${srcContext}\n\n# Existing tests\n${existingTests}\n\n# Recent activity\nFile last modified: ${recentActivity}\n`\n}",
        "replacement": "{}"
      },
      {
        "line": 74,
        "col": 20,
        "mutantType": "StringLiteral",
        "original": "(source file unavailable)'",
        "replacement": "\"\""
      },
      {
        "line": 75,
        "col": 7,
        "mutantType": "ConditionalExpression",
        "original": "xistsSync(absPath))",
        "replacement": "false"
      },
      {
        "line": 86,
        "col": 43,
        "mutantType": "StringLiteral",
        "original": "tests',",
        "replacement": "\"\""
      },
      {
        "line": 86,
        "col": 52,
        "mutantType": "StringLiteral",
        "original": "${basename(absPath, '.mjs')}.test.mjs`)",
        "replacement": "``"
      },
      {
        "line": 86,
        "col": 73,
        "mutantType": "StringLiteral",
        "original": ".mjs')",
        "replacement": "\"\""
      },
      {
        "line": 87,
        "col": 23,
        "mutantType": "StringLiteral",
        "original": "(no test file)'",
        "replacement": "\"\""
      },
      {
        "line": 88,
        "col": 7,
        "mutantType": "ConditionalExpression",
        "original": "xistsSync(testPath))",
        "replacement": "false"
      },
      {
        "line": 98,
        "col": 24,
        "mutantType": "StringLiteral",
        "original": "(no git history)'",
        "replacement": "\"\""
      },
      {
        "line": 99,
        "col": 7,
        "mutantType": "BlockStatement",
        "original": "\n    const out = execFileSync('git', ['log', '-1', '--format=%ar', '--', absPath], {\n      cwd,\n      encoding: 'utf8',\n      stdio: ['ignore', 'pipe', 'ignore']\n    }).trim()\n    if (out) recentActivity = out\n  } ",
        "replacement": "{}"
      },
      {
        "line": 100,
        "col": 17,
        "mutantType": "MethodExpression",
        "original": "xecFileSync('git', ['log', '-1', '--format=%ar', '--', absPath], {\n      cwd,\n      encoding: 'utf8',\n      stdio: ['ignore', 'pipe', 'ignore']\n    }).trim()",
        "replacement": "execFileSync('git', ['log', '-1', '--format=%ar', '--', absPath], {\n  cwd,\n  encoding: 'utf8',\n  stdio: ['ignore', 'pipe', 'ignore']\n})"
      },
      {
        "line": 100,
        "col": 30,
        "mutantType": "StringLiteral",
        "original": "git',",
        "replacement": "\"\""
      },
      {
        "line": 100,
        "col": 37,
        "mutantType": "ArrayDeclaration",
        "original": "'log', '-1', '--format=%ar', '--', absPath],",
        "replacement": "[]"
      },
      {
        "line": 100,
        "col": 38,
        "mutantType": "StringLiteral",
        "original": "log',",
        "replacement": "\"\""
      },
      {
        "line": 100,
        "col": 45,
        "mutantType": "StringLiteral",
        "original": "-1',",
        "replacement": "\"\""
      },
      {
        "line": 100,
        "col": 51,
        "mutantType": "StringLiteral",
        "original": "--format=%ar',",
        "replacement": "\"\""
      },
      {
        "line": 100,
        "col": 67,
        "mutantType": "StringLiteral",
        "original": "--',",
        "replacement": "\"\""
      },
      {
        "line": 100,
        "col": 83,
        "mutantType": "ObjectLiteral",
        "original": "\n      cwd,\n      encoding: 'utf8',\n      stdio: ['ignore', 'pipe', 'ignore']\n    })",
        "replacement": "{}"
      },
      {
        "line": 102,
        "col": 17,
        "mutantType": "StringLiteral",
        "original": "utf8',",
        "replacement": "\"\""
      },
      {
        "line": 103,
        "col": 14,
        "mutantType": "ArrayDeclaration",
        "original": "'ignore', 'pipe', 'ignore']",
        "replacement": "[]"
      },
      {
        "line": 103,
        "col": 15,
        "mutantType": "StringLiteral",
        "original": "ignore',",
        "replacement": "\"\""
      },
      {
        "line": 103,
        "col": 25,
        "mutantType": "StringLiteral",
        "original": "pipe',",
        "replacement": "\"\""
      },
      {
        "line": 103,
        "col": 33,
        "mutantType": "StringLiteral",
        "original": "ignore']",
        "replacement": "\"\""
      },
      {
        "line": 110,
        "col": 10,
        "mutantType": "StringLiteral",
        "original": "# Mutant\nFile: ${mutant.file}\nLine: ${mutant.line}:${mutant.col}\nType: ${mutant.mutantType}\nOriginal code: \\`${mutant.original}\\`\nMutated to: \\`${mutant.replacement}\\`\n\n# Source context (±${CONTEXT_LINES} lines)\n${srcContext}\n\n# Existing tests\n${existingTests}\n\n# Recent activity\nFile last modified: ${recentActivity}\n`",
        "replacement": "``"
      }
    ],
    "exampleTest": null,
    "recommendationText": null
  },
  {
    "file": "npm/src/coverage-classify/verdict-schema.mjs",
    "mutants": [
      {
        "line": 14,
        "col": 39,
        "mutantType": "ObjectLiteral",
        "original": "\n  verdict: z.enum(['worth-testing', 'equivalent', 'defensive', 'glue', 'wrapper']),\n  confidence: z.number().min(0).max(1),\n  reason: z.string().min(20).max(500),\n  suggestedTest: z.string().max(300).optional()\n})",
        "replacement": "{}"
      },
      {
        "line": 15,
        "col": 37,
        "mutantType": "StringLiteral",
        "original": "equivalent',",
        "replacement": "\"\""
      },
      {
        "line": 15,
        "col": 51,
        "mutantType": "StringLiteral",
        "original": "defensive',",
        "replacement": "\"\""
      },
      {
        "line": 15,
        "col": 64,
        "mutantType": "StringLiteral",
        "original": "glue',",
        "replacement": "\"\""
      },
      {
        "line": 15,
        "col": 72,
        "mutantType": "StringLiteral",
        "original": "wrapper']",
        "replacement": "\"\""
      },
      {
        "line": 28,
        "col": 37,
        "mutantType": "StringLiteral",
        "original": "{')",
        "replacement": "\"\""
      },
      {
        "line": 29,
        "col": 39,
        "mutantType": "StringLiteral",
        "original": "}')",
        "replacement": "\"\""
      },
      {
        "line": 30,
        "col": 7,
        "mutantType": "ConditionalExpression",
        "original": "sonStart === -1 || jsonEnd === -1)",
        "replacement": "false"
      },
      {
        "line": 30,
        "col": 7,
        "mutantType": "LogicalOperator",
        "original": "sonStart === -1 || jsonEnd === -1)",
        "replacement": "jsonStart === -1 && jsonEnd === -1"
      },
      {
        "line": 30,
        "col": 7,
        "mutantType": "ConditionalExpression",
        "original": "sonStart === -1 ",
        "replacement": "false"
      },
      {
        "line": 30,
        "col": 21,
        "mutantType": "UnaryOperator",
        "original": "1 ",
        "replacement": "+1"
      },
      {
        "line": 30,
        "col": 27,
        "mutantType": "ConditionalExpression",
        "original": "sonEnd === -1)",
        "replacement": "false"
      },
      {
        "line": 30,
        "col": 39,
        "mutantType": "UnaryOperator",
        "original": "1)",
        "replacement": "+1"
      },
      {
        "line": 33,
        "col": 27,
        "mutantType": "MethodExpression",
        "original": "awText.slice(jsonStart, jsonEnd + 1))",
        "replacement": "rawText"
      }
    ],
    "exampleTest": null,
    "recommendationText": null
  },
  {
    "file": "npm/src/coverage-fix.mjs",
    "mutants": [
      {
        "line": 16,
        "col": 15,
        "mutantType": "LogicalOperator",
        "original": "nv.N_CURSOR_COVERAGE_FIX_MODEL ?? resolveModel('max')",
        "replacement": "env.N_CURSOR_COVERAGE_FIX_MODEL && resolveModel('max')"
      },
      {
        "line": 16,
        "col": 63,
        "mutantType": "StringLiteral",
        "original": "max')",
        "replacement": "\"\""
      },
      {
        "line": 31,
        "col": 40,
        "mutantType": "ArrowFunction",
        "original": "s, g) => s + g.mutants.length,",
        "replacement": "() => undefined"
      },
      {
        "line": 31,
        "col": 50,
        "mutantType": "ArithmeticOperator",
        "original": " + g.mutants.length,",
        "replacement": "s - g.mutants.length"
      },
      {
        "line": 38,
        "col": 15,
        "mutantType": "StringLiteral",
        "original": "\\n🤖 coverage --fix: запускаю агента для ${totalMutants} вцілілих мутантів...\\n`)",
        "replacement": "``"
      },
      {
        "line": 51,
        "col": 50,
        "mutantType": "ArrayDeclaration",
        "original": "]",
        "replacement": "[\"Stryker was here\"]"
      },
      {
        "line": 67,
        "col": 20,
        "mutantType": "ArrayDeclaration",
        "original": "]",
        "replacement": "[\"Stryker was here\"]"
      },
      {
        "line": 70,
        "col": 20,
        "mutantType": "ArrayDeclaration",
        "original": "]",
        "replacement": "[\"Stryker was here\"]"
      },
      {
        "line": 71,
        "col": 9,
        "mutantType": "BlockStatement",
        "original": "\n      const src = await readFile(join(projectRoot, file), 'utf8')\n      srcLines = src.split('\\n')\n    } ",
        "replacement": "{}"
      },
      {
        "line": 72,
        "col": 59,
        "mutantType": "StringLiteral",
        "original": "utf8')",
        "replacement": "\"\""
      },
      {
        "line": 73,
        "col": 28,
        "mutantType": "StringLiteral",
        "original": "\\n')",
        "replacement": "\"\""
      },
      {
        "line": 80,
        "col": 26,
        "mutantType": "MethodExpression",
        "original": "ath.max(0, m.line - 4)",
        "replacement": "Math.min(0, m.line - 4)"
      },
      {
        "line": 80,
        "col": 38,
        "mutantType": "ArithmeticOperator",
        "original": ".line - 4)",
        "replacement": "m.line + 4"
      },
      {
        "line": 81,
        "col": 24,
        "mutantType": "MethodExpression",
        "original": "ath.min(srcLines.length, m.line + 3)",
        "replacement": "Math.max(srcLines.length, m.line + 3)"
      },
      {
        "line": 81,
        "col": 50,
        "mutantType": "ArithmeticOperator",
        "original": ".line + 3)",
        "replacement": "m.line - 3"
      },
      {
        "line": 82,
        "col": 25,
        "mutantType": "MethodExpression",
        "original": "rcLines\n          .slice(ctxStart, ctxEnd)",
        "replacement": "srcLines"
      },
      {
        "line": 84,
        "col": 16,
        "mutantType": "ArrowFunction",
        "original": "l, i) => `${ctxStart + i + 1}: ${l}`)",
        "replacement": "() => undefined"
      },
      {
        "line": 84,
        "col": 26,
        "mutantType": "StringLiteral",
        "original": "${ctxStart + i + 1}: ${l}`)",
        "replacement": "``"
      },
      {
        "line": 84,
        "col": 29,
        "mutantType": "ArithmeticOperator",
        "original": "txStart + i + 1}",
        "replacement": "ctxStart + i - 1"
      },
      {
        "line": 84,
        "col": 29,
        "mutantType": "ArithmeticOperator",
        "original": "txStart + i ",
        "replacement": "ctxStart - i"
      },
      {
        "line": 85,
        "col": 17,
        "mutantType": "StringLiteral",
        "original": "\\n')",
        "replacement": "\"\""
      },
      {
        "line": 86,
        "col": 16,
        "mutantType": "MethodExpression",
        "original": "\n          `  - Рядок ${m.line}, колонка ${m.col}, тип мутації \\`${m.mutantType}\\``,\n          `    Оригінал: \\`${m.original}\\``,\n          `    Вижив варіант: \\`${m.replacement}\\``,\n          context ? `    Контекст:\\n\\`\\`\\`\\n${context}\\n\\`\\`\\`` : ''\n        ]\n          .filter(Boolean)",
        "replacement": "[`  - Рядок ${m.line}, колонка ${m.col}, тип мутації \\`${m.mutantType}\\``, `    Оригінал: \\`${m.original}\\``, `    Вижив варіант: \\`${m.replacement}\\``, context ? `    Контекст:\\n\\`\\`\\`\\n${context}\\n\\`\\`\\`` : '']"
      },
      {
        "line": 90,
        "col": 21,
        "mutantType": "StringLiteral",
        "original": "    Контекст:\\n\\`\\`\\`\\n${context}\\n\\`\\`\\`` ",
        "replacement": "``"
      },
      {
        "line": 90,
        "col": 67,
        "mutantType": "StringLiteral",
        "original": "'",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 93,
        "col": 17,
        "mutantType": "StringLiteral",
        "original": "\\n')",
        "replacement": "\"\""
      },
      {
        "line": 95,
        "col": 13,
        "mutantType": "StringLiteral",
        "original": "\\n')",
        "replacement": "\"\""
      },
      {
        "line": 99,
        "col": 9,
        "mutantType": "StringLiteral",
        "original": "'",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 105,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "Твоє завдання — написати unit-тести, що вбивають наступні вцілілі мутанти Stryker.',",
        "replacement": "\"\""
      },
      {
        "line": 106,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "Для кожного мутанта: знайди або створи відповідний test-файл, додай тест-кейс,',",
        "replacement": "\"\""
      },
      {
        "line": 107,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "що явно перевіряє цю гілку/умову і провалиться якщо код замінити на \"вцілілий варіант\".',",
        "replacement": "\"\""
      },
      {
        "line": 108,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "',",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 109,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "## Вцілілі мутанти',",
        "replacement": "\"\""
      },
      {
        "line": 110,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "',",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 112,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "',",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 113,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "## Правила',",
        "replacement": "\"\""
      },
      {
        "line": 114,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "- Не змінюй source-файли — лише test-файли.',",
        "replacement": "\"\""
      },
      {
        "line": 115,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "- Використовуй той самий test-фреймворк, що вже в проєкті.',",
        "replacement": "\"\""
      },
      {
        "line": 116,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "- Запусти `bun test` (або відповідну команду) після кожного файлу — переконайся, що 0 fail.',",
        "replacement": "\"\""
      },
      {
        "line": 117,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "- Якщо мутант охоплений іншим новим тестом — не дублюй.'",
        "replacement": "\"\""
      },
      {
        "line": 118,
        "col": 10,
        "mutantType": "StringLiteral",
        "original": "\\n')",
        "replacement": "\"\""
      }
    ],
    "exampleTest": {
      "testFile": "npm/src/coverage-fix.test.mjs",
      "code": "    it('logs and returns early when survived is empty', async () => {\n      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})\n      await fixSurvivedMutants([], ROOT)\n      expect(logSpy).toHaveBeenCalledWith('✓ Всі мутанти вбиті — доповнення тестів не потрібне')\n      expect(vi.mocked(spawnSync)).not.toHaveBeenCalled()\n      logSpy.mockRestore()\n    })"
    },
    "recommendationText": null
  },
  {
    "file": "npm/src/coverage-per-file.mjs",
    "mutants": [
      {
        "line": 13,
        "col": 22,
        "mutantType": "Regex",
        "original": "\\.(test|spec)\\.[^.]+$|[/\\\\]tests?[/\\\\]/",
        "replacement": "/\\.(test|spec)\\.[^.]+|[/\\\\]tests?[/\\\\]/"
      },
      {
        "line": 13,
        "col": 22,
        "mutantType": "Regex",
        "original": "\\.(test|spec)\\.[^.]+$|[/\\\\]tests?[/\\\\]/",
        "replacement": "/\\.(test|spec)\\.[^.]$|[/\\\\]tests?[/\\\\]/"
      },
      {
        "line": 13,
        "col": 22,
        "mutantType": "Regex",
        "original": "\\.(test|spec)\\.[^.]+$|[/\\\\]tests?[/\\\\]/",
        "replacement": "/\\.(test|spec)\\.[.]+$|[/\\\\]tests?[/\\\\]/"
      },
      {
        "line": 13,
        "col": 22,
        "mutantType": "Regex",
        "original": "\\.(test|spec)\\.[^.]+$|[/\\\\]tests?[/\\\\]/",
        "replacement": "/\\.(test|spec)\\.[^.]+$|[^/\\\\]tests?[/\\\\]/"
      },
      {
        "line": 13,
        "col": 22,
        "mutantType": "Regex",
        "original": "\\.(test|spec)\\.[^.]+$|[/\\\\]tests?[/\\\\]/",
        "replacement": "/\\.(test|spec)\\.[^.]+$|[/\\\\]tests[/\\\\]/"
      },
      {
        "line": 13,
        "col": 22,
        "mutantType": "Regex",
        "original": "\\.(test|spec)\\.[^.]+$|[/\\\\]tests?[/\\\\]/",
        "replacement": "/\\.(test|spec)\\.[^.]+$|[/\\\\]tests?[^/\\\\]/"
      },
      {
        "line": 26,
        "col": 21,
        "mutantType": "MethodExpression",
        "original": "ine.slice(3).trim()",
        "replacement": "line.slice(3)"
      },
      {
        "line": 26,
        "col": 21,
        "mutantType": "MethodExpression",
        "original": "ine.slice(3).",
        "replacement": "line"
      },
      {
        "line": 33,
        "col": 16,
        "mutantType": "LogicalOperator",
        "original": "ine === 'end_of_record' && currentFile)",
        "replacement": "line === 'end_of_record' || currentFile"
      },
      {
        "line": 33,
        "col": 16,
        "mutantType": "ConditionalExpression",
        "original": "ine === 'end_of_record' ",
        "replacement": "true"
      },
      {
        "line": 33,
        "col": 16,
        "mutantType": "EqualityOperator",
        "original": "ine === 'end_of_record' ",
        "replacement": "line !== 'end_of_record'"
      },
      {
        "line": 36,
        "col": 14,
        "mutantType": "ConditionalExpression",
        "original": "f === 0 ",
        "replacement": "false"
      },
      {
        "line": 52,
        "col": 48,
        "mutantType": "StringLiteral",
        "original": "7n-cov-')",
        "replacement": "\"\""
      },
      {
        "line": 59,
        "col": 9,
        "mutantType": "StringLiteral",
        "original": "--passWithNoTests',",
        "replacement": "\"\""
      },
      {
        "line": 62,
        "col": 9,
        "mutantType": "StringLiteral",
        "original": "--coverage.reportsDirectory=${lcovDir}`",
        "replacement": "``"
      },
      {
        "line": 64,
        "col": 26,
        "mutantType": "StringLiteral",
        "original": "inherit',",
        "replacement": "\"\""
      },
      {
        "line": 66,
        "col": 36,
        "mutantType": "StringLiteral",
        "original": "lcov.info')",
        "replacement": "\"\""
      },
      {
        "line": 68,
        "col": 62,
        "mutantType": "StringLiteral",
        "original": "utf8')",
        "replacement": "\"\""
      },
      {
        "line": 69,
        "col": 12,
        "mutantType": "MethodExpression",
        "original": "llFiles\n      .map(f => ({ ...f, file: relative(dir, f.file) }))\n      .filter(f => !f.file.startsWith('..') && !TEST_FILE_RE.test(f.file))",
        "replacement": "allFiles.map(f => ({\n  ...f,\n  file: relative(dir, f.file)\n}))"
      },
      {
        "line": 71,
        "col": 20,
        "mutantType": "ConditionalExpression",
        "original": "f.file.startsWith('..') && !TEST_FILE_RE.test(f.file))",
        "replacement": "true"
      },
      {
        "line": 71,
        "col": 20,
        "mutantType": "LogicalOperator",
        "original": "f.file.startsWith('..') && !TEST_FILE_RE.test(f.file))",
        "replacement": "!f.file.startsWith('..') || !TEST_FILE_RE.test(f.file)"
      },
      {
        "line": 71,
        "col": 21,
        "mutantType": "MethodExpression",
        "original": ".file.startsWith('..') ",
        "replacement": "f.file.endsWith('..')"
      },
      {
        "line": 72,
        "col": 13,
        "mutantType": "BlockStatement",
        "original": "\n    await rm(lcovDir, { recursive: true, force: true }).catch(() => {})\n  }",
        "replacement": "{}"
      },
      {
        "line": 73,
        "col": 23,
        "mutantType": "ObjectLiteral",
        "original": " recursive: true, force: true })",
        "replacement": "{}"
      },
      {
        "line": 73,
        "col": 36,
        "mutantType": "BooleanLiteral",
        "original": "rue,",
        "replacement": "false"
      },
      {
        "line": 73,
        "col": 49,
        "mutantType": "BooleanLiteral",
        "original": "rue ",
        "replacement": "false"
      }
    ],
    "exampleTest": {
      "testFile": "npm/src/coverage-per-file.test.mjs",
      "code": "    it('returns per-file data from lcov.info', async () => {\n      vi.mocked(mkdtemp).mockResolvedValue('/tmp/7n-cov-xxx')\n      vi.mocked(existsSync).mockReturnValue(true)\n      vi.mocked(readFileSync).mockReturnValue(SAMPLE_LCOV)\n      vi.mocked(rm).mockResolvedValue(undefined)\n\n      const result = await measureCoveragePerFile('/proj')\n\n      expect(vi.mocked(spawnSync)).toHaveBeenCalledWith(\n        'bunx',\n        expect.arrayContaining(['vitest', 'run', '--coverage', '--coverage.reporter=lcov']),\n        expect.objectContaining({ cwd: '/proj' })\n      )\n      expect(result).toHaveLength(2)\n      expect(result[0].pct).toBe(80)\n      expect(result[1].pct).toBe(0)\n    })"
    },
    "recommendationText": null
  },
  {
    "file": "npm/src/gen-tests.mjs",
    "mutants": [
      {
        "line": 16,
        "col": 29,
        "mutantType": "Regex",
        "original": "\\.[^.]+$/,",
        "replacement": "/\\.[^.]+/"
      },
      {
        "line": 16,
        "col": 29,
        "mutantType": "Regex",
        "original": "\\.[^.]+$/,",
        "replacement": "/\\.[^.]$/"
      },
      {
        "line": 16,
        "col": 29,
        "mutantType": "Regex",
        "original": "\\.[^.]+$/,",
        "replacement": "/\\.[.]+$/"
      },
      {
        "line": 16,
        "col": 41,
        "mutantType": "StringLiteral",
        "original": "')",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 17,
        "col": 38,
        "mutantType": "StringLiteral",
        "original": "/')",
        "replacement": "\"\""
      },
      {
        "line": 18,
        "col": 16,
        "mutantType": "ConditionalExpression",
        "original": "astSlash === -1 ",
        "replacement": "true"
      },
      {
        "line": 18,
        "col": 16,
        "mutantType": "ConditionalExpression",
        "original": "astSlash === -1 ",
        "replacement": "false"
      },
      {
        "line": 18,
        "col": 16,
        "mutantType": "EqualityOperator",
        "original": "astSlash === -1 ",
        "replacement": "lastSlash !== -1"
      },
      {
        "line": 18,
        "col": 30,
        "mutantType": "UnaryOperator",
        "original": "1 ",
        "replacement": "+1"
      },
      {
        "line": 18,
        "col": 42,
        "mutantType": "MethodExpression",
        "original": "ase.slice(lastSlash + 1)",
        "replacement": "base"
      },
      {
        "line": 18,
        "col": 53,
        "mutantType": "ArithmeticOperator",
        "original": "astSlash + 1)",
        "replacement": "lastSlash - 1"
      },
      {
        "line": 19,
        "col": 15,
        "mutantType": "ConditionalExpression",
        "original": "astSlash === -1 ",
        "replacement": "true"
      },
      {
        "line": 19,
        "col": 15,
        "mutantType": "ConditionalExpression",
        "original": "astSlash === -1 ",
        "replacement": "false"
      },
      {
        "line": 19,
        "col": 15,
        "mutantType": "EqualityOperator",
        "original": "astSlash === -1 ",
        "replacement": "lastSlash !== -1"
      },
      {
        "line": 19,
        "col": 29,
        "mutantType": "UnaryOperator",
        "original": "1 ",
        "replacement": "+1"
      },
      {
        "line": 19,
        "col": 39,
        "mutantType": "MethodExpression",
        "original": "ase.slice(0, lastSlash)",
        "replacement": "base"
      },
      {
        "line": 21,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "${base}.test.mjs`,",
        "replacement": "``"
      },
      {
        "line": 22,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "${base}.test.js`,",
        "replacement": "``"
      },
      {
        "line": 23,
        "col": 16,
        "mutantType": "StringLiteral",
        "original": "${dir}/tests/${name}.test.mjs`]",
        "replacement": "``"
      },
      {
        "line": 48,
        "col": 39,
        "mutantType": "StringLiteral",
        "original": "utf8')",
        "replacement": "\"\""
      },
      {
        "line": 49,
        "col": 11,
        "mutantType": "ConditionalExpression",
        "original": "ontent.length > MAX_SRC_BYTES)",
        "replacement": "true"
      },
      {
        "line": 49,
        "col": 11,
        "mutantType": "EqualityOperator",
        "original": "ontent.length > MAX_SRC_BYTES)",
        "replacement": "content.length >= MAX_SRC_BYTES"
      },
      {
        "line": 49,
        "col": 53,
        "mutantType": "MethodExpression",
        "original": "ontent.slice(0, MAX_SRC_BYTES) ",
        "replacement": "content"
      },
      {
        "line": 53,
        "col": 44,
        "mutantType": "StringLiteral",
        "original": "')",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 56,
        "col": 11,
        "mutantType": "StringLiteral",
        "original": "\\n\\n')",
        "replacement": "\"\""
      },
      {
        "line": 69,
        "col": 25,
        "mutantType": "StringLiteral",
        "original": "'",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 71,
        "col": 58,
        "mutantType": "StringLiteral",
        "original": "utf8')",
        "replacement": "\"\""
      },
      {
        "line": 77,
        "col": 37,
        "mutantType": "StringLiteral",
        "original": "',",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 132,
        "col": 7,
        "mutantType": "ConditionalExpression",
        "original": "iles.length === 0)",
        "replacement": "false"
      },
      {
        "line": 134,
        "col": 22,
        "mutantType": "LogicalOperator",
        "original": "pts.callText ?? callText",
        "replacement": "opts.callText && callText"
      },
      {
        "line": 137,
        "col": 15,
        "mutantType": "StringLiteral",
        "original": "\\n🤖 Генерую тести для ${files.length} файлів (pi SDK, по одному)...\\n`)",
        "replacement": "``"
      },
      {
        "line": 140,
        "col": 17,
        "mutantType": "StringLiteral",
        "original": "  → ${fileInfo.file} (${fileInfo.pct.toFixed(1)}%)`)",
        "replacement": "``"
      }
    ],
    "exampleTest": {
      "testFile": "npm/src/gen-tests.test.mjs",
      "code": "  it('should build a summary prompt correctly for multiple files', () => {\n    const prompt = buildGenTestsPrompt(mockFiles, mockDir)\n    expect(prompt).toContain(\"### `src/a.js` (покриття: 50.0%)\")\n    expect(prompt).toContain(\"Причина: Low coverage\")\n    expect(prompt).toContain(\"### `src/b.js` (покриття: 10.0%)\")\n    expect(prompt).toContain(\"### `other/c.ts` (покриття: 80.0%)\")\n  })"
    },
    "recommendationText": null
  },
  {
    "file": "npm/src/lib/llm.mjs",
    "mutants": [
      {
        "line": 42,
        "col": 31,
        "mutantType": "ArrowFunction",
        "original": " => m.content)",
        "replacement": "() => undefined"
      },
      {
        "line": 42,
        "col": 52,
        "mutantType": "StringLiteral",
        "original": "\\n\\n')",
        "replacement": "\"\""
      },
      {
        "line": 43,
        "col": 29,
        "mutantType": "ArrayDeclaration",
        "original": "'--model', model] ",
        "replacement": "[]"
      },
      {
        "line": 43,
        "col": 30,
        "mutantType": "StringLiteral",
        "original": "--model',",
        "replacement": "\"\""
      },
      {
        "line": 44,
        "col": 23,
        "mutantType": "StringLiteral",
        "original": "pi',",
        "replacement": "\"\""
      },
      {
        "line": 44,
        "col": 29,
        "mutantType": "ArrayDeclaration",
        "original": "'-p', prompt, ...modelArgs, '--no-session', '--mode', 'text', '--no-tools'],",
        "replacement": "[]"
      },
      {
        "line": 44,
        "col": 30,
        "mutantType": "StringLiteral",
        "original": "-p',",
        "replacement": "\"\""
      },
      {
        "line": 44,
        "col": 58,
        "mutantType": "StringLiteral",
        "original": "--no-session',",
        "replacement": "\"\""
      },
      {
        "line": 44,
        "col": 74,
        "mutantType": "StringLiteral",
        "original": "--mode',",
        "replacement": "\"\""
      },
      {
        "line": 44,
        "col": 84,
        "mutantType": "StringLiteral",
        "original": "text',",
        "replacement": "\"\""
      },
      {
        "line": 44,
        "col": 92,
        "mutantType": "StringLiteral",
        "original": "--no-tools']",
        "replacement": "\"\""
      },
      {
        "line": 44,
        "col": 107,
        "mutantType": "ObjectLiteral",
        "original": "\n    encoding: 'utf8',\n    timeout: timeoutMs\n  })",
        "replacement": "{}"
      },
      {
        "line": 45,
        "col": 15,
        "mutantType": "StringLiteral",
        "original": "utf8',",
        "replacement": "\"\""
      },
      {
        "line": 49,
        "col": 63,
        "mutantType": "LogicalOperator",
        "original": ".stderr?.slice(0, 300) ?? ''}",
        "replacement": "r.stderr?.slice(0, 300) && ''"
      },
      {
        "line": 49,
        "col": 63,
        "mutantType": "MethodExpression",
        "original": ".stderr?.slice(0, 300) ",
        "replacement": "r.stderr"
      },
      {
        "line": 49,
        "col": 63,
        "mutantType": "OptionalChaining",
        "original": ".stderr?.slice(",
        "replacement": "r.stderr.slice"
      },
      {
        "line": 50,
        "col": 10,
        "mutantType": "MethodExpression",
        "original": ".stdout?.trim() ",
        "replacement": "r.stdout"
      },
      {
        "line": 50,
        "col": 10,
        "mutantType": "OptionalChaining",
        "original": ".stdout?.trim(",
        "replacement": "r.stdout.trim"
      },
      {
        "line": 64,
        "col": 26,
        "mutantType": "LogicalOperator",
        "original": "aller ?? env.N_CURSOR_TRACE_CALLER ?? 'unknown'",
        "replacement": "(caller ?? env.N_CURSOR_TRACE_CALLER) && 'unknown'"
      },
      {
        "line": 64,
        "col": 26,
        "mutantType": "LogicalOperator",
        "original": "aller ?? env.N_CURSOR_TRACE_CALLER ",
        "replacement": "caller && env.N_CURSOR_TRACE_CALLER"
      },
      {
        "line": 64,
        "col": 65,
        "mutantType": "StringLiteral",
        "original": "unknown'",
        "replacement": "\"\""
      },
      {
        "line": 86,
        "col": 24,
        "mutantType": "ObjectLiteral",
        "original": "\n        ts: new Date().toISOString(),\n        caller: resolvedCaller,\n        backend,\n        model,\n        temperature,\n        maxTokens,\n        messages,\n        content,\n        reasoning,\n        reasoningSource,\n        finishReason,\n        usage,\n        ms: Date.now() - t0,\n        attempts,\n        ok: true,\n        error: null\n      })",
        "replacement": "{}"
      },
      {
        "line": 99,
        "col": 13,
        "mutantType": "ArithmeticOperator",
        "original": "ate.now() - t0,",
        "replacement": "Date.now() + t0"
      },
      {
        "line": 101,
        "col": 13,
        "mutantType": "BooleanLiteral",
        "original": "rue,",
        "replacement": "false"
      },
      {
        "line": 108,
        "col": 24,
        "mutantType": "ObjectLiteral",
        "original": "\n        ts: new Date().toISOString(),\n        caller: resolvedCaller,\n        backend,\n        model,\n        temperature,\n        maxTokens,\n        messages,\n        ms: Date.now() - t0,\n        attempts: null,\n        ok: false,\n        error: String(error.message).slice(0, 200)\n      })",
        "replacement": "{}"
      },
      {
        "line": 116,
        "col": 13,
        "mutantType": "ArithmeticOperator",
        "original": "ate.now() - t0,",
        "replacement": "Date.now() + t0"
      },
      {
        "line": 118,
        "col": 13,
        "mutantType": "BooleanLiteral",
        "original": "alse,",
        "replacement": "true"
      },
      {
        "line": 119,
        "col": 16,
        "mutantType": "MethodExpression",
        "original": "tring(error.message).slice(0, 200)",
        "replacement": "String(error.message)"
      },
      {
        "line": 139,
        "col": 29,
        "mutantType": "StringLiteral",
        "original": "memory ceiling'",
        "replacement": "\"\""
      },
      {
        "line": 141,
        "col": 27,
        "mutantType": "StringLiteral",
        "original": "authentication_error'",
        "replacement": "\"\""
      },
      {
        "line": 143,
        "col": 22,
        "mutantType": "Regex",
        "original": "too long|exceeds[^.]*context|not found/i",
        "replacement": "/too long|exceeds[^.]context|not found/i"
      },
      {
        "line": 143,
        "col": 22,
        "mutantType": "Regex",
        "original": "too long|exceeds[^.]*context|not found/i",
        "replacement": "/too long|exceeds[.]*context|not found/i"
      }
    ],
    "exampleTest": {
      "testFile": "npm/src/lib/llm.test.mjs",
      "code": "  it('should return \"omlx\" if the model ID starts with \"omlx/\"', () => {\n    vi.mocked(isOmlxModel).mockReturnValue(true)\n    expect(pickBackend('omlx/some-model')).toBe('omlx')\n  })"
    },
    "recommendationText": null
  },
  {
    "file": "npm/src/lib/models.mjs",
    "mutants": [
      {
        "line": 42,
        "col": 26,
        "mutantType": "LogicalOperator",
        "original": "nv.N_LOCAL_MIN_MODEL ?? ''",
        "replacement": "env.N_LOCAL_MIN_MODEL && ''"
      },
      {
        "line": 45,
        "col": 26,
        "mutantType": "LogicalOperator",
        "original": "nv.N_LOCAL_AVG_MODEL ?? ''",
        "replacement": "env.N_LOCAL_AVG_MODEL && ''"
      },
      {
        "line": 45,
        "col": 51,
        "mutantType": "StringLiteral",
        "original": "'",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 48,
        "col": 26,
        "mutantType": "LogicalOperator",
        "original": "nv.N_LOCAL_MAX_MODEL ?? ''",
        "replacement": "env.N_LOCAL_MAX_MODEL && ''"
      },
      {
        "line": 48,
        "col": 51,
        "mutantType": "StringLiteral",
        "original": "'",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 53,
        "col": 26,
        "mutantType": "LogicalOperator",
        "original": "nv.N_CLOUD_MIN_MODEL ?? ''",
        "replacement": "env.N_CLOUD_MIN_MODEL && ''"
      },
      {
        "line": 53,
        "col": 51,
        "mutantType": "StringLiteral",
        "original": "'",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 56,
        "col": 26,
        "mutantType": "LogicalOperator",
        "original": "nv.N_CLOUD_AVG_MODEL ?? ''",
        "replacement": "env.N_CLOUD_AVG_MODEL && ''"
      },
      {
        "line": 56,
        "col": 51,
        "mutantType": "StringLiteral",
        "original": "'",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 59,
        "col": 26,
        "mutantType": "LogicalOperator",
        "original": "nv.N_CLOUD_MAX_MODEL ?? ''",
        "replacement": "env.N_CLOUD_MAX_MODEL && ''"
      },
      {
        "line": 59,
        "col": 51,
        "mutantType": "StringLiteral",
        "original": "'",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 70,
        "col": 36,
        "mutantType": "BlockStatement",
        "original": "\n  if (tier === 'min') return LOCAL_MIN || LOCAL_AVG || LOCAL_MAX || CLOUD_MIN\n  if (tier === 'avg') return LOCAL_AVG || LOCAL_MAX || CLOUD_AVG\n  if (tier === 'max') return LOCAL_MAX || CLOUD_MAX\n  throw new TypeError(`resolveModel: unknown tier \"${tier}\". Use 'min', 'avg', or 'max'.`)\n}",
        "replacement": "{}"
      },
      {
        "line": 71,
        "col": 7,
        "mutantType": "ConditionalExpression",
        "original": "ier === 'min')",
        "replacement": "true"
      },
      {
        "line": 71,
        "col": 7,
        "mutantType": "ConditionalExpression",
        "original": "ier === 'min')",
        "replacement": "false"
      },
      {
        "line": 71,
        "col": 7,
        "mutantType": "EqualityOperator",
        "original": "ier === 'min')",
        "replacement": "tier !== 'min'"
      },
      {
        "line": 71,
        "col": 16,
        "mutantType": "StringLiteral",
        "original": "min')",
        "replacement": "\"\""
      },
      {
        "line": 72,
        "col": 7,
        "mutantType": "ConditionalExpression",
        "original": "ier === 'avg')",
        "replacement": "true"
      },
      {
        "line": 72,
        "col": 7,
        "mutantType": "ConditionalExpression",
        "original": "ier === 'avg')",
        "replacement": "false"
      },
      {
        "line": 72,
        "col": 7,
        "mutantType": "EqualityOperator",
        "original": "ier === 'avg')",
        "replacement": "tier !== 'avg'"
      },
      {
        "line": 72,
        "col": 16,
        "mutantType": "StringLiteral",
        "original": "avg')",
        "replacement": "\"\""
      },
      {
        "line": 73,
        "col": 7,
        "mutantType": "ConditionalExpression",
        "original": "ier === 'max')",
        "replacement": "true"
      },
      {
        "line": 73,
        "col": 7,
        "mutantType": "ConditionalExpression",
        "original": "ier === 'max')",
        "replacement": "false"
      },
      {
        "line": 73,
        "col": 7,
        "mutantType": "EqualityOperator",
        "original": "ier === 'max')",
        "replacement": "tier !== 'max'"
      },
      {
        "line": 73,
        "col": 16,
        "mutantType": "StringLiteral",
        "original": "max')",
        "replacement": "\"\""
      },
      {
        "line": 73,
        "col": 30,
        "mutantType": "ConditionalExpression",
        "original": "OCAL_MAX || CLOUD_MAX",
        "replacement": "true"
      },
      {
        "line": 73,
        "col": 30,
        "mutantType": "ConditionalExpression",
        "original": "OCAL_MAX || CLOUD_MAX",
        "replacement": "false"
      },
      {
        "line": 73,
        "col": 30,
        "mutantType": "LogicalOperator",
        "original": "OCAL_MAX || CLOUD_MAX",
        "replacement": "LOCAL_MAX && CLOUD_MAX"
      }
    ],
    "exampleTest": null,
    "recommendationText": null
  },
  {
    "file": "npm/src/lib/omlx-trace.mjs",
    "mutants": [
      {
        "line": 25,
        "col": 29,
        "mutantType": "ArithmeticOperator",
        "original": "0 * 1024 * 1024",
        "replacement": "50 * 1024 / 1024"
      },
      {
        "line": 25,
        "col": 29,
        "mutantType": "ArithmeticOperator",
        "original": "0 * 1024 ",
        "replacement": "50 / 1024"
      },
      {
        "line": 28,
        "col": 29,
        "mutantType": "ArrayDeclaration",
        "original": "'0', 'false', 'off', 'no'])",
        "replacement": "[]"
      },
      {
        "line": 28,
        "col": 30,
        "mutantType": "StringLiteral",
        "original": "0',",
        "replacement": "\"\""
      },
      {
        "line": 28,
        "col": 35,
        "mutantType": "StringLiteral",
        "original": "false',",
        "replacement": "\"\""
      },
      {
        "line": 28,
        "col": 44,
        "mutantType": "StringLiteral",
        "original": "off',",
        "replacement": "\"\""
      },
      {
        "line": 28,
        "col": 51,
        "mutantType": "StringLiteral",
        "original": "no']",
        "replacement": "\"\""
      },
      {
        "line": 38,
        "col": 7,
        "mutantType": "ConditionalExpression",
        "original": "verride !== undefined)",
        "replacement": "true"
      },
      {
        "line": 40,
        "col": 9,
        "mutantType": "ConditionalExpression",
        "original": "verride)",
        "replacement": "true"
      },
      {
        "line": 55,
        "col": 21,
        "mutantType": "OptionalChaining",
        "original": "?.content ",
        "replacement": "m.content"
      },
      {
        "line": 56,
        "col": 9,
        "mutantType": "EqualityOperator",
        "original": "ontent.length > MAX_MSG_CHARS)",
        "replacement": "content.length >= MAX_MSG_CHARS"
      },
      {
        "line": 60,
        "col": 20,
        "mutantType": "OptionalChaining",
        "original": "?.role,",
        "replacement": "m.role"
      },
      {
        "line": 62,
        "col": 38,
        "mutantType": "StringLiteral",
        "original": "sha256')",
        "replacement": "\"\""
      },
      {
        "line": 62,
        "col": 83,
        "mutantType": "StringLiteral",
        "original": "hex')",
        "replacement": "\"\""
      },
      {
        "line": 102,
        "col": 23,
        "mutantType": "LogicalOperator",
        "original": ".reasoningSource ?? null,",
        "replacement": "i.reasoningSource && null"
      },
      {
        "line": 103,
        "col": 20,
        "mutantType": "LogicalOperator",
        "original": ".finishReason ?? null,",
        "replacement": "i.finishReason && null"
      },
      {
        "line": 104,
        "col": 12,
        "mutantType": "LogicalOperator",
        "original": ".usage ?? null,",
        "replacement": "i.usage && null"
      }
    ],
    "exampleTest": {
      "testFile": "npm/src/lib/omlx-trace.test.mjs",
      "code": "    it('should return null when N_CURSOR_LLM_TRACE is set to a kill value', () => {\n      process.env.N_CURSOR_LLM_TRACE = 'off'\n      expect(tracePath()).toBeNull()\n    })"
    },
    "recommendationText": null
  },
  {
    "file": "npm/src/lib/omlx.mjs",
    "mutants": [
      {
        "line": 26,
        "col": 33,
        "mutantType": "StringLiteral",
        "original": "http://127.0.0.1:8000/v1/chat/completions'",
        "replacement": "\"\""
      },
      {
        "line": 41,
        "col": 62,
        "mutantType": "StringLiteral",
        "original": ".omlx',",
        "replacement": "\"\""
      },
      {
        "line": 41,
        "col": 71,
        "mutantType": "StringLiteral",
        "original": "settings.json')",
        "replacement": "\"\""
      },
      {
        "line": 41,
        "col": 89,
        "mutantType": "StringLiteral",
        "original": "utf8')",
        "replacement": "\"\""
      },
      {
        "line": 42,
        "col": 12,
        "mutantType": "OptionalChaining",
        "original": "ettings?.auth?.api_key ",
        "replacement": "settings?.auth.api_key"
      },
      {
        "line": 42,
        "col": 12,
        "mutantType": "OptionalChaining",
        "original": "ettings?.auth?",
        "replacement": "settings.auth"
      },
      {
        "line": 48,
        "col": 21,
        "mutantType": "StringLiteral",
        "original": "omlx/'",
        "replacement": "\"\""
      },
      {
        "line": 51,
        "col": 20,
        "mutantType": "ArrayDeclaration",
        "original": "2000, 8000]",
        "replacement": "[]"
      },
      {
        "line": 81,
        "col": 22,
        "mutantType": "Regex",
        "original": "<think>([\\s\\S]*?)<\\/think>/",
        "replacement": "/<think>([\\s\\S])<\\/think>/"
      },
      {
        "line": 81,
        "col": 22,
        "mutantType": "Regex",
        "original": "<think>([\\s\\S]*?)<\\/think>/",
        "replacement": "/<think>([^\\s\\S]*?)<\\/think>/"
      },
      {
        "line": 81,
        "col": 22,
        "mutantType": "Regex",
        "original": "<think>([\\s\\S]*?)<\\/think>/",
        "replacement": "/<think>([\\S\\S]*?)<\\/think>/"
      },
      {
        "line": 81,
        "col": 22,
        "mutantType": "Regex",
        "original": "<think>([\\s\\S]*?)<\\/think>/",
        "replacement": "/<think>([\\s\\s]*?)<\\/think>/"
      },
      {
        "line": 95,
        "col": 17,
        "mutantType": "OptionalChaining",
        "original": "essage?.reasoning_content",
        "replacement": "message.reasoning_content"
      },
      {
        "line": 96,
        "col": 16,
        "mutantType": "MethodExpression",
        "original": "ield.trim())",
        "replacement": "field"
      },
      {
        "line": 97,
        "col": 19,
        "mutantType": "OptionalChaining",
        "original": "essage?.content ",
        "replacement": "message.content"
      },
      {
        "line": 99,
        "col": 30,
        "mutantType": "MethodExpression",
        "original": "[1].trim(),",
        "replacement": "m[1]"
      },
      {
        "line": 100,
        "col": 36,
        "mutantType": "MethodExpression",
        "original": "ontent.trim())",
        "replacement": "content"
      }
    ],
    "exampleTest": {
      "testFile": "npm/src/lib/omlx.test.mjs",
      "code": "    it(\"should return the explicit apiKey if provided\", () => {\n      expect(resolveOmlxApiKey(\"explicit_key\")).toBe(\"explicit_key\")\n    })"
    },
    "recommendationText": null
  },
  {
    "file": "npm/src/lib/pi-client.mjs",
    "mutants": [
      {
        "line": 36,
        "col": 10,
        "mutantType": "MethodExpression",
        "original": "ast.content\n    .filter(c => c.type === 'text')",
        "replacement": "last.content"
      },
      {
        "line": 37,
        "col": 18,
        "mutantType": "ConditionalExpression",
        "original": ".type === 'text')",
        "replacement": "true"
      }
    ],
    "exampleTest": {
      "testFile": "npm/src/lib/pi-client.test.mjs",
      "code": "    it('should call createAgentSession with correct parameters and return assistant content on success', async () => {\n      const mockSession = {\n        prompt: vi.fn().mockResolvedValue(undefined),\n        state: {\n          messages: [{\n            role: 'user',\n            content: [{ type: 'text', text: 'Hello' }],\n          }, {\n            role: 'assistant',\n            content: [{ type: 'text', text: 'World' }],\n          }],\n          stopReason: null,\n        },\n      }\n      mockCreateAgentSession.mockResolvedValue({ session: mockSession })\n\n      const prompt = 'What is the time?'\n      const result = await callText(prompt)\n\n      expect(mockCreateAgentSession).toHaveBeenCalledWith({\n        tools: [],\n        sessionManager: expect.any(Object), // Checks SessionManager.inMemory call internally\n        cwd: expect.any(String), // Checks process.cwd() behavior when opts.cwd is missing\n      })\n      expect(mockSession.prompt).toHaveBeenCalledWith(prompt)\n      expect(result).toBe('World')\n    })"
    },
    "recommendationText": null
  },
  {
    "file": "npm/src/run.mjs",
    "mutants": [
      {
        "line": 28,
        "col": 15,
        "mutantType": "StringLiteral",
        "original": "\\n📁 ${dir}\\n`)",
        "replacement": "``"
      },
      {
        "line": 32,
        "col": 19,
        "mutantType": "EqualityOperator",
        "original": " <= MAX_ITERATIONS;",
        "replacement": "i < MAX_ITERATIONS"
      },
      {
        "line": 32,
        "col": 40,
        "mutantType": "UpdateOperator",
        "original": "++)",
        "replacement": "i--"
      },
      {
        "line": 33,
        "col": 17,
        "mutantType": "StringLiteral",
        "original": "\\n── Ітерація ${i}/${MAX_ITERATIONS}: coverage ──\\n`)",
        "replacement": "``"
      },
      {
        "line": 37,
        "col": 19,
        "mutantType": "StringLiteral",
        "original": "⚠ Vitest coverage не повернула даних — перевір налаштування vitest.')",
        "replacement": "\"\""
      },
      {
        "line": 42,
        "col": 21,
        "mutantType": "ArithmeticOperator",
        "original": "llFiles.length - uncovered.length",
        "replacement": "allFiles.length + uncovered.length"
      },
      {
        "line": 43,
        "col": 18,
        "mutantType": "ArithmeticOperator",
        "original": "covered / allFiles.length) * 100)",
        "replacement": "covered / allFiles.length / 100"
      },
      {
        "line": 43,
        "col": 19,
        "mutantType": "ArithmeticOperator",
        "original": "overed / allFiles.length)",
        "replacement": "covered * allFiles.length"
      },
      {
        "line": 45,
        "col": 17,
        "mutantType": "StringLiteral",
        "original": "\\n✓ Покриття: ${pct}% файлів (${covered}/${allFiles.length})`)",
        "replacement": "``"
      },
      {
        "line": 48,
        "col": 19,
        "mutantType": "StringLiteral",
        "original": "✓ Всі файли мають достатнє покриття — переходжу до мутантів.')",
        "replacement": "\"\""
      },
      {
        "line": 53,
        "col": 19,
        "mutantType": "StringLiteral",
        "original": "⚠ Покриття не покращилось після генерації тестів — зупиняю цикл.')",
        "replacement": "\"\""
      },
      {
        "line": 58,
        "col": 17,
        "mutantType": "StringLiteral",
        "original": "\\n── Оцінюю ${uncovered.length} непокритих файлів (LLM) ──\\n`)",
        "replacement": "``"
      },
      {
        "line": 63,
        "col": 19,
        "mutantType": "StringLiteral",
        "original": "✓ LLM вирішила: жоден непокритий файл не потребує unit-тестів.')",
        "replacement": "\"\""
      },
      {
        "line": 67,
        "col": 17,
        "mutantType": "StringLiteral",
        "original": "\\n→ Потребують тестів (${needsTests.length}):`)",
        "replacement": "``"
      },
      {
        "line": 68,
        "col": 33,
        "mutantType": "BlockStatement",
        "original": "\n      console.log(`  • ${f.file} (${f.pct.toFixed(1)}%) — ${f.reason}`)\n    }",
        "replacement": "{}"
      },
      {
        "line": 69,
        "col": 19,
        "mutantType": "StringLiteral",
        "original": "  • ${f.file} (${f.pct.toFixed(1)}%) — ${f.reason}`)",
        "replacement": "``"
      },
      {
        "line": 75,
        "col": 15,
        "mutantType": "StringLiteral",
        "original": "\\n── Мутаційне тестування + автофікс ──\\n')",
        "replacement": "\"\""
      },
      {
        "line": 76,
        "col": 31,
        "mutantType": "StringLiteral",
        "original": "coverage',",
        "replacement": "\"\""
      },
      {
        "line": 78,
        "col": 17,
        "mutantType": "StringLiteral",
        "original": "\\n♻️  Повторний coverage після агента...\\n')",
        "replacement": "\"\""
      },
      {
        "line": 79,
        "col": 21,
        "mutantType": "StringLiteral",
        "original": "coverage',",
        "replacement": "\"\""
      }
    ],
    "exampleTest": {
      "testFile": "npm/src/run.test.mjs",
      "code": "  it(\"should complete successfully when all files meet the coverage threshold\", async () => {\n    vi.mocked(measureCoveragePerFile).mockResolvedValue([\n      { file: \"a.js\", pct: 90.0 },\n      { file: \"b.js\", pct: 85.0 },\n    ])\n    vi.mocked(getUncoveredFiles).mockReturnValue([])\n\n    const result = await runAutoTest(mockDir)\n\n    expect(measureCoveragePerFile).toHaveBeenCalledWith(mockDir)\n    expect(assessNeed).not.toHaveBeenCalled()\n    expect(generateTests).not.toHaveBeenCalled()\n    expect(withLock).toHaveBeenCalledTimes(2)\n    expect(runCoverageSteps).toHaveBeenCalledWith({ fix: true, cwd: mockDir })\n    expect(runCoverageSteps).toHaveBeenCalledWith({ fix: false, cwd: mockDir })\n  })"
    },
    "recommendationText": null
  },
  {
    "file": "npm/src/scripts/lib/read-n-cursor-config-lite.mjs",
    "mutants": [
      {
        "line": 35,
        "col": 42,
        "mutantType": "StringLiteral",
        "original": "utf8')",
        "replacement": "\"\""
      },
      {
        "line": 57,
        "col": 7,
        "mutantType": "ConditionalExpression",
        "original": "onfig.disableRules.includes(ruleId))",
        "replacement": "false"
      }
    ],
    "exampleTest": {
      "testFile": "npm/src/scripts/lib/read-n-cursor-config-lite.test.mjs",
      "code": "  it(\"should return default configuration when config file does not exist\", async () => {\n    vi.mocked(existsSync).mockReturnValue(false)\n\n    const config = await readNCursorConfigLite(MOCK_CWD)\n\n    expect(config.exists).toBe(false)\n    expect(config.rules).toEqual([])\n    expect(config.disableRules).toEqual([])\n    expect(vi.mocked(readFile)).not.toHaveBeenCalled()\n  })"
    },
    "recommendationText": null
  },
  {
    "file": "npm/src/scripts/utils/lock-cache-dir.mjs",
    "mutants": [
      {
        "line": 28,
        "col": 19,
        "mutantType": "StringLiteral",
        "original": "git',",
        "replacement": "\"\""
      },
      {
        "line": 28,
        "col": 26,
        "mutantType": "ArrayDeclaration",
        "original": "'rev-parse', '--git-common-dir'],",
        "replacement": "[]"
      },
      {
        "line": 28,
        "col": 27,
        "mutantType": "StringLiteral",
        "original": "rev-parse',",
        "replacement": "\"\""
      },
      {
        "line": 28,
        "col": 40,
        "mutantType": "StringLiteral",
        "original": "--git-common-dir']",
        "replacement": "\"\""
      },
      {
        "line": 28,
        "col": 61,
        "mutantType": "ObjectLiteral",
        "original": " cwd, encoding: 'utf8' })",
        "replacement": "{}"
      },
      {
        "line": 28,
        "col": 78,
        "mutantType": "StringLiteral",
        "original": "utf8' ",
        "replacement": "\"\""
      },
      {
        "line": 29,
        "col": 21,
        "mutantType": "ConditionalExpression",
        "original": ".status === 0 && !r.error ",
        "replacement": "true"
      },
      {
        "line": 29,
        "col": 21,
        "mutantType": "LogicalOperator",
        "original": ".status === 0 && !r.error ",
        "replacement": "r.status === 0 || !r.error"
      },
      {
        "line": 29,
        "col": 21,
        "mutantType": "ConditionalExpression",
        "original": ".status === 0 ",
        "replacement": "true"
      }
    ],
    "exampleTest": {
      "testFile": "npm/src/scripts/utils/lock-cache-dir.test.mjs",
      "code": "  it('should return per-checkout cache path when git command fails or is unavailable (no common directory)', () => {\n    // Setup mock to simulate git failure (status 1)\n    mockSpawnSync.mockReturnValue({ status: 1, stdout: '', error: new Error('Not a git repo') })\n\n    // Test with default CWD (process.cwd())\n    const resultDefaultCwd = resolveLockCacheDir(mockKey, { spawn: mockSpawnSync })\n    expect(resultDefaultCwd).toBe(`${process.cwd()}/node_modules/.cache/n-cursor/${mockKey}`)\n\n    // Test with specified CWD\n    const resultSpecificCwd = resolveLockCacheDir(mockKey, {\n      cwd: mockCwd,\n      spawn: mockSpawnSync,\n    })\n    expect(resultSpecificCwd).toBe(`${mockCwd}/node_modules/.cache/n-cursor/${mockKey}`)\n  })"
    },
    "recommendationText": null
  },
  {
    "file": "npm/src/scripts/utils/with-lock.mjs",
    "mutants": [
      {
        "line": 53,
        "col": 7,
        "mutantType": "EqualityOperator",
        "original": "ate.now() - result.finishedAt >= ttl)",
        "replacement": "Date.now() - result.finishedAt > ttl"
      }
    ],
    "exampleTest": {
      "testFile": "npm/src/scripts/utils/with-lock.test.mjs",
      "code": "  it(\"should return false if exitCode is not 0\", () => {\n    const result = { exitCode: 1, fingerprint: \"fp\", finishedAt: Date.now() }\n    expect(shouldDedup(result, \"fp\", 1000)).toBe(false)\n  })"
    },
    "recommendationText": null
  },
  {
    "file": "npm/src/scripts/utils/worktree-fingerprint.mjs",
    "mutants": [
      {
        "line": 15,
        "col": 21,
        "mutantType": "StringLiteral",
        "original": "git',",
        "replacement": "\"\""
      },
      {
        "line": 15,
        "col": 34,
        "mutantType": "ObjectLiteral",
        "original": " encoding: 'utf8' })",
        "replacement": "{}"
      },
      {
        "line": 15,
        "col": 46,
        "mutantType": "StringLiteral",
        "original": "utf8' ",
        "replacement": "\"\""
      },
      {
        "line": 16,
        "col": 9,
        "mutantType": "LogicalOperator",
        "original": ".status !== 0 || r.error)",
        "replacement": "r.status !== 0 && r.error"
      },
      {
        "line": 16,
        "col": 9,
        "mutantType": "ConditionalExpression",
        "original": ".status !== 0 ",
        "replacement": "false"
      },
      {
        "line": 16,
        "col": 52,
        "mutantType": "StringLiteral",
        "original": "git ${args[0]} failed`)",
        "replacement": "``"
      },
      {
        "line": 21,
        "col": 24,
        "mutantType": "MethodExpression",
        "original": "it(['rev-parse', 'HEAD']).trim()",
        "replacement": "git(['rev-parse', 'HEAD'])"
      },
      {
        "line": 21,
        "col": 28,
        "mutantType": "ArrayDeclaration",
        "original": "'rev-parse', 'HEAD'])",
        "replacement": "[]"
      },
      {
        "line": 21,
        "col": 29,
        "mutantType": "StringLiteral",
        "original": "rev-parse',",
        "replacement": "\"\""
      },
      {
        "line": 21,
        "col": 42,
        "mutantType": "StringLiteral",
        "original": "HEAD']",
        "replacement": "\"\""
      },
      {
        "line": 22,
        "col": 26,
        "mutantType": "ArrayDeclaration",
        "original": "'diff', 'HEAD'])",
        "replacement": "[]"
      },
      {
        "line": 22,
        "col": 27,
        "mutantType": "StringLiteral",
        "original": "diff',",
        "replacement": "\"\""
      },
      {
        "line": 22,
        "col": 35,
        "mutantType": "StringLiteral",
        "original": "HEAD']",
        "replacement": "\"\""
      },
      {
        "line": 25,
        "col": 30,
        "mutantType": "ArrayDeclaration",
        "original": "'ls-files', '-z', '--others', '--exclude-standard'])",
        "replacement": "[]"
      },
      {
        "line": 25,
        "col": 31,
        "mutantType": "StringLiteral",
        "original": "ls-files',",
        "replacement": "\"\""
      },
      {
        "line": 25,
        "col": 43,
        "mutantType": "StringLiteral",
        "original": "-z',",
        "replacement": "\"\""
      },
      {
        "line": 25,
        "col": 49,
        "mutantType": "StringLiteral",
        "original": "--others',",
        "replacement": "\"\""
      },
      {
        "line": 25,
        "col": 61,
        "mutantType": "StringLiteral",
        "original": "--exclude-standard']",
        "replacement": "\"\""
      },
      {
        "line": 26,
        "col": 28,
        "mutantType": "MethodExpression",
        "original": "ntrackedRaw.split('\\0').filter(Boolean)",
        "replacement": "untrackedRaw.split('\\0')"
      },
      {
        "line": 26,
        "col": 47,
        "mutantType": "StringLiteral",
        "original": "\\0')",
        "replacement": "\"\""
      },
      {
        "line": 27,
        "col": 38,
        "mutantType": "ArrowFunction",
        "original": " => `${f}:${git(['hash-object', f]).trim()}`)",
        "replacement": "() => undefined"
      },
      {
        "line": 27,
        "col": 43,
        "mutantType": "StringLiteral",
        "original": "${f}:${git(['hash-object', f]).trim()}`)",
        "replacement": "``"
      },
      {
        "line": 27,
        "col": 51,
        "mutantType": "MethodExpression",
        "original": "it(['hash-object', f]).trim()}",
        "replacement": "git(['hash-object', f])"
      },
      {
        "line": 27,
        "col": 55,
        "mutantType": "ArrayDeclaration",
        "original": "'hash-object', f])",
        "replacement": "[]"
      },
      {
        "line": 27,
        "col": 56,
        "mutantType": "StringLiteral",
        "original": "hash-object',",
        "replacement": "\"\""
      },
      {
        "line": 28,
        "col": 17,
        "mutantType": "ArrayDeclaration",
        "original": "commitHash, diffText, ...pairs].",
        "replacement": "[]"
      },
      {
        "line": 28,
        "col": 55,
        "mutantType": "StringLiteral",
        "original": "\\n')",
        "replacement": "\"\""
      }
    ],
    "exampleTest": {
      "testFile": "npm/src/scripts/utils/worktree-fingerprint.test.mjs",
      "code": "  it('should return a valid SHA256 hash for a fully committed and tracked repository', async () => {\n    // 1. Test for 'rev-parse HEAD'\n    vi.mocked(spawnSync).mockReturnValueOnce({ status: 0, stdout: 'a1b2c3d4e5f67890a1b2c3d4e5f67890', error: null })\n\n    // 2. Test for 'diff HEAD' (should return empty for clean repo)\n    vi.mocked(spawnSync).mockReturnValueOnce({ status: 0, stdout: '', error: null })\n\n    // 3. Test for 'ls-files -z --others --exclude-standard' (no untracked files)\n    vi.mocked(spawnSync).mockReturnValueOnce({ status: 0, stdout: '', error: null })\n\n    // For hash-object, we only need to mock it if there are files.\n    // Since untrackedFiles is empty, this is skipped.\n\n    const hash = worktreeFingerprint()\n    expect(typeof hash).toBe('string')\n    expect(hash.length).toBe(64)\n  })"
    },
    "recommendationText": null
  }
]
````

### npm/src/assess-need.mjs

| Рядок | Оригінал                                                | Заміна | Тип |
| ----- | ------------------------------------------------------- | ------ | --- |
| 11    | `You are a test-need classifier for JS/TS source files. |

Given a source file with low test coverage, decide if unit tests are worthwhile.

Reply ONLY with a JSON object (no markdown fence):
{"needsTests": true|false, "reason": "one sentence in Ukrainian"}

needsTests: false when:

- File only contains types, interfaces, constants, or re-exports with no logic
- Thin config or index file that just wires up other modules
- Behavior is fully covered by integration/e2e tests (name them)

needsTests: true when:

- File contains utility functions, parsers, transformers with branches
- Business logic with conditions or non-trivial contracts
- Pure functions that can be unit-tested cheaply``| ```` | StringLiteral |
| 39 |`ontent.length > MAX*CONTENT_BYTES)`|`true`| ConditionalExpression |
| 39 |`ontent.length > MAX_CONTENT_BYTES)`|`content.length >= MAX_CONTENT_BYTES`| EqualityOperator |
| 39 |`ontent.slice(0, MAX_CONTENT_BYTES) `|`content`| MethodExpression |
| 42 |`${SYSTEM_PROMPT}\n\n` ` | ````| StringLiteral |
| 48 |`\{[\s\S]*?"needsTests"[\s\S]_?\}/)`|`/\{[\S\S]_?"needsTests"[\s\S]_?\}/`| Regex |
| 48 |`\{[\s\S]_?"needsTests"[\s\S]_?\}/)`|`/\{[\s\s]_?"needsTests"[\s\S]\_?\}/`| Regex |
| 49 |`atch?.[0] `|`match[0]`| OptionalChaining |
| 49 |`{}')`|`""`| StringLiteral |
| 54 |`'`|`"Stryker was here!"`| StringLiteral |
| 57 |`оцінка не вдалась — вважаємо що потрібні тести' `|`""` | StringLiteral |

**Приклад тесту** (`npm/src/assess-need.test.mjs`):

```js
it('returns needsTests:false when file not found', async () => {
  vi.mocked(existsSync).mockReturnValue(false)
  const result = await assessNeed([{ file: 'src/a.mjs', pct: 0 }], DIR, { callText: mockCallText })
  expect(result[0].needsTests).toBe(false)
  expect(result[0].reason).toBe('файл недоступний')
  expect(mockCallText).not.toHaveBeenCalled()
})
```

### npm/src/coverage/coverage.mjs

| Рядок | Оригінал                       | Заміна                         | Тип                   |
| ----- | ------------------------------ | ------------------------------ | --------------------- | ------ | --- | --- | ---- | ------------- | ------------- |
| 33    | `@nitra',`                     | `""`                           | StringLiteral         |
| 33    | `cursor',`                     | `""`                           | StringLiteral         |
| 33    | `rules')`                      | `""`                           | StringLiteral         |
| 97    | `',`                           | `"Stryker was here!"`          | StringLiteral         |
| 99    | `                              | ---                            | ---                   | ---    | --- | --- | '`   | `""`          | StringLiteral |
| 110   | `',`                           | `"Stryker was here!"`          | StringLiteral         |
| 110   | `',`                           | `"Stryker was here!"`          | StringLiteral         |
| 110   | ````json',`                    | `""`                           | StringLiteral         |
| 110   | ````')`                        | `""`                           | StringLiteral         |
| 113   | `',`                           | `"Stryker was here!"`          | StringLiteral         |
| 113   | `',`                           | `"Stryker was here!"`          | StringLiteral         |
| 113   | `                              | Рядок                          | Оригінал              | Заміна | Тип | ',` | `""` | StringLiteral |
| 113   | `                              | ---                            | ---                   | ---    | --- | ')` | `""` | StringLiteral |
| 117   | `roup.exampleTest)`            | `true`                         | ConditionalExpression |
| 119   | `',`                           | `"Stryker was here!"`          | StringLiteral         |
| 121   | `',`                           | `"Stryker was here!"`          | StringLiteral         |
| 122   | ````js',`                      | `""`                           | StringLiteral         |
| 123   | `roup.exampleTest.code ?? '',` | `group.exampleTest.code && ''` | LogicalOperator       |
| 124   | ````'`                         | `""`                           | StringLiteral         |
| 127   | `roup.recommendationText)`     | `true`                         | ConditionalExpression |
| 127   | `roup.recommendationText)`     | `false`                        | ConditionalExpression |
| 127   | `                              |

        lines.push('', '**Що треба протестувати:**', '', group.recommendationText)
      }` | `{}` | BlockStatement |

| 128 | `',` | `"Stryker was here!"` | StringLiteral |
| 128 | `**Що треба протестувати:**',` | `""` | StringLiteral |
| 128 | `',` | `"Stryker was here!"` | StringLiteral |
| 133 | `llowedGaps.length > 0)` | `true` | ConditionalExpression |
| 133 | `llowedGaps.length > 0)` | `false` | ConditionalExpression |
| 133 | `llowedGaps.length > 0)` | `allowedGaps.length >= 0` | EqualityOperator |
| 133 | `llowedGaps.length > 0)` | `allowedGaps.length <= 0` | EqualityOperator |
| 166 | `\n')` | `""` | StringLiteral |

**Приклад тесту** (`npm/src/coverage/coverage.test.mjs`):

```js
it('should correctly sum coverage totals', () => {
  const a = { lines: { covered: 5, total: 10 }, functions: { covered: 2, total: 5 } }
  const b = { lines: { covered: 3, total: 5 }, functions: { covered: 1, total: 2 } }
  const result = addCoverage(a, b)
  expect(result.lines.covered).toBe(8)
  expect(result.lines.total).toBe(15)
  expect(result.functions.covered).toBe(3)
  expect(result.functions.total).toBe(7)
})
```

### npm/src/coverage-classify/apply.mjs

| Рядок | Оригінал                                | Заміна                           | Тип              |
| ----- | --------------------------------------- | -------------------------------- | ---------------- |
| 10    | `defensive',`                           | `""`                             | StringLiteral    |
| 10    | `glue',`                                | `""`                             | StringLiteral    |
| 10    | `wrapper']`                             | `""`                             | StringLiteral    |
| 19    | `erdict.confidence >= threshold`        | `verdict.confidence > threshold` | EqualityOperator |
| 48    | ` file: group.file, mutant, verdict })` | `{}`                             | ObjectLiteral    |

**Приклад тесту** (`npm/src/coverage-classify/apply.test.mjs`):

```js
it('should mark equivalent mutants as allowed gaps if confidence >= threshold', () => {
  const result = applyVerdicts(mockRows, mockVerdicts, 0.8)
  expect(result.allowedGaps).toHaveLength(1)
  expect(result.rows[0].mutation.total).toBe(9)
  expect(result.rows[0].survived).toHaveLength(0)
})
```

### npm/src/coverage-classify/cache.mjs

| Рядок | Оригінал                           | Заміна         | Тип                                |
| ----- | ---------------------------------- | -------------- | ---------------------------------- | --------------------------------------------------- | ----------------------------- | --------------- | --------------------- | ----------------------------------------------------------------- | --------------- |
| 29    | `git',`                            | `""`           | StringLiteral                      |
| 29    | `'hash-object', filePath],`        | `[]`           | ArrayDeclaration                   |
| 29    | `hash-object',`                    | `""`           | StringLiteral                      |
| 29    | ` encoding: 'utf8' })`             | `{}`           | ObjectLiteral                      |
| 29    | `utf8' `                           | `""`           | StringLiteral                      |
| 44    | `blobHash)`                        | `true`         | ConditionalExpression              |
| 57    | `existsSync(cachePath))`           | `false`        | ConditionalExpression              |
| 59    | `utf8')`                           | `""`           | StringLiteral                      |
| 60    | `ata?.version `                    | `data.version` | OptionalChaining                   |
| 61    | `data.entries                      |                | typeof data.entries !== 'object'   |                                                     | Array.isArray(data.entries))` | `false`         | ConditionalExpression |
| 61    | `data.entries                      |                | typeof data.entries !== 'object'   |                                                     | Array.isArray(data.entries))` | `(!data.entries |                       | typeof data.entries !== 'object') && Array.isArray(data.entries)` | LogicalOperator |
| 61    | `data.entries                      |                | typeof data.entries !== 'object' ` | `false`                                             | ConditionalExpression         |
| 61    | `data.entries                      |                | typeof data.entries !== 'object' ` | `!data.entries && typeof data.entries !== 'object'` | LogicalOperator               |
| 61    | `ypeof data.entries !== 'object' ` | `false`        | ConditionalExpression              |

**Приклад тесту** (`npm/src/coverage-classify/cache.test.mjs`):

```js
it('uses git hash-object when available', () => {
  vi.mocked(existsSync).mockReturnValue(true)
  vi.mocked(execFileSync).mockReturnValue('abc123\n')
  expect(deriveBlobHash(FILE)).toBe('abc123')
})
```

### npm/src/coverage-classify/index.mjs

| Рядок | Оригінал                                                                          | Заміна                                                                    | Тип                   |
| ----- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------- |
| 25    | `LLM-classification unavailable, conservative fallback (treat as worth-testing)'` | `""`                                                                      | StringLiteral         |
| 48    | `${SYSTEM_PROMPT}\n\n${buildUserPrompt({ ...mutant, file: group.file }, cwd)}``   | ````                                                                      | StringLiteral         |
| 49    | `${group.file}:${mutant.line}:${mutant.col}``                                     | ````                                                                      | StringLiteral         |
| 53    | `min')`                                                                           | `""`                                                                      | StringLiteral         |
| 61    | `⚠ coverage classify: ${loc} both tiers failed: ${error.message}`)`               | ````                                                                      | StringLiteral         |
| 75    | `pts.cachePath ?? join(cwd, 'npm/reports/coverage-classify.cache.json')`          | `opts.cachePath && join(cwd, 'npm/reports/coverage-classify.cache.json')` | LogicalOperator       |
| 75    | `npm/reports/coverage-classify.cache.json')`                                      | `""`                                                                      | StringLiteral         |
| 77    | `min')`                                                                           | `""`                                                                      | StringLiteral         |
| 80    | `ache.model !== cacheModel)`                                                      | `false`                                                                   | ConditionalExpression |
| 88    | `${group.file}:${mutant.line}:${mutant.col}:${mutant.replacement}``               | ````                                                                      | StringLiteral         |
| 103   | `acheKey)`                                                                        | `true`                                                                    | ConditionalExpression |
| 103   | `acheKey)`                                                                        | `false`                                                                   | ConditionalExpression |
| 103   | `                                                                                 |

          cache.entries[cacheKey] = { ...verdict, classifiedAt: new Date().toISOString() }
        }` | `{}` | BlockStatement |

**Приклад тесту** (`npm/src/coverage-classify/index.test.mjs`):

```js
it('should use cached verdict if available', async () => {
  const cachedVerdict = { verdict: 'ok', confidence: 1.0, reason: 'Cached' }
  vi.mocked(readCache).mockReturnValue({
    version: 1,
    model: 'mock_model+cloud',
    entries: { mock_key: { verdict: 'ok', confidence: 1.0, reason: 'Cached' } }
  })

  const results = await classify(mockSurvived, mockCwd)

  expect(vi.mocked(deriveCacheKey)).toHaveBeenCalled()
  expect(results[0].verdict.verdict).toBe('ok')
})
```

### npm/src/coverage-classify/prompt.mjs

| Рядок | Оригінал                                | Заміна | Тип |
| ----- | --------------------------------------- | ------ | --- |
| 13    | `You are a mutation testing classifier. |

For each survived Stryker mutant, classify it into exactly one verdict:

- **worth-testing**: pure logic with real branches that should be tested. The mutant
  exposes a missing assertion in a unit test. Recommend a test approach.
- **equivalent**: the mutated code is behaviorally indistinguishable from the original
  (e.g., both branches produce the same observable output, or the mutant lies on dead
  code). You MUST cite a concrete reason referencing input flow or output equivalence.
- **defensive**: the branch guards against an impossible state given input contracts
  or type system. You MUST identify the invariant that makes the state unreachable.
- **glue**: thin CLI entrypoint, factory, or boilerplate (e.g., runStandardRule
  wrapper, fix.mjs stubs). Integration tests via subprocess cover the behavior.
  Name the integration test or pattern.
- **wrapper**: thin shell around an external tool (spawnSync, fetch, dynamic import).
  The wrapper has no logic worth unit-testing in isolation; behavior comes from the
  wrapped tool. Name the integration test or pattern.

Output ONLY a single JSON object matching this schema:

\`\`\`
{
"verdict": "worth-testing" | "equivalent" | "defensive" | "glue" | "wrapper",
"confidence": number 0-1,
"reason": string (20-500 chars; concrete code-level reference, not "seems like"),
"suggestedTest": string (max 300 chars; required only when verdict is worth-testing)
}
\`\`\`

Confidence guidance:

- 0.9+: cite specific code fragment, identifier, or input contract proving the verdict.
- 0.7-0.9: strong inference from visible code structure.
- <0.7: ambiguity, lacking context, or unfamiliar pattern. Be honest.

Never invent integration test names. If you cannot identify a covering test, use
worth-testing with low confidence instead of glue/wrapper.
``| ```` | StringLiteral |
| 70 |`
const absPath = join(cwd, mutant.file)

// Source context
let srcContext = '(source file unavailable)'
if (existsSync(absPath)) {
const lines = readFileSync(absPath, 'utf8').split('\n')
const start = Math.max(0, mutant.line - 1 - CONTEXT_LINES)
const end = Math.min(lines.length, mutant.line + CONTEXT_LINES)
srcContext = lines
.slice(start, end)
.map((l, i) => `${start + i + 1}: ${l}`)
.join('\n')
}

// Existing tests
const testPath = join(dirname(absPath), 'tests', `${basename(absPath, '.mjs')}.test.mjs`)
let existingTests = '(no test file)'
if (existsSync(testPath)) {
const content = readFileSync(testPath, 'utf8')
if (content.split('\n').length > TEST_FILE_MAX_LINES) {
existingTests = extractTestTitles(content)
} else {
existingTests = content
}
}

// Recent git activity (graceful если нет git або untracked)
let recentActivity = '(no git history)'
try {
const out = execFileSync('git', ['log', '-1', '--format=%ar', '--', absPath], {
cwd,
encoding: 'utf8',
stdio: ['ignore', 'pipe', 'ignore']
}).trim()
if (out) recentActivity = out
} catch {
// git unavailable or file untracked — keep placeholder
}

return `# Mutant
File: ${mutant.file}
Line: ${mutant.line}:${mutant.col}
Type: ${mutant.mutantType}
Original code: \`${mutant.original}\`
Mutated to: \`${mutant.replacement}\`

# Source context (±${CONTEXT_LINES} lines)

${srcContext}

# Existing tests

${existingTests}

# Recent activity

File last modified: ${recentActivity}
`
}` | `{}` | BlockStatement |
| 74 | `(source file unavailable)'` | `""` | StringLiteral |
| 75 | `xistsSync(absPath))` | `false` | ConditionalExpression |
| 86 | `tests',` | `""` | StringLiteral |
| 86 | `${basename(absPath, '.mjs')}.test.mjs`)` | ````| StringLiteral |
| 86 |`.mjs')`|`""`| StringLiteral |
| 87 |`(no test file)'`|`""`| StringLiteral |
| 88 |`xistsSync(testPath))`|`false`| ConditionalExpression |
| 98 |`(no git history)'`|`""`| StringLiteral |
| 99 |`
const out = execFileSync('git', ['log', '-1', '--format=%ar', '--', absPath], {
cwd,
encoding: 'utf8',
stdio: ['ignore', 'pipe', 'ignore']
}).trim()
if (out) recentActivity = out
} `|`{}`| BlockStatement |
| 100 |`xecFileSync('git', ['log', '-1', '--format=%ar', '--', absPath], {
cwd,
encoding: 'utf8',
stdio: ['ignore', 'pipe', 'ignore']
}).trim()`|`execFileSync('git', ['log', '-1', '--format=%ar', '--', absPath], {
cwd,
encoding: 'utf8',
stdio: ['ignore', 'pipe', 'ignore']
})`| MethodExpression |
| 100 |`git',`|`""`| StringLiteral |
| 100 |`'log', '-1', '--format=%ar', '--', absPath],`|`[]`| ArrayDeclaration |
| 100 |`log',`|`""`| StringLiteral |
| 100 |`-1',`|`""`| StringLiteral |
| 100 |`--format=%ar',`|`""`| StringLiteral |
| 100 |`--',`|`""`| StringLiteral |
| 100 |`
cwd,
encoding: 'utf8',
stdio: ['ignore', 'pipe', 'ignore']
})`|`{}`| ObjectLiteral |
| 102 |`utf8',`|`""`| StringLiteral |
| 103 |`'ignore', 'pipe', 'ignore']`|`[]`| ArrayDeclaration |
| 103 |`ignore',`|`""`| StringLiteral |
| 103 |`pipe',`|`""`| StringLiteral |
| 103 |`ignore']`|`""`| StringLiteral |
| 110 |`# Mutant
File: ${mutant.file}
Line: ${mutant.line}:${mutant.col}
Type: ${mutant.mutantType}
Original code: \`${mutant.original}\`
Mutated to: \`${mutant.replacement}\`

# Source context (±${CONTEXT_LINES} lines)

${srcContext}

# Existing tests

${existingTests}

# Recent activity

File last modified: ${recentActivity}
`` | ```` | StringLiteral |

### npm/src/coverage-classify/verdict-schema.mjs

| Рядок | Оригінал | Заміна | Тип |
| ----- | -------- | ------ | --- |
| 14    | `        |

verdict: z.enum(['worth-testing', 'equivalent', 'defensive', 'glue', 'wrapper']),
confidence: z.number().min(0).max(1),
reason: z.string().min(20).max(500),
suggestedTest: z.string().max(300).optional()
})`|`{}`| ObjectLiteral |
| 15 |`equivalent',`|`""`| StringLiteral |
| 15 |`defensive',`|`""`| StringLiteral |
| 15 |`glue',`|`""`| StringLiteral |
| 15 |`wrapper']`|`""`| StringLiteral |
| 28 |`{')`|`""`| StringLiteral |
| 29 |`}')`|`""`| StringLiteral |
| 30 |`sonStart === -1 || jsonEnd === -1)`|`false`| ConditionalExpression |
| 30 |`sonStart === -1 || jsonEnd === -1)`|`jsonStart === -1 && jsonEnd === -1`| LogicalOperator |
| 30 |`sonStart === -1 `|`false`| ConditionalExpression |
| 30 |`1 `|`+1`| UnaryOperator |
| 30 |`sonEnd === -1)`|`false`| ConditionalExpression |
| 30 |`1)`|`+1`| UnaryOperator |
| 33 |`awText.slice(jsonStart, jsonEnd + 1))`|`rawText` | MethodExpression |

### npm/src/coverage-fix.mjs

| Рядок | Оригінал                                                                            | Заміна                                                   | Тип                |
| ----- | ----------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------ |
| 16    | `nv.N_CURSOR_COVERAGE_FIX_MODEL ?? resolveModel('max')`                             | `env.N_CURSOR_COVERAGE_FIX_MODEL && resolveModel('max')` | LogicalOperator    |
| 16    | `max')`                                                                             | `""`                                                     | StringLiteral      |
| 31    | `s, g) => s + g.mutants.length,`                                                    | `() => undefined`                                        | ArrowFunction      |
| 31    | ` + g.mutants.length,`                                                              | `s - g.mutants.length`                                   | ArithmeticOperator |
| 38    | `\n🤖 coverage --fix: запускаю агента для ${totalMutants} вцілілих мутантів...\n`)` | ````                                                     | StringLiteral      |
| 51    | `]`                                                                                 | `["Stryker was here"]`                                   | ArrayDeclaration   |
| 67    | `]`                                                                                 | `["Stryker was here"]`                                   | ArrayDeclaration   |
| 70    | `]`                                                                                 | `["Stryker was here"]`                                   | ArrayDeclaration   |
| 71    | `                                                                                   |

      const src = await readFile(join(projectRoot, file), 'utf8')
      srcLines = src.split('\n')
    } ` | `{}` | BlockStatement |

| 72 | `utf8')` | `""` | StringLiteral |
| 73 | `\n')` | `""` | StringLiteral |
| 80 | `ath.max(0, m.line - 4)` | `Math.min(0, m.line - 4)` | MethodExpression |
| 80 | `.line - 4)` | `m.line + 4` | ArithmeticOperator |
| 81 | `ath.min(srcLines.length, m.line + 3)` | `Math.max(srcLines.length, m.line + 3)` | MethodExpression |
| 81 | `.line + 3)` | `m.line - 3` | ArithmeticOperator |
| 82 | `rcLines
          .slice(ctxStart, ctxEnd)` | `srcLines` | MethodExpression |
| 84 | `l, i) => `${ctxStart + i + 1}: ${l}`)` | `() => undefined` | ArrowFunction |
| 84 | `${ctxStart + i + 1}: ${l}`)` | ```` | StringLiteral |
| 84 | `txStart + i + 1}` | `ctxStart + i - 1` | ArithmeticOperator |
| 84 | `txStart + i ` | `ctxStart - i` | ArithmeticOperator |
| 85 | `\n')` | `""` | StringLiteral |
| 86 | `
          `  - Рядок ${m.line}, колонка ${m.col}, тип мутації \`${m.mutantType}\``,
          ` Оригінал: \`${m.original}\``,
          `    Вижив варіант: \`${m.replacement}\``,
          context ? ` Контекст:\n\`\`\`\n${context}\n\`\`\`` : ''
        ]
          .filter(Boolean)` | `[`  - Рядок ${m.line}, колонка ${m.col}, тип мутації \`${m.mutantType}\``, ` Оригінал: \`${m.original}\``, `    Вижив варіант: \`${m.replacement}\``, context ? ` Контекст:\n\`\`\`\n${context}\n\`\`\`` : '']` | MethodExpression |
| 90 | `    Контекст:\n\`\`\`\n${context}\n\`\`\`` ` | ````| StringLiteral |
| 90 |`'`|`"Stryker was here!"`| StringLiteral |
| 93 |`\n')`|`""`| StringLiteral |
| 95 |`\n')`|`""`| StringLiteral |
| 99 |`'`|`"Stryker was here!"`| StringLiteral |
| 105 |`Твоє завдання — написати unit-тести, що вбивають наступні вцілілі мутанти Stryker.',`|`""`| StringLiteral |
| 106 |`Для кожного мутанта: знайди або створи відповідний test-файл, додай тест-кейс,',`|`""`| StringLiteral |
| 107 |`що явно перевіряє цю гілку/умову і провалиться якщо код замінити на "вцілілий варіант".',`|`""`| StringLiteral |
| 108 |`',`|`"Stryker was here!"`| StringLiteral |
| 109 |`## Вцілілі мутанти',`|`""`| StringLiteral |
| 110 |`',`|`"Stryker was here!"`| StringLiteral |
| 112 |`',`|`"Stryker was here!"`| StringLiteral |
| 113 |`## Правила',`|`""`| StringLiteral |
| 114 |`- Не змінюй source-файли — лише test-файли.',`|`""`| StringLiteral |
| 115 |`- Використовуй той самий test-фреймворк, що вже в проєкті.',`|`""`| StringLiteral |
| 116 |`- Запусти `bun test` (або відповідну команду) після кожного файлу — переконайся, що 0 fail.',`|`""`| StringLiteral |
| 117 |`- Якщо мутант охоплений іншим новим тестом — не дублюй.'`|`""`| StringLiteral |
| 118 |`\n')`|`""` | StringLiteral |

**Приклад тесту** (`npm/src/coverage-fix.test.mjs`):

```js
it('logs and returns early when survived is empty', async () => {
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  await fixSurvivedMutants([], ROOT)
  expect(logSpy).toHaveBeenCalledWith('✓ Всі мутанти вбиті — доповнення тестів не потрібне')
  expect(vi.mocked(spawnSync)).not.toHaveBeenCalled()
  logSpy.mockRestore()
})
```

### npm/src/coverage-per-file.mjs

| Рядок | Оригінал                                  | Заміна                     | Тип                   |
| ----- | ----------------------------------------- | -------------------------- | --------------------- | ------------ | --------------- | ------------------- | ----- |
| 13    | `\.(test                                  | spec)\.[^.]+$              | [/\\]tests?[/\\]/`    | `/\.(test    | spec)\.[^.]+    | [/\\]tests?[/\\]/`  | Regex |
| 13    | `\.(test                                  | spec)\.[^.]+$              | [/\\]tests?[/\\]/`    | `/\.(test    | spec)\.[^.]$    | [/\\]tests?[/\\]/`  | Regex |
| 13    | `\.(test                                  | spec)\.[^.]+$              | [/\\]tests?[/\\]/`    | `/\.(test    | spec)\.[.]+$    | [/\\]tests?[/\\]/`  | Regex |
| 13    | `\.(test                                  | spec)\.[^.]+$              | [/\\]tests?[/\\]/`    | `/\.(test    | spec)\.[^.]+$   | [^/\\]tests?[/\\]/` | Regex |
| 13    | `\.(test                                  | spec)\.[^.]+$              | [/\\]tests?[/\\]/`    | `/\.(test    | spec)\.[^.]+$   | [/\\]tests[/\\]/`   | Regex |
| 13    | `\.(test                                  | spec)\.[^.]+$              | [/\\]tests?[/\\]/`    | `/\.(test    | spec)\.[^.]+$   | [/\\]tests?[^/\\]/` | Regex |
| 26    | `ine.slice(3).trim()`                     | `line.slice(3)`            | MethodExpression      |
| 26    | `ine.slice(3).`                           | `line`                     | MethodExpression      |
| 33    | `ine === 'end_of_record' && currentFile)` | `line === 'end_of_record'  |                       | currentFile` | LogicalOperator |
| 33    | `ine === 'end_of_record' `                | `true`                     | ConditionalExpression |
| 33    | `ine === 'end_of_record' `                | `line !== 'end_of_record'` | EqualityOperator      |
| 36    | `f === 0 `                                | `false`                    | ConditionalExpression |
| 52    | `7n-cov-')`                               | `""`                       | StringLiteral         |
| 59    | `--passWithNoTests',`                     | `""`                       | StringLiteral         |
| 62    | `--coverage.reportsDirectory=${lcovDir}`` | ````                       | StringLiteral         |
| 64    | `inherit',`                               | `""`                       | StringLiteral         |
| 66    | `lcov.info')`                             | `""`                       | StringLiteral         |
| 68    | `utf8')`                                  | `""`                       | StringLiteral         |
| 69    | `llFiles                                  |

      .map(f => ({ ...f, file: relative(dir, f.file) }))
      .filter(f => !f.file.startsWith('..') && !TEST_FILE_RE.test(f.file))` | `allFiles.map(f => ({

...f,
file: relative(dir, f.file)
}))`| MethodExpression |
| 71 |`f.file.startsWith('..') && !TEST_FILE_RE.test(f.file))`|`true`| ConditionalExpression |
| 71 |`f.file.startsWith('..') && !TEST_FILE_RE.test(f.file))`|`!f.file.startsWith('..') || !TEST_FILE_RE.test(f.file)`| LogicalOperator |
| 71 |`.file.startsWith('..') `|`f.file.endsWith('..')`| MethodExpression |
| 72 |`
await rm(lcovDir, { recursive: true, force: true }).catch(() => {})
}`|`{}`| BlockStatement |
| 73 |` recursive: true, force: true })`|`{}`| ObjectLiteral |
| 73 |`rue,`|`false`| BooleanLiteral |
| 73 |`rue `|`false` | BooleanLiteral |

**Приклад тесту** (`npm/src/coverage-per-file.test.mjs`):

```js
it('returns per-file data from lcov.info', async () => {
  vi.mocked(mkdtemp).mockResolvedValue('/tmp/7n-cov-xxx')
  vi.mocked(existsSync).mockReturnValue(true)
  vi.mocked(readFileSync).mockReturnValue(SAMPLE_LCOV)
  vi.mocked(rm).mockResolvedValue(undefined)

  const result = await measureCoveragePerFile('/proj')

  expect(vi.mocked(spawnSync)).toHaveBeenCalledWith(
    'bunx',
    expect.arrayContaining(['vitest', 'run', '--coverage', '--coverage.reporter=lcov']),
    expect.objectContaining({ cwd: '/proj' })
  )
  expect(result).toHaveLength(2)
  expect(result[0].pct).toBe(80)
  expect(result[1].pct).toBe(0)
})
```

### npm/src/gen-tests.mjs

| Рядок | Оригінал                                                                   | Заміна                            | Тип                   |
| ----- | -------------------------------------------------------------------------- | --------------------------------- | --------------------- |
| 16    | `\.[^.]+$/,`                                                               | `/\.[^.]+/`                       | Regex                 |
| 16    | `\.[^.]+$/,`                                                               | `/\.[^.]$/`                       | Regex                 |
| 16    | `\.[^.]+$/,`                                                               | `/\.[.]+$/`                       | Regex                 |
| 16    | `')`                                                                       | `"Stryker was here!"`             | StringLiteral         |
| 17    | `/')`                                                                      | `""`                              | StringLiteral         |
| 18    | `astSlash === -1 `                                                         | `true`                            | ConditionalExpression |
| 18    | `astSlash === -1 `                                                         | `false`                           | ConditionalExpression |
| 18    | `astSlash === -1 `                                                         | `lastSlash !== -1`                | EqualityOperator      |
| 18    | `1 `                                                                       | `+1`                              | UnaryOperator         |
| 18    | `ase.slice(lastSlash + 1)`                                                 | `base`                            | MethodExpression      |
| 18    | `astSlash + 1)`                                                            | `lastSlash - 1`                   | ArithmeticOperator    |
| 19    | `astSlash === -1 `                                                         | `true`                            | ConditionalExpression |
| 19    | `astSlash === -1 `                                                         | `false`                           | ConditionalExpression |
| 19    | `astSlash === -1 `                                                         | `lastSlash !== -1`                | EqualityOperator      |
| 19    | `1 `                                                                       | `+1`                              | UnaryOperator         |
| 19    | `ase.slice(0, lastSlash)`                                                  | `base`                            | MethodExpression      |
| 21    | `${base}.test.mjs`,`                                                       | ````                              | StringLiteral         |
| 22    | `${base}.test.js`,`                                                        | ````                              | StringLiteral         |
| 23    | `${dir}/tests/${name}.test.mjs`]`                                          | ````                              | StringLiteral         |
| 48    | `utf8')`                                                                   | `""`                              | StringLiteral         |
| 49    | `ontent.length > MAX_SRC_BYTES)`                                           | `true`                            | ConditionalExpression |
| 49    | `ontent.length > MAX_SRC_BYTES)`                                           | `content.length >= MAX_SRC_BYTES` | EqualityOperator      |
| 49    | `ontent.slice(0, MAX_SRC_BYTES) `                                          | `content`                         | MethodExpression      |
| 53    | `')`                                                                       | `"Stryker was here!"`             | StringLiteral         |
| 56    | `\n\n')`                                                                   | `""`                              | StringLiteral         |
| 69    | `'`                                                                        | `"Stryker was here!"`             | StringLiteral         |
| 71    | `utf8')`                                                                   | `""`                              | StringLiteral         |
| 77    | `',`                                                                       | `"Stryker was here!"`             | StringLiteral         |
| 132   | `iles.length === 0)`                                                       | `false`                           | ConditionalExpression |
| 134   | `pts.callText ?? callText`                                                 | `opts.callText && callText`       | LogicalOperator       |
| 137   | `\n🤖 Генерую тести для ${files.length} файлів (pi SDK, по одному)...\n`)` | ````                              | StringLiteral         |
| 140   | `  → ${fileInfo.file} (${fileInfo.pct.toFixed(1)}%)`)`                     | ````                              | StringLiteral         |

**Приклад тесту** (`npm/src/gen-tests.test.mjs`):

```js
it('should build a summary prompt correctly for multiple files', () => {
  const prompt = buildGenTestsPrompt(mockFiles, mockDir)
  expect(prompt).toContain('### `src/a.js` (покриття: 50.0%)')
  expect(prompt).toContain('Причина: Low coverage')
  expect(prompt).toContain('### `src/b.js` (покриття: 10.0%)')
  expect(prompt).toContain('### `other/c.ts` (покриття: 80.0%)')
})
```

### npm/src/lib/llm.mjs

| Рядок | Оригінал                                                                       | Заміна            | Тип              |
| ----- | ------------------------------------------------------------------------------ | ----------------- | ---------------- |
| 42    | ` => m.content)`                                                               | `() => undefined` | ArrowFunction    |
| 42    | `\n\n')`                                                                       | `""`              | StringLiteral    |
| 43    | `'--model', model] `                                                           | `[]`              | ArrayDeclaration |
| 43    | `--model',`                                                                    | `""`              | StringLiteral    |
| 44    | `pi',`                                                                         | `""`              | StringLiteral    |
| 44    | `'-p', prompt, ...modelArgs, '--no-session', '--mode', 'text', '--no-tools'],` | `[]`              | ArrayDeclaration |
| 44    | `-p',`                                                                         | `""`              | StringLiteral    |
| 44    | `--no-session',`                                                               | `""`              | StringLiteral    |
| 44    | `--mode',`                                                                     | `""`              | StringLiteral    |
| 44    | `text',`                                                                       | `""`              | StringLiteral    |
| 44    | `--no-tools']`                                                                 | `""`              | StringLiteral    |
| 44    | `                                                                              |

    encoding: 'utf8',
    timeout: timeoutMs

})`|`{}`| ObjectLiteral |
| 45 |`utf8',`|`""`| StringLiteral |
| 49 |`.stderr?.slice(0, 300) ?? ''}`|`r.stderr?.slice(0, 300) && ''`| LogicalOperator |
| 49 |`.stderr?.slice(0, 300) `|`r.stderr`| MethodExpression |
| 49 |`.stderr?.slice(`|`r.stderr.slice`| OptionalChaining |
| 50 |`.stdout?.trim() `|`r.stdout`| MethodExpression |
| 50 |`.stdout?.trim(`|`r.stdout.trim`| OptionalChaining |
| 64 |`aller ?? env.N_CURSOR_TRACE_CALLER ?? 'unknown'`|`(caller ?? env.N_CURSOR_TRACE_CALLER) && 'unknown'`| LogicalOperator |
| 64 |`aller ?? env.N_CURSOR_TRACE_CALLER `|`caller && env.N_CURSOR_TRACE_CALLER`| LogicalOperator |
| 64 |`unknown'`|`""`| StringLiteral |
| 86 |`
ts: new Date().toISOString(),
caller: resolvedCaller,
backend,
model,
temperature,
maxTokens,
messages,
content,
reasoning,
reasoningSource,
finishReason,
usage,
ms: Date.now() - t0,
attempts,
ok: true,
error: null
})`|`{}`| ObjectLiteral |
| 99 |`ate.now() - t0,`|`Date.now() + t0`| ArithmeticOperator |
| 101 |`rue,`|`false`| BooleanLiteral |
| 108 |`
ts: new Date().toISOString(),
caller: resolvedCaller,
backend,
model,
temperature,
maxTokens,
messages,
ms: Date.now() - t0,
attempts: null,
ok: false,
error: String(error.message).slice(0, 200)
})`|`{}`| ObjectLiteral |
| 116 |`ate.now() - t0,`|`Date.now() + t0`| ArithmeticOperator |
| 118 |`alse,`|`true`| BooleanLiteral |
| 119 |`tring(error.message).slice(0, 200)`|`String(error.message)`| MethodExpression |
| 139 |`memory ceiling'`|`""`| StringLiteral |
| 141 |`authentication_error'`|`""`| StringLiteral |
| 143 |`too long|exceeds[^.]*context|not found/i`|`/too long|exceeds[^.]context|not found/i`| Regex |
| 143 |`too long|exceeds[^.]*context|not found/i`|`/too long|exceeds[.]\*context|not found/i` | Regex |

**Приклад тесту** (`npm/src/lib/llm.test.mjs`):

```js
it('should return "omlx" if the model ID starts with "omlx/"', () => {
  vi.mocked(isOmlxModel).mockReturnValue(true)
  expect(pickBackend('omlx/some-model')).toBe('omlx')
})
```

### npm/src/lib/models.mjs

| Рядок                                | Оригінал                     | Заміна                        | Тип             |
| ------------------------------------ | ---------------------------- | ----------------------------- | --------------- | --------- | --- | --------- |
| 42                                   | `nv.N_LOCAL_MIN_MODEL ?? ''` | `env.N_LOCAL_MIN_MODEL && ''` | LogicalOperator |
| 45                                   | `nv.N_LOCAL_AVG_MODEL ?? ''` | `env.N_LOCAL_AVG_MODEL && ''` | LogicalOperator |
| 45                                   | `'`                          | `"Stryker was here!"`         | StringLiteral   |
| 48                                   | `nv.N_LOCAL_MAX_MODEL ?? ''` | `env.N_LOCAL_MAX_MODEL && ''` | LogicalOperator |
| 48                                   | `'`                          | `"Stryker was here!"`         | StringLiteral   |
| 53                                   | `nv.N_CLOUD_MIN_MODEL ?? ''` | `env.N_CLOUD_MIN_MODEL && ''` | LogicalOperator |
| 53                                   | `'`                          | `"Stryker was here!"`         | StringLiteral   |
| 56                                   | `nv.N_CLOUD_AVG_MODEL ?? ''` | `env.N_CLOUD_AVG_MODEL && ''` | LogicalOperator |
| 56                                   | `'`                          | `"Stryker was here!"`         | StringLiteral   |
| 59                                   | `nv.N_CLOUD_MAX_MODEL ?? ''` | `env.N_CLOUD_MAX_MODEL && ''` | LogicalOperator |
| 59                                   | `'`                          | `"Stryker was here!"`         | StringLiteral   |
| 70                                   | `                            |
| if (tier === 'min') return LOCAL_MIN |                              | LOCAL_AVG                     |                 | LOCAL_MAX |     | CLOUD_MIN |
| if (tier === 'avg') return LOCAL_AVG |                              | LOCAL_MAX                     |                 | CLOUD_AVG |
| if (tier === 'max') return LOCAL_MAX |                              | CLOUD_MAX                     |

throw new TypeError(`resolveModel: unknown tier "${tier}". Use 'min', 'avg', or 'max'.`)
}`|`{}`| BlockStatement |
| 71 |`ier === 'min')`|`true`| ConditionalExpression |
| 71 |`ier === 'min')`|`false`| ConditionalExpression |
| 71 |`ier === 'min')`|`tier !== 'min'`| EqualityOperator |
| 71 |`min')`|`""`| StringLiteral |
| 72 |`ier === 'avg')`|`true`| ConditionalExpression |
| 72 |`ier === 'avg')`|`false`| ConditionalExpression |
| 72 |`ier === 'avg')`|`tier !== 'avg'`| EqualityOperator |
| 72 |`avg')`|`""`| StringLiteral |
| 73 |`ier === 'max')`|`true`| ConditionalExpression |
| 73 |`ier === 'max')`|`false`| ConditionalExpression |
| 73 |`ier === 'max')`|`tier !== 'max'`| EqualityOperator |
| 73 |`max')`|`""`| StringLiteral |
| 73 |`OCAL_MAX || CLOUD_MAX`|`true`| ConditionalExpression |
| 73 |`OCAL_MAX || CLOUD_MAX`|`false`| ConditionalExpression |
| 73 |`OCAL_MAX || CLOUD_MAX`|`LOCAL_MAX && CLOUD_MAX` | LogicalOperator |

### npm/src/lib/omlx-trace.mjs

| Рядок | Оригінал                         | Заміна                            | Тип                   |
| ----- | -------------------------------- | --------------------------------- | --------------------- |
| 25    | `0 * 1024 * 1024`                | `50 * 1024 / 1024`                | ArithmeticOperator    |
| 25    | `0 * 1024 `                      | `50 / 1024`                       | ArithmeticOperator    |
| 28    | `'0', 'false', 'off', 'no'])`    | `[]`                              | ArrayDeclaration      |
| 28    | `0',`                            | `""`                              | StringLiteral         |
| 28    | `false',`                        | `""`                              | StringLiteral         |
| 28    | `off',`                          | `""`                              | StringLiteral         |
| 28    | `no']`                           | `""`                              | StringLiteral         |
| 38    | `verride !== undefined)`         | `true`                            | ConditionalExpression |
| 40    | `verride)`                       | `true`                            | ConditionalExpression |
| 55    | `?.content `                     | `m.content`                       | OptionalChaining      |
| 56    | `ontent.length > MAX_MSG_CHARS)` | `content.length >= MAX_MSG_CHARS` | EqualityOperator      |
| 60    | `?.role,`                        | `m.role`                          | OptionalChaining      |
| 62    | `sha256')`                       | `""`                              | StringLiteral         |
| 62    | `hex')`                          | `""`                              | StringLiteral         |
| 102   | `.reasoningSource ?? null,`      | `i.reasoningSource && null`       | LogicalOperator       |
| 103   | `.finishReason ?? null,`         | `i.finishReason && null`          | LogicalOperator       |
| 104   | `.usage ?? null,`                | `i.usage && null`                 | LogicalOperator       |

**Приклад тесту** (`npm/src/lib/omlx-trace.test.mjs`):

```js
it('should return null when N_CURSOR_LLM_TRACE is set to a kill value', () => {
  process.env.N_CURSOR_LLM_TRACE = 'off'
  expect(tracePath()).toBeNull()
})
```

### npm/src/lib/omlx.mjs

| Рядок | Оригінал                                     | Заміна                          | Тип              |
| ----- | -------------------------------------------- | ------------------------------- | ---------------- |
| 26    | `http://127.0.0.1:8000/v1/chat/completions'` | `""`                            | StringLiteral    |
| 41    | `.omlx',`                                    | `""`                            | StringLiteral    |
| 41    | `settings.json')`                            | `""`                            | StringLiteral    |
| 41    | `utf8')`                                     | `""`                            | StringLiteral    |
| 42    | `ettings?.auth?.api_key `                    | `settings?.auth.api_key`        | OptionalChaining |
| 42    | `ettings?.auth?`                             | `settings.auth`                 | OptionalChaining |
| 48    | `omlx/'`                                     | `""`                            | StringLiteral    |
| 51    | `2000, 8000]`                                | `[]`                            | ArrayDeclaration |
| 81    | `<think>([\s\S]*?)<\/think>/`                | `/<think>([\s\S])<\/think>/`    | Regex            |
| 81    | `<think>([\s\S]*?)<\/think>/`                | `/<think>([^\s\S]*?)<\/think>/` | Regex            |
| 81    | `<think>([\s\S]*?)<\/think>/`                | `/<think>([\S\S]*?)<\/think>/`  | Regex            |
| 81    | `<think>([\s\S]*?)<\/think>/`                | `/<think>([\s\s]*?)<\/think>/`  | Regex            |
| 95    | `essage?.reasoning_content`                  | `message.reasoning_content`     | OptionalChaining |
| 96    | `ield.trim())`                               | `field`                         | MethodExpression |
| 97    | `essage?.content `                           | `message.content`               | OptionalChaining |
| 99    | `[1].trim(),`                                | `m[1]`                          | MethodExpression |
| 100   | `ontent.trim())`                             | `content`                       | MethodExpression |

**Приклад тесту** (`npm/src/lib/omlx.test.mjs`):

```js
it('should return the explicit apiKey if provided', () => {
  expect(resolveOmlxApiKey('explicit_key')).toBe('explicit_key')
})
```

### npm/src/lib/pi-client.mjs

| Рядок                            | Оригінал            | Заміна           | Тип                   |
| -------------------------------- | ------------------- | ---------------- | --------------------- |
| 36                               | `ast.content        |
| .filter(c => c.type === 'text')` | `last.content`      | MethodExpression |
| 37                               | `.type === 'text')` | `true`           | ConditionalExpression |

**Приклад тесту** (`npm/src/lib/pi-client.test.mjs`):

```js
it('should call createAgentSession with correct parameters and return assistant content on success', async () => {
  const mockSession = {
    prompt: vi.fn().mockResolvedValue(undefined),
    state: {
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Hello' }]
        },
        {
          role: 'assistant',
          content: [{ type: 'text', text: 'World' }]
        }
      ],
      stopReason: null
    }
  }
  mockCreateAgentSession.mockResolvedValue({ session: mockSession })

  const prompt = 'What is the time?'
  const result = await callText(prompt)

  expect(mockCreateAgentSession).toHaveBeenCalledWith({
    tools: [],
    sessionManager: expect.any(Object), // Checks SessionManager.inMemory call internally
    cwd: expect.any(String) // Checks process.cwd() behavior when opts.cwd is missing
  })
  expect(mockSession.prompt).toHaveBeenCalledWith(prompt)
  expect(result).toBe('World')
})
```

### npm/src/run.mjs

| Рядок | Оригінал                                                                | Заміна                               | Тип                |
| ----- | ----------------------------------------------------------------------- | ------------------------------------ | ------------------ |
| 28    | `\n📁 ${dir}\n`)`                                                       | ````                                 | StringLiteral      |
| 32    | ` <= MAX_ITERATIONS;`                                                   | `i < MAX_ITERATIONS`                 | EqualityOperator   |
| 32    | `++)`                                                                   | `i--`                                | UpdateOperator     |
| 33    | `\n── Ітерація ${i}/${MAX_ITERATIONS}: coverage ──\n`)`                 | ````                                 | StringLiteral      |
| 37    | `⚠ Vitest coverage не повернула даних — перевір налаштування vitest.')` | `""`                                 | StringLiteral      |
| 42    | `llFiles.length - uncovered.length`                                     | `allFiles.length + uncovered.length` | ArithmeticOperator |
| 43    | `covered / allFiles.length) * 100)`                                     | `covered / allFiles.length / 100`    | ArithmeticOperator |
| 43    | `overed / allFiles.length)`                                             | `covered * allFiles.length`          | ArithmeticOperator |
| 45    | `\n✓ Покриття: ${pct}% файлів (${covered}/${allFiles.length})`)`        | ````                                 | StringLiteral      |
| 48    | `✓ Всі файли мають достатнє покриття — переходжу до мутантів.')`        | `""`                                 | StringLiteral      |
| 53    | `⚠ Покриття не покращилось після генерації тестів — зупиняю цикл.')`    | `""`                                 | StringLiteral      |
| 58    | `\n── Оцінюю ${uncovered.length} непокритих файлів (LLM) ──\n`)`        | ````                                 | StringLiteral      |
| 63    | `✓ LLM вирішила: жоден непокритий файл не потребує unit-тестів.')`      | `""`                                 | StringLiteral      |
| 67    | `\n→ Потребують тестів (${needsTests.length}):`)`                       | ````                                 | StringLiteral      |
| 68    | `                                                                       |

      console.log(`  • ${f.file} (${f.pct.toFixed(1)}%) — ${f.reason}`)
    }` | `{}` | BlockStatement |

| 69 | `  • ${f.file} (${f.pct.toFixed(1)}%) — ${f.reason}`)`| ```` | StringLiteral |
| 75 |`\n── Мутаційне тестування + автофікс ──\n')`|`""`| StringLiteral |
| 76 |`coverage',`|`""`| StringLiteral |
| 78 |`\n♻️ Повторний coverage після агента...\n')`|`""`| StringLiteral |
| 79 |`coverage',`|`""` | StringLiteral |

**Приклад тесту** (`npm/src/run.test.mjs`):

```js
it('should complete successfully when all files meet the coverage threshold', async () => {
  vi.mocked(measureCoveragePerFile).mockResolvedValue([
    { file: 'a.js', pct: 90.0 },
    { file: 'b.js', pct: 85.0 }
  ])
  vi.mocked(getUncoveredFiles).mockReturnValue([])

  const result = await runAutoTest(mockDir)

  expect(measureCoveragePerFile).toHaveBeenCalledWith(mockDir)
  expect(assessNeed).not.toHaveBeenCalled()
  expect(generateTests).not.toHaveBeenCalled()
  expect(withLock).toHaveBeenCalledTimes(2)
  expect(runCoverageSteps).toHaveBeenCalledWith({ fix: true, cwd: mockDir })
  expect(runCoverageSteps).toHaveBeenCalledWith({ fix: false, cwd: mockDir })
})
```

### npm/src/scripts/lib/read-n-cursor-config-lite.mjs

| Рядок | Оригінал                               | Заміна  | Тип                   |
| ----- | -------------------------------------- | ------- | --------------------- |
| 35    | `utf8')`                               | `""`    | StringLiteral         |
| 57    | `onfig.disableRules.includes(ruleId))` | `false` | ConditionalExpression |

**Приклад тесту** (`npm/src/scripts/lib/read-n-cursor-config-lite.test.mjs`):

```js
it('should return default configuration when config file does not exist', async () => {
  vi.mocked(existsSync).mockReturnValue(false)

  const config = await readNCursorConfigLite(MOCK_CWD)

  expect(config.exists).toBe(false)
  expect(config.rules).toEqual([])
  expect(config.disableRules).toEqual([])
  expect(vi.mocked(readFile)).not.toHaveBeenCalled()
})
```

### npm/src/scripts/utils/lock-cache-dir.mjs

| Рядок | Оригінал                            | Заміна          | Тип                   |
| ----- | ----------------------------------- | --------------- | --------------------- | --------- | --------------- |
| 28    | `git',`                             | `""`            | StringLiteral         |
| 28    | `'rev-parse', '--git-common-dir'],` | `[]`            | ArrayDeclaration      |
| 28    | `rev-parse',`                       | `""`            | StringLiteral         |
| 28    | `--git-common-dir']`                | `""`            | StringLiteral         |
| 28    | ` cwd, encoding: 'utf8' })`         | `{}`            | ObjectLiteral         |
| 28    | `utf8' `                            | `""`            | StringLiteral         |
| 29    | `.status === 0 && !r.error `        | `true`          | ConditionalExpression |
| 29    | `.status === 0 && !r.error `        | `r.status === 0 |                       | !r.error` | LogicalOperator |
| 29    | `.status === 0 `                    | `true`          | ConditionalExpression |

**Приклад тесту** (`npm/src/scripts/utils/lock-cache-dir.test.mjs`):

```js
it('should return per-checkout cache path when git command fails or is unavailable (no common directory)', () => {
  // Setup mock to simulate git failure (status 1)
  mockSpawnSync.mockReturnValue({ status: 1, stdout: '', error: new Error('Not a git repo') })

  // Test with default CWD (process.cwd())
  const resultDefaultCwd = resolveLockCacheDir(mockKey, { spawn: mockSpawnSync })
  expect(resultDefaultCwd).toBe(`${process.cwd()}/node_modules/.cache/n-cursor/${mockKey}`)

  // Test with specified CWD
  const resultSpecificCwd = resolveLockCacheDir(mockKey, {
    cwd: mockCwd,
    spawn: mockSpawnSync
  })
  expect(resultSpecificCwd).toBe(`${mockCwd}/node_modules/.cache/n-cursor/${mockKey}`)
})
```

### npm/src/scripts/utils/with-lock.mjs

| Рядок | Оригінал                                | Заміна                                 | Тип              |
| ----- | --------------------------------------- | -------------------------------------- | ---------------- |
| 53    | `ate.now() - result.finishedAt >= ttl)` | `Date.now() - result.finishedAt > ttl` | EqualityOperator |

**Приклад тесту** (`npm/src/scripts/utils/with-lock.test.mjs`):

```js
it('should return false if exitCode is not 0', () => {
  const result = { exitCode: 1, fingerprint: 'fp', finishedAt: Date.now() }
  expect(shouldDedup(result, 'fp', 1000)).toBe(false)
})
```

### npm/src/scripts/utils/worktree-fingerprint.mjs

| Рядок | Оригінал                                               | Заміна                       | Тип                   |
| ----- | ------------------------------------------------------ | ---------------------------- | --------------------- | --------------------------- | --------------- |
| 15    | `git',`                                                | `""`                         | StringLiteral         |
| 15    | ` encoding: 'utf8' })`                                 | `{}`                         | ObjectLiteral         |
| 15    | `utf8' `                                               | `""`                         | StringLiteral         |
| 16    | `.status !== 0                                         |                              | r.error)`             | `r.status !== 0 && r.error` | LogicalOperator |
| 16    | `.status !== 0 `                                       | `false`                      | ConditionalExpression |
| 16    | `git ${args[0]} failed`)`                              | ````                         | StringLiteral         |
| 21    | `it(['rev-parse', 'HEAD']).trim()`                     | `git(['rev-parse', 'HEAD'])` | MethodExpression      |
| 21    | `'rev-parse', 'HEAD'])`                                | `[]`                         | ArrayDeclaration      |
| 21    | `rev-parse',`                                          | `""`                         | StringLiteral         |
| 21    | `HEAD']`                                               | `""`                         | StringLiteral         |
| 22    | `'diff', 'HEAD'])`                                     | `[]`                         | ArrayDeclaration      |
| 22    | `diff',`                                               | `""`                         | StringLiteral         |
| 22    | `HEAD']`                                               | `""`                         | StringLiteral         |
| 25    | `'ls-files', '-z', '--others', '--exclude-standard'])` | `[]`                         | ArrayDeclaration      |
| 25    | `ls-files',`                                           | `""`                         | StringLiteral         |
| 25    | `-z',`                                                 | `""`                         | StringLiteral         |
| 25    | `--others',`                                           | `""`                         | StringLiteral         |
| 25    | `--exclude-standard']`                                 | `""`                         | StringLiteral         |
| 26    | `ntrackedRaw.split('\0').filter(Boolean)`              | `untrackedRaw.split('\0')`   | MethodExpression      |
| 26    | `\0')`                                                 | `""`                         | StringLiteral         |
| 27    | `=>`${f}:${git(['hash-object', f]).trim()}`)`          | `() => undefined`            | ArrowFunction         |
| 27    | `${f}:${git(['hash-object', f]).trim()}`)`             | ````                         | StringLiteral         |
| 27    | `it(['hash-object', f]).trim()}`                       | `git(['hash-object', f])`    | MethodExpression      |
| 27    | `'hash-object', f])`                                   | `[]`                         | ArrayDeclaration      |
| 27    | `hash-object',`                                        | `""`                         | StringLiteral         |
| 28    | `commitHash, diffText, ...pairs].`                     | `[]`                         | ArrayDeclaration      |
| 28    | `\n')`                                                 | `""`                         | StringLiteral         |

**Приклад тесту** (`npm/src/scripts/utils/worktree-fingerprint.test.mjs`):

```js
it('should return a valid SHA256 hash for a fully committed and tracked repository', async () => {
  // 1. Test for 'rev-parse HEAD'
  vi.mocked(spawnSync).mockReturnValueOnce({ status: 0, stdout: 'a1b2c3d4e5f67890a1b2c3d4e5f67890', error: null })

  // 2. Test for 'diff HEAD' (should return empty for clean repo)
  vi.mocked(spawnSync).mockReturnValueOnce({ status: 0, stdout: '', error: null })

  // 3. Test for 'ls-files -z --others --exclude-standard' (no untracked files)
  vi.mocked(spawnSync).mockReturnValueOnce({ status: 0, stdout: '', error: null })

  // For hash-object, we only need to mock it if there are files.
  // Since untrackedFiles is empty, this is skipped.

  const hash = worktreeFingerprint()
  expect(typeof hash).toBe('string')
  expect(hash.length).toBe(64)
})
```
