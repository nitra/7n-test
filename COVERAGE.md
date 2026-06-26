# Coverage

| Область | Рядки | Функції | Вбито мутацій | Score |
| --- | --- | --- | --- | --- |
| JS | 52.67% (1154/2191) | 40.58% (28/69) | 282/1655 | 17.04% |

## Вцілілі мутанти

```json
[
  {
    "file": "npm/src/assess-need.mjs",
    "mutants": [
      {
        "line": 37,
        "col": 58,
        "mutantType": "StringLiteral",
        "original": "--no-session',",
        "replacement": "\"\""
      },
      {
        "line": 36,
        "col": 50,
        "mutantType": "ArrayDeclaration",
        "original": "]",
        "replacement": "[\"Stryker was here\"]"
      },
      {
        "line": 37,
        "col": 84,
        "mutantType": "StringLiteral",
        "original": "text',",
        "replacement": "\"\""
      },
      {
        "line": 37,
        "col": 30,
        "mutantType": "StringLiteral",
        "original": "-p',",
        "replacement": "\"\""
      },
      {
        "line": 37,
        "col": 29,
        "mutantType": "ArrayDeclaration",
        "original": "'-p', prompt, ...modelArgs, '--no-session', '--mode', 'text', '--no-tools'],",
        "replacement": "[]"
      },
      {
        "line": 37,
        "col": 74,
        "mutantType": "StringLiteral",
        "original": "--mode',",
        "replacement": "\"\""
      },
      {
        "line": 37,
        "col": 92,
        "mutantType": "StringLiteral",
        "original": "--no-tools']",
        "replacement": "\"\""
      },
      {
        "line": 37,
        "col": 107,
        "mutantType": "ObjectLiteral",
        "original": "\n    encoding: 'utf8',\n    timeout: 60_000,\n    env\n  })",
        "replacement": "{}"
      },
      {
        "line": 38,
        "col": 15,
        "mutantType": "StringLiteral",
        "original": "utf8',",
        "replacement": "\"\""
      },
      {
        "line": 42,
        "col": 7,
        "mutantType": "ConditionalExpression",
        "original": ".error)",
        "replacement": "false"
      },
      {
        "line": 43,
        "col": 63,
        "mutantType": "LogicalOperator",
        "original": ".stderr?.slice(0, 200) ?? ''}",
        "replacement": "r.stderr?.slice(0, 200) && ''"
      },
      {
        "line": 43,
        "col": 63,
        "mutantType": "OptionalChaining",
        "original": ".stderr?.slice(",
        "replacement": "r.stderr.slice"
      },
      {
        "line": 43,
        "col": 63,
        "mutantType": "MethodExpression",
        "original": ".stderr?.slice(0, 200) ",
        "replacement": "r.stderr"
      },
      {
        "line": 44,
        "col": 10,
        "mutantType": "MethodExpression",
        "original": ".stdout?.trim() ",
        "replacement": "r.stdout"
      },
      {
        "line": 43,
        "col": 39,
        "mutantType": "StringLiteral",
        "original": "pi exit ${r.status}: ${r.stderr?.slice(0, 200) ?? ''}`)",
        "replacement": "``"
      },
      {
        "line": 44,
        "col": 10,
        "mutantType": "OptionalChaining",
        "original": ".stdout?.trim(",
        "replacement": "r.stdout.trim"
      },
      {
        "line": 57,
        "col": 7,
        "mutantType": "ConditionalExpression",
        "original": "ontent.length > MAX_CONTENT_BYTES)",
        "replacement": "true"
      },
      {
        "line": 61,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "## File: ${fileInfo.file} (current coverage: ${fileInfo.pct.toFixed(1)}%)\\n\\n` ",
        "replacement": "``"
      },
      {
        "line": 60,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "${SYSTEM_PROMPT}\\n\\n` ",
        "replacement": "``"
      },
      {
        "line": 57,
        "col": 7,
        "mutantType": "EqualityOperator",
        "original": "ontent.length > MAX_CONTENT_BYTES)",
        "replacement": "content.length <= MAX_CONTENT_BYTES"
      },
      {
        "line": 62,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "\\`\\`\\`\\n${content}\\n\\`\\`\\``",
        "replacement": "``"
      },
      {
        "line": 57,
        "col": 7,
        "mutantType": "ConditionalExpression",
        "original": "ontent.length > MAX_CONTENT_BYTES)",
        "replacement": "false"
      },
      {
        "line": 57,
        "col": 7,
        "mutantType": "EqualityOperator",
        "original": "ontent.length > MAX_CONTENT_BYTES)",
        "replacement": "content.length >= MAX_CONTENT_BYTES"
      },
      {
        "line": 66,
        "col": 30,
        "mutantType": "Regex",
        "original": "\\{[\\s\\S]*?\"needsTests\"[\\s\\S]*?\\}/)",
        "replacement": "/\\{[\\s\\s]*?\"needsTests\"[\\s\\S]*?\\}/"
      },
      {
        "line": 66,
        "col": 30,
        "mutantType": "Regex",
        "original": "\\{[\\s\\S]*?\"needsTests\"[\\s\\S]*?\\}/)",
        "replacement": "/\\{[^\\s\\S]*?\"needsTests\"[\\s\\S]*?\\}/"
      },
      {
        "line": 66,
        "col": 30,
        "mutantType": "Regex",
        "original": "\\{[\\s\\S]*?\"needsTests\"[\\s\\S]*?\\}/)",
        "replacement": "/\\{[\\S\\S]*?\"needsTests\"[\\s\\S]*?\\}/"
      },
      {
        "line": 67,
        "col": 31,
        "mutantType": "OptionalChaining",
        "original": "atch?.[0] ",
        "replacement": "match[0]"
      },
      {
        "line": 72,
        "col": 15,
        "mutantType": "ConditionalExpression",
        "original": "ypeof parsed.reason === 'string' ",
        "replacement": "true"
      },
      {
        "line": 12,
        "col": 15,
        "mutantType": "LogicalOperator",
        "original": "nv.N_CLOUD_MIN_MODEL ?? ''",
        "replacement": "env.N_CLOUD_MIN_MODEL && ''"
      },
      {
        "line": 14,
        "col": 23,
        "mutantType": "StringLiteral",
        "original": "You are a test-need classifier for JS/TS source files.\n\nGiven a source file with low test coverage, decide if unit tests are worthwhile.\n\nReply ONLY with a JSON object (no markdown fence):\n{\"needsTests\": true|false, \"reason\": \"one sentence in Ukrainian\"}\n\nneedsTests: false when:\n- File only contains types, interfaces, constants, or re-exports with no logic\n- Thin config or index file that just wires up other modules\n- Behavior is fully covered by integration/e2e tests (name them)\n\nneedsTests: true when:\n- File contains utility functions, parsers, transformers with branches\n- Business logic with conditions or non-trivial contracts\n- Pure functions that can be unit-tested cheaply`",
        "replacement": "``"
      },
      {
        "line": 12,
        "col": 40,
        "mutantType": "StringLiteral",
        "original": "'",
        "replacement": "\"Stryker was here!\""
      }
    ],
    "exampleTest": {
      "testFile": "npm/src/assess-need.test.mjs",
      "code": "  it('should return early if file does not exist', async () => {\n    mockFs.existsSync.mockReturnValue(false)\n    \n    const result = await assessNeed([fileInfo], projectDir)\n    \n    expect(mockFs.existsSync).toHaveBeenCalledWith('/mock/project/testfile.js')\n    expect(result[0].needsTests).toBe(false)\n    expect(result[0].reason).toBe('файл недоступний')\n  })"
    },
    "recommendationText": null
  },
  {
    "file": "npm/src/coverage-classify/apply.mjs",
    "mutants": [
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
      },
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
        "col": 25,
        "mutantType": "StringLiteral",
        "original": "git',",
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
        "mutantType": "LogicalOperator",
        "original": "data.entries || typeof data.entries !== 'object' ",
        "replacement": "!data.entries && typeof data.entries !== 'object'"
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
        "line": 88,
        "col": 25,
        "mutantType": "StringLiteral",
        "original": "${group.file}:${mutant.line}:${mutant.col}:${mutant.replacement}`",
        "replacement": "``"
      },
      {
        "line": 80,
        "col": 7,
        "mutantType": "ConditionalExpression",
        "original": "ache.model !== cacheModel)",
        "replacement": "false"
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
      },
      {
        "line": 25,
        "col": 11,
        "mutantType": "StringLiteral",
        "original": "LLM-classification unavailable, conservative fallback (treat as worth-testing)'",
        "replacement": "\"\""
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
        "col": 52,
        "mutantType": "StringLiteral",
        "original": "${basename(absPath, '.mjs')}.test.mjs`)",
        "replacement": "``"
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
        "line": 99,
        "col": 7,
        "mutantType": "BlockStatement",
        "original": "\n    const out = execFileSync('git', ['log', '-1', '--format=%ar', '--', absPath], {\n      cwd,\n      encoding: 'utf8',\n      stdio: ['ignore', 'pipe', 'ignore']\n    }).trim()\n    if (out) recentActivity = out\n  } ",
        "replacement": "{}"
      },
      {
        "line": 98,
        "col": 24,
        "mutantType": "StringLiteral",
        "original": "(no git history)'",
        "replacement": "\"\""
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
        "line": 102,
        "col": 17,
        "mutantType": "StringLiteral",
        "original": "utf8',",
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
      },
      {
        "line": 13,
        "col": 30,
        "mutantType": "StringLiteral",
        "original": "You are a mutation testing classifier.\n\nFor each survived Stryker mutant, classify it into exactly one verdict:\n\n- **worth-testing**: pure logic with real branches that should be tested. The mutant\n  exposes a missing assertion in a unit test. Recommend a test approach.\n- **equivalent**: the mutated code is behaviorally indistinguishable from the original\n  (e.g., both branches produce the same observable output, or the mutant lies on dead\n  code). You MUST cite a concrete reason referencing input flow or output equivalence.\n- **defensive**: the branch guards against an impossible state given input contracts\n  or type system. You MUST identify the invariant that makes the state unreachable.\n- **glue**: thin CLI entrypoint, factory, or boilerplate (e.g., runStandardRule\n  wrapper, fix.mjs stubs). Integration tests via subprocess cover the behavior.\n  Name the integration test or pattern.\n- **wrapper**: thin shell around an external tool (spawnSync, fetch, dynamic import).\n  The wrapper has no logic worth unit-testing in isolation; behavior comes from the\n  wrapped tool. Name the integration test or pattern.\n\nOutput ONLY a single JSON object matching this schema:\n\n\\`\\`\\`\n{\n  \"verdict\": \"worth-testing\" | \"equivalent\" | \"defensive\" | \"glue\" | \"wrapper\",\n  \"confidence\": number 0-1,\n  \"reason\": string (20-500 chars; concrete code-level reference, not \"seems like\"),\n  \"suggestedTest\": string (max 300 chars; required only when verdict is worth-testing)\n}\n\\`\\`\\`\n\nConfidence guidance:\n- 0.9+: cite specific code fragment, identifier, or input contract proving the verdict.\n- 0.7-0.9: strong inference from visible code structure.\n- <0.7: ambiguity, lacking context, or unfamiliar pattern. Be honest.\n\nNever invent integration test names. If you cannot identify a covering test, use\nworth-testing with low confidence instead of glue/wrapper.\n`",
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
      },
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
        "col": 72,
        "mutantType": "StringLiteral",
        "original": "wrapper']",
        "replacement": "\"\""
      },
      {
        "line": 15,
        "col": 64,
        "mutantType": "StringLiteral",
        "original": "glue',",
        "replacement": "\"\""
      }
    ],
    "exampleTest": null,
    "recommendationText": null
  },
  {
    "file": "npm/src/coverage-fix.mjs",
    "mutants": [
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
        "line": 73,
        "col": 28,
        "mutantType": "StringLiteral",
        "original": "\\n')",
        "replacement": "\"\""
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
        "line": 80,
        "col": 38,
        "mutantType": "ArithmeticOperator",
        "original": ".line - 4)",
        "replacement": "m.line + 4"
      },
      {
        "line": 80,
        "col": 26,
        "mutantType": "MethodExpression",
        "original": "ath.max(0, m.line - 4)",
        "replacement": "Math.min(0, m.line - 4)"
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
        "line": 81,
        "col": 24,
        "mutantType": "MethodExpression",
        "original": "ath.min(srcLines.length, m.line + 3)",
        "replacement": "Math.max(srcLines.length, m.line + 3)"
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
        "col": 16,
        "mutantType": "ArrowFunction",
        "original": "l, i) => `${ctxStart + i + 1}: ${l}`)",
        "replacement": "() => undefined"
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
        "line": 86,
        "col": 16,
        "mutantType": "MethodExpression",
        "original": "\n          `  - Рядок ${m.line}, колонка ${m.col}, тип мутації \\`${m.mutantType}\\``,\n          `    Оригінал: \\`${m.original}\\``,\n          `    Вижив варіант: \\`${m.replacement}\\``,\n          context ? `    Контекст:\\n\\`\\`\\`\\n${context}\\n\\`\\`\\`` : ''\n        ]\n          .filter(Boolean)",
        "replacement": "[`  - Рядок ${m.line}, колонка ${m.col}, тип мутації \\`${m.mutantType}\\``, `    Оригінал: \\`${m.original}\\``, `    Вижив варіант: \\`${m.replacement}\\``, context ? `    Контекст:\\n\\`\\`\\`\\n${context}\\n\\`\\`\\`` : '']"
      },
      {
        "line": 85,
        "col": 17,
        "mutantType": "StringLiteral",
        "original": "\\n')",
        "replacement": "\"\""
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
      },
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
      }
    ],
    "exampleTest": {
      "testFile": "npm/src/coverage-fix.test.mjs",
      "code": "    it('logs and returns early when survived is empty', async () => {\n      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})\n      await fixSurvivedMutants([], ROOT)\n      expect(logSpy).toHaveBeenCalledWith('✓ Всі мутанти вбиті — доповнення тестів не потрібне')\n      expect(vi.mocked(spawnSync)).not.toHaveBeenCalled()\n      logSpy.mockRestore()\n    })"
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
        "col": 41,
        "mutantType": "StringLiteral",
        "original": "')",
        "replacement": "\"Stryker was here!\""
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
        "col": 16,
        "mutantType": "EqualityOperator",
        "original": "astSlash === -1 ",
        "replacement": "lastSlash !== -1"
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
        "col": 15,
        "mutantType": "ConditionalExpression",
        "original": "astSlash === -1 ",
        "replacement": "false"
      },
      {
        "line": 19,
        "col": 29,
        "mutantType": "UnaryOperator",
        "original": "1 ",
        "replacement": "+1"
      },
      {
        "line": 18,
        "col": 53,
        "mutantType": "ArithmeticOperator",
        "original": "astSlash + 1)",
        "replacement": "lastSlash - 1"
      },
      {
        "line": 20,
        "col": 10,
        "mutantType": "ArrayDeclaration",
        "original": "\n    `${base}.test.mjs`,\n    `${base}.test.js`,\n    `${base}.test.ts`,\n    ...(dir ? [`${dir}/tests/${name}.test.mjs`, `${dir}/tests/${name}.test.js`] : [])\n  ]",
        "replacement": "[]"
      },
      {
        "line": 19,
        "col": 39,
        "mutantType": "MethodExpression",
        "original": "ase.slice(0, lastSlash)",
        "replacement": "base"
      },
      {
        "line": 19,
        "col": 15,
        "mutantType": "ConditionalExpression",
        "original": "astSlash === -1 ",
        "replacement": "true"
      },
      {
        "line": 22,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "${base}.test.js`,",
        "replacement": "``"
      },
      {
        "line": 21,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "${base}.test.mjs`,",
        "replacement": "``"
      },
      {
        "line": 24,
        "col": 49,
        "mutantType": "StringLiteral",
        "original": "${dir}/tests/${name}.test.js`]",
        "replacement": "``"
      },
      {
        "line": 24,
        "col": 16,
        "mutantType": "StringLiteral",
        "original": "${dir}/tests/${name}.test.mjs`,",
        "replacement": "``"
      },
      {
        "line": 23,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "${base}.test.ts`,",
        "replacement": "``"
      },
      {
        "line": 35,
        "col": 20,
        "mutantType": "ArrayDeclaration",
        "original": "]",
        "replacement": "[\"Stryker was here\"]"
      },
      {
        "line": 24,
        "col": 15,
        "mutantType": "ArrayDeclaration",
        "original": "`${dir}/tests/${name}.test.mjs`, `${dir}/tests/${name}.test.js`] ",
        "replacement": "[]"
      },
      {
        "line": 38,
        "col": 19,
        "mutantType": "StringLiteral",
        "original": "'",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 39,
        "col": 9,
        "mutantType": "ConditionalExpression",
        "original": "xistsSync(absPath))",
        "replacement": "false"
      },
      {
        "line": 40,
        "col": 39,
        "mutantType": "StringLiteral",
        "original": "utf8')",
        "replacement": "\"\""
      },
      {
        "line": 41,
        "col": 11,
        "mutantType": "EqualityOperator",
        "original": "ontent.length > MAX_SRC_BYTES)",
        "replacement": "content.length >= MAX_SRC_BYTES"
      },
      {
        "line": 41,
        "col": 11,
        "mutantType": "ConditionalExpression",
        "original": "ontent.length > MAX_SRC_BYTES)",
        "replacement": "false"
      },
      {
        "line": 45,
        "col": 31,
        "mutantType": "StringLiteral",
        "original": "'",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 41,
        "col": 11,
        "mutantType": "EqualityOperator",
        "original": "ontent.length > MAX_SRC_BYTES)",
        "replacement": "content.length <= MAX_SRC_BYTES"
      },
      {
        "line": 39,
        "col": 30,
        "mutantType": "BlockStatement",
        "original": "\n      content = readFileSync(absPath, 'utf8')\n      if (content.length > MAX_SRC_BYTES) content = content.slice(0, MAX_SRC_BYTES) + '\\n...(truncated)'\n    }",
        "replacement": "{}"
      },
      {
        "line": 44,
        "col": 52,
        "mutantType": "ArrowFunction",
        "original": " => existsSync(join(dir, c)))",
        "replacement": "() => undefined"
      },
      {
        "line": 47,
        "col": 65,
        "mutantType": "StringLiteral",
        "original": "utf8')",
        "replacement": "\"\""
      },
      {
        "line": 46,
        "col": 23,
        "mutantType": "BlockStatement",
        "original": "\n      const testContent = readFileSync(join(dir, existingTest), 'utf8')\n      existingTestSection = `\\n\\nІснуючий тест-файл (\\`${existingTest}\\`):\\n\\`\\`\\`js\\n${testContent.slice(0, 2000)}\\n\\`\\`\\``\n    }",
        "replacement": "{}"
      },
      {
        "line": 48,
        "col": 29,
        "mutantType": "StringLiteral",
        "original": "\\n\\nІснуючий тест-файл (\\`${existingTest}\\`):\\n\\`\\`\\`js\\n${testContent.slice(0, 2000)}\\n\\`\\`\\``",
        "replacement": "``"
      },
      {
        "line": 48,
        "col": 89,
        "mutantType": "MethodExpression",
        "original": "estContent.slice(0, 2000)}",
        "replacement": "testContent"
      },
      {
        "line": 41,
        "col": 11,
        "mutantType": "ConditionalExpression",
        "original": "ontent.length > MAX_SRC_BYTES)",
        "replacement": "true"
      },
      {
        "line": 46,
        "col": 9,
        "mutantType": "ConditionalExpression",
        "original": "xistingTest)",
        "replacement": "false"
      },
      {
        "line": 53,
        "col": 46,
        "mutantType": "StringLiteral",
        "original": "')",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 54,
        "col": 20,
        "mutantType": "StringLiteral",
        "original": "\\`\\`\\`js\\n${content}\\n\\`\\`\\`` ",
        "replacement": "``"
      },
      {
        "line": 54,
        "col": 53,
        "mutantType": "StringLiteral",
        "original": "(вміст недоступний)')",
        "replacement": "\"\""
      },
      {
        "line": 61,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "',",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 60,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "ДІЯ: Негайно напиши unit-тести для кожного з наступних файлів. Без запитань, без підтверджень — одразу пиши файли.',",
        "replacement": "\"\""
      },
      {
        "line": 62,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "Для кожного файлу: створи або відредагуй відповідний `*.test.mjs` поруч із джерелом,',",
        "replacement": "\"\""
      },
      {
        "line": 65,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "## Файли для покриття',",
        "replacement": "\"\""
      },
      {
        "line": 64,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "',",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 63,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "напиши тести що покривають основну логіку, гілки та граничні випадки.',",
        "replacement": "\"\""
      },
      {
        "line": 66,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "',",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 68,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "',",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 69,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "## Обовʼязкові правила (дотримуйся СУВОРО)',",
        "replacement": "\"\""
      },
      {
        "line": 70,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "- НЕ змінюй source-файли — лише test-файли (`*.test.mjs`).',",
        "replacement": "\"\""
      },
      {
        "line": 75,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "- Якщо файл лише re-export або типи — пропусти і продовж до наступного.'",
        "replacement": "\"\""
      },
      {
        "line": 74,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "- Не питай підтвердження — пиши всі файли підряд самостійно.',",
        "replacement": "\"\""
      },
      {
        "line": 73,
        "col": 5,
        "mutantType": "StringLiteral",
        "original": "- Після кожного файлу виконай `bun test <шлях-до-тесту>` і переконайся що 0 fail.',",
        "replacement": "\"\""
      },
      {
        "line": 76,
        "col": 10,
        "mutantType": "StringLiteral",
        "original": "\\n')",
        "replacement": "\"\""
      },
      {
        "line": 101,
        "col": 50,
        "mutantType": "ArrayDeclaration",
        "original": "]",
        "replacement": "[\"Stryker was here\"]"
      },
      {
        "line": 89,
        "col": 15,
        "mutantType": "StringLiteral",
        "original": "\\n🤖 Генерую тести для ${files.length} файлів через pi агента...\\n`)",
        "replacement": "``"
      },
      {
        "line": 102,
        "col": 48,
        "mutantType": "StringLiteral",
        "original": "--no-session']",
        "replacement": "\"\""
      },
      {
        "line": 104,
        "col": 12,
        "mutantType": "StringLiteral",
        "original": "inherit',",
        "replacement": "\"\""
      },
      {
        "line": 12,
        "col": 15,
        "mutantType": "LogicalOperator",
        "original": "nv.N_CURSOR_COVERAGE_FIX_MODEL ?? env.N_CLOUD_MAX_MODEL ?? ''",
        "replacement": "(env.N_CURSOR_COVERAGE_FIX_MODEL ?? env.N_CLOUD_MAX_MODEL) && ''"
      },
      {
        "line": 12,
        "col": 15,
        "mutantType": "LogicalOperator",
        "original": "nv.N_CURSOR_COVERAGE_FIX_MODEL ?? env.N_CLOUD_MAX_MODEL ",
        "replacement": "env.N_CURSOR_COVERAGE_FIX_MODEL && env.N_CLOUD_MAX_MODEL"
      },
      {
        "line": 12,
        "col": 75,
        "mutantType": "StringLiteral",
        "original": "'",
        "replacement": "\"Stryker was here!\""
      }
    ],
    "exampleTest": {
      "testFile": "npm/src/gen-tests.test.mjs",
      "code": "    it('includes file sections', () => {\n      const prompt = buildGenTestsPrompt(mockFiles, mockDir)\n      expect(prompt).toContain('### `src/a.js` (покриття: 50.0%)')\n      expect(prompt).toContain('Причина: Low coverage')\n      expect(prompt).toContain('### `src/b.js` (покриття: 10.0%)')\n    })"
    },
    "recommendationText": null
  },
  {
    "file": "npm/src/lib/llm.mjs",
    "mutants": [
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
    "exampleTest": null,
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
        "col": 51,
        "mutantType": "StringLiteral",
        "original": "'",
        "replacement": "\"Stryker was here!\""
      },
      {
        "line": 45,
        "col": 26,
        "mutantType": "LogicalOperator",
        "original": "nv.N_LOCAL_AVG_MODEL ?? ''",
        "replacement": "env.N_LOCAL_AVG_MODEL && ''"
      },
      {
        "line": 48,
        "col": 26,
        "mutantType": "LogicalOperator",
        "original": "nv.N_LOCAL_MAX_MODEL ?? ''",
        "replacement": "env.N_LOCAL_MAX_MODEL && ''"
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
        "line": 48,
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
        "line": 70,
        "col": 36,
        "mutantType": "BlockStatement",
        "original": "\n  if (tier === 'min') return LOCAL_MIN || LOCAL_AVG || LOCAL_MAX || CLOUD_MIN\n  if (tier === 'avg') return LOCAL_AVG || LOCAL_MAX || CLOUD_AVG\n  if (tier === 'max') return LOCAL_MAX || CLOUD_MAX\n  throw new TypeError(`resolveModel: unknown tier \"${tier}\". Use 'min', 'avg', or 'max'.`)\n}",
        "replacement": "{}"
      },
      {
        "line": 59,
        "col": 51,
        "mutantType": "StringLiteral",
        "original": "'",
        "replacement": "\"Stryker was here!\""
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
        "line": 28,
        "col": 29,
        "mutantType": "ArrayDeclaration",
        "original": "'0', 'false', 'off', 'no'])",
        "replacement": "[]"
      },
      {
        "line": 25,
        "col": 29,
        "mutantType": "ArithmeticOperator",
        "original": "0 * 1024 ",
        "replacement": "50 / 1024"
      },
      {
        "line": 25,
        "col": 29,
        "mutantType": "ArithmeticOperator",
        "original": "0 * 1024 * 1024",
        "replacement": "50 * 1024 / 1024"
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
        "col": 51,
        "mutantType": "StringLiteral",
        "original": "no']",
        "replacement": "\"\""
      }
    ],
    "exampleTest": null,
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
        "line": 48,
        "col": 21,
        "mutantType": "StringLiteral",
        "original": "omlx/'",
        "replacement": "\"\""
      },
      {
        "line": 81,
        "col": 22,
        "mutantType": "Regex",
        "original": "<think>([\\s\\S]*?)<\\/think>/",
        "replacement": "/<think>([\\s\\S])<\\/think>/"
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
      }
    ],
    "exampleTest": null,
    "recommendationText": null
  },
  {
    "file": "npm/src/coverage-per-file.mjs",
    "mutants": [
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
        "line": 64,
        "col": 26,
        "mutantType": "StringLiteral",
        "original": "inherit',",
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
        "replacement": "/\\.(test|spec)\\.[^.]+|[/\\\\]tests?[/\\\\]/"
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
        "replacement": "/\\.(test|spec)\\.[.]+$|[/\\\\]tests?[/\\\\]/"
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
      }
    ],
    "exampleTest": {
      "testFile": "npm/src/coverage-per-file.test.mjs",
      "code": "    it('returns per-file data from lcov.info', async () => {\n      vi.mocked(mkdtemp).mockResolvedValue('/tmp/7n-cov-xxx')\n      vi.mocked(existsSync).mockReturnValue(true)\n      vi.mocked(readFileSync).mockReturnValue(SAMPLE_LCOV)\n      vi.mocked(rm).mockResolvedValue(undefined)\n\n      const result = await measureCoveragePerFile('/proj')\n\n      expect(vi.mocked(spawnSync)).toHaveBeenCalledWith(\n        'bunx',\n        expect.arrayContaining(['vitest', 'run', '--coverage', '--coverage.reporter=lcov']),\n        expect.objectContaining({ cwd: '/proj' })\n      )\n      expect(result).toHaveLength(2)\n      expect(result[0].pct).toBe(80)\n      expect(result[1].pct).toBe(0)\n    })"
    },
    "recommendationText": null
  }
]
```

### npm/src/assess-need.mjs

| Рядок | Оригінал | Заміна | Тип |
| --- | --- | --- | --- |
| 37 | `--no-session',` | `""` | StringLiteral |
| 36 | `]` | `["Stryker was here"]` | ArrayDeclaration |
| 37 | `text',` | `""` | StringLiteral |
| 37 | `-p',` | `""` | StringLiteral |
| 37 | `'-p', prompt, ...modelArgs, '--no-session', '--mode', 'text', '--no-tools'],` | `[]` | ArrayDeclaration |
| 37 | `--mode',` | `""` | StringLiteral |
| 37 | `--no-tools']` | `""` | StringLiteral |
| 37 | `
    encoding: 'utf8',
    timeout: 60_000,
    env
  })` | `{}` | ObjectLiteral |
| 38 | `utf8',` | `""` | StringLiteral |
| 42 | `.error)` | `false` | ConditionalExpression |
| 43 | `.stderr?.slice(0, 200) ?? ''}` | `r.stderr?.slice(0, 200) && ''` | LogicalOperator |
| 43 | `.stderr?.slice(` | `r.stderr.slice` | OptionalChaining |
| 43 | `.stderr?.slice(0, 200) ` | `r.stderr` | MethodExpression |
| 44 | `.stdout?.trim() ` | `r.stdout` | MethodExpression |
| 43 | `pi exit ${r.status}: ${r.stderr?.slice(0, 200) ?? ''}`)` | ```` | StringLiteral |
| 44 | `.stdout?.trim(` | `r.stdout.trim` | OptionalChaining |
| 57 | `ontent.length > MAX_CONTENT_BYTES)` | `true` | ConditionalExpression |
| 61 | `## File: ${fileInfo.file} (current coverage: ${fileInfo.pct.toFixed(1)}%)\n\n` ` | ```` | StringLiteral |
| 60 | `${SYSTEM_PROMPT}\n\n` ` | ```` | StringLiteral |
| 57 | `ontent.length > MAX_CONTENT_BYTES)` | `content.length <= MAX_CONTENT_BYTES` | EqualityOperator |
| 62 | `\`\`\`\n${content}\n\`\`\``` | ```` | StringLiteral |
| 57 | `ontent.length > MAX_CONTENT_BYTES)` | `false` | ConditionalExpression |
| 57 | `ontent.length > MAX_CONTENT_BYTES)` | `content.length >= MAX_CONTENT_BYTES` | EqualityOperator |
| 66 | `\{[\s\S]*?"needsTests"[\s\S]*?\}/)` | `/\{[\s\s]*?"needsTests"[\s\S]*?\}/` | Regex |
| 66 | `\{[\s\S]*?"needsTests"[\s\S]*?\}/)` | `/\{[^\s\S]*?"needsTests"[\s\S]*?\}/` | Regex |
| 66 | `\{[\s\S]*?"needsTests"[\s\S]*?\}/)` | `/\{[\S\S]*?"needsTests"[\s\S]*?\}/` | Regex |
| 67 | `atch?.[0] ` | `match[0]` | OptionalChaining |
| 72 | `ypeof parsed.reason === 'string' ` | `true` | ConditionalExpression |
| 12 | `nv.N_CLOUD_MIN_MODEL ?? ''` | `env.N_CLOUD_MIN_MODEL && ''` | LogicalOperator |
| 14 | `You are a test-need classifier for JS/TS source files.

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
- Pure functions that can be unit-tested cheaply`` | ```` | StringLiteral |
| 12 | `'` | `"Stryker was here!"` | StringLiteral |

**Приклад тесту** (`npm/src/assess-need.test.mjs`):

```js
  it('should return early if file does not exist', async () => {
    mockFs.existsSync.mockReturnValue(false)
    
    const result = await assessNeed([fileInfo], projectDir)
    
    expect(mockFs.existsSync).toHaveBeenCalledWith('/mock/project/testfile.js')
    expect(result[0].needsTests).toBe(false)
    expect(result[0].reason).toBe('файл недоступний')
  })
```

### npm/src/coverage-classify/apply.mjs

| Рядок | Оригінал | Заміна | Тип |
| --- | --- | --- | --- |
| 19 | `erdict.confidence >= threshold` | `verdict.confidence > threshold` | EqualityOperator |
| 48 | ` file: group.file, mutant, verdict })` | `{}` | ObjectLiteral |
| 10 | `defensive',` | `""` | StringLiteral |
| 10 | `glue',` | `""` | StringLiteral |
| 10 | `wrapper']` | `""` | StringLiteral |

**Приклад тесту** (`npm/src/coverage-classify/apply.test.mjs`):

```js
  it("should mark equivalent mutants as allowed gaps if confidence >= threshold", () => {
    const result = applyVerdicts(mockRows, mockVerdicts, 0.8)
    expect(result.allowedGaps).toHaveLength(1)
    expect(result.rows[0].mutation.total).toBe(9)
    expect(result.rows[0].survived).toHaveLength(0)
  })
```

### npm/src/coverage-classify/cache.mjs

| Рядок | Оригінал | Заміна | Тип |
| --- | --- | --- | --- |
| 29 | `'hash-object', filePath],` | `[]` | ArrayDeclaration |
| 29 | `hash-object',` | `""` | StringLiteral |
| 29 | `git',` | `""` | StringLiteral |
| 29 | ` encoding: 'utf8' })` | `{}` | ObjectLiteral |
| 29 | `utf8' ` | `""` | StringLiteral |
| 44 | `blobHash)` | `true` | ConditionalExpression |
| 57 | `existsSync(cachePath))` | `false` | ConditionalExpression |
| 59 | `utf8')` | `""` | StringLiteral |
| 60 | `ata?.version ` | `data.version` | OptionalChaining |
| 61 | `data.entries || typeof data.entries !== 'object' || Array.isArray(data.entries))` | `false` | ConditionalExpression |
| 61 | `data.entries || typeof data.entries !== 'object' || Array.isArray(data.entries))` | `(!data.entries || typeof data.entries !== 'object') && Array.isArray(data.entries)` | LogicalOperator |
| 61 | `data.entries || typeof data.entries !== 'object' ` | `!data.entries && typeof data.entries !== 'object'` | LogicalOperator |
| 61 | `data.entries || typeof data.entries !== 'object' ` | `false` | ConditionalExpression |
| 61 | `ypeof data.entries !== 'object' ` | `false` | ConditionalExpression |

**Приклад тесту** (`npm/src/coverage-classify/cache.test.mjs`):

```js
    it('uses git hash-object when available', () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(execFileSync).mockReturnValue('abc123\n')
      expect(deriveBlobHash(FILE)).toBe('abc123')
    })
```

### npm/src/coverage-classify/index.mjs

| Рядок | Оригінал | Заміна | Тип |
| --- | --- | --- | --- |
| 48 | `${SYSTEM_PROMPT}\n\n${buildUserPrompt({ ...mutant, file: group.file }, cwd)}`` | ```` | StringLiteral |
| 49 | `${group.file}:${mutant.line}:${mutant.col}`` | ```` | StringLiteral |
| 53 | `min')` | `""` | StringLiteral |
| 61 | `⚠ coverage classify: ${loc} both tiers failed: ${error.message}`)` | ```` | StringLiteral |
| 75 | `pts.cachePath ?? join(cwd, 'npm/reports/coverage-classify.cache.json')` | `opts.cachePath && join(cwd, 'npm/reports/coverage-classify.cache.json')` | LogicalOperator |
| 75 | `npm/reports/coverage-classify.cache.json')` | `""` | StringLiteral |
| 77 | `min')` | `""` | StringLiteral |
| 88 | `${group.file}:${mutant.line}:${mutant.col}:${mutant.replacement}`` | ```` | StringLiteral |
| 80 | `ache.model !== cacheModel)` | `false` | ConditionalExpression |
| 103 | `acheKey)` | `true` | ConditionalExpression |
| 103 | `acheKey)` | `false` | ConditionalExpression |
| 103 | `
          cache.entries[cacheKey] = { ...verdict, classifiedAt: new Date().toISOString() }
        }` | `{}` | BlockStatement |
| 25 | `LLM-classification unavailable, conservative fallback (treat as worth-testing)'` | `""` | StringLiteral |

**Приклад тесту** (`npm/src/coverage-classify/index.test.mjs`):

```js
  it("should use cached verdict if available", async () => {
    const cachedVerdict = { verdict: "ok", confidence: 1.0, reason: "Cached" }
    vi.mocked(readCache).mockReturnValue({ version: 1, model: "mock_model+cloud", entries: { "mock_key": { verdict: "ok", confidence: 1.0, reason: "Cached" } } })
    
    const results = await classify(mockSurvived, mockCwd)
    
    expect(vi.mocked(deriveCacheKey)).toHaveBeenCalled()
    expect(results[0].verdict.verdict).toBe("ok")
  })
```

### npm/src/coverage-classify/prompt.mjs

| Рядок | Оригінал | Заміна | Тип |
| --- | --- | --- | --- |
| 70 | `
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
| 86 | `${basename(absPath, '.mjs')}.test.mjs`)` | ```` | StringLiteral |
| 86 | `tests',` | `""` | StringLiteral |
| 86 | `.mjs')` | `""` | StringLiteral |
| 87 | `(no test file)'` | `""` | StringLiteral |
| 88 | `xistsSync(testPath))` | `false` | ConditionalExpression |
| 99 | `
    const out = execFileSync('git', ['log', '-1', '--format=%ar', '--', absPath], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()
    if (out) recentActivity = out
  } ` | `{}` | BlockStatement |
| 98 | `(no git history)'` | `""` | StringLiteral |
| 100 | `xecFileSync('git', ['log', '-1', '--format=%ar', '--', absPath], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()` | `execFileSync('git', ['log', '-1', '--format=%ar', '--', absPath], {
  cwd,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'ignore']
})` | MethodExpression |
| 100 | `git',` | `""` | StringLiteral |
| 100 | `'log', '-1', '--format=%ar', '--', absPath],` | `[]` | ArrayDeclaration |
| 100 | `log',` | `""` | StringLiteral |
| 100 | `-1',` | `""` | StringLiteral |
| 100 | `--format=%ar',` | `""` | StringLiteral |
| 100 | `--',` | `""` | StringLiteral |
| 102 | `utf8',` | `""` | StringLiteral |
| 100 | `
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    })` | `{}` | ObjectLiteral |
| 103 | `'ignore', 'pipe', 'ignore']` | `[]` | ArrayDeclaration |
| 103 | `ignore',` | `""` | StringLiteral |
| 103 | `pipe',` | `""` | StringLiteral |
| 103 | `ignore']` | `""` | StringLiteral |
| 110 | `# Mutant
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
| 13 | `You are a mutation testing classifier.

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
`` | ```` | StringLiteral |

### npm/src/coverage-classify/verdict-schema.mjs

| Рядок | Оригінал | Заміна | Тип |
| --- | --- | --- | --- |
| 28 | `{')` | `""` | StringLiteral |
| 29 | `}')` | `""` | StringLiteral |
| 30 | `sonStart === -1 || jsonEnd === -1)` | `false` | ConditionalExpression |
| 30 | `sonStart === -1 || jsonEnd === -1)` | `jsonStart === -1 && jsonEnd === -1` | LogicalOperator |
| 30 | `sonStart === -1 ` | `false` | ConditionalExpression |
| 30 | `1 ` | `+1` | UnaryOperator |
| 30 | `sonEnd === -1)` | `false` | ConditionalExpression |
| 30 | `1)` | `+1` | UnaryOperator |
| 33 | `awText.slice(jsonStart, jsonEnd + 1))` | `rawText` | MethodExpression |
| 14 | `
  verdict: z.enum(['worth-testing', 'equivalent', 'defensive', 'glue', 'wrapper']),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(20).max(500),
  suggestedTest: z.string().max(300).optional()
})` | `{}` | ObjectLiteral |
| 15 | `equivalent',` | `""` | StringLiteral |
| 15 | `defensive',` | `""` | StringLiteral |
| 15 | `wrapper']` | `""` | StringLiteral |
| 15 | `glue',` | `""` | StringLiteral |

### npm/src/coverage-fix.mjs

| Рядок | Оригінал | Заміна | Тип |
| --- | --- | --- | --- |
| 31 | `s, g) => s + g.mutants.length,` | `() => undefined` | ArrowFunction |
| 31 | ` + g.mutants.length,` | `s - g.mutants.length` | ArithmeticOperator |
| 38 | `\n🤖 coverage --fix: запускаю агента для ${totalMutants} вцілілих мутантів...\n`)` | ```` | StringLiteral |
| 51 | `]` | `["Stryker was here"]` | ArrayDeclaration |
| 67 | `]` | `["Stryker was here"]` | ArrayDeclaration |
| 70 | `]` | `["Stryker was here"]` | ArrayDeclaration |
| 73 | `\n')` | `""` | StringLiteral |
| 71 | `
      const src = await readFile(join(projectRoot, file), 'utf8')
      srcLines = src.split('\n')
    } ` | `{}` | BlockStatement |
| 72 | `utf8')` | `""` | StringLiteral |
| 80 | `.line - 4)` | `m.line + 4` | ArithmeticOperator |
| 80 | `ath.max(0, m.line - 4)` | `Math.min(0, m.line - 4)` | MethodExpression |
| 81 | `.line + 3)` | `m.line - 3` | ArithmeticOperator |
| 82 | `rcLines
          .slice(ctxStart, ctxEnd)` | `srcLines` | MethodExpression |
| 81 | `ath.min(srcLines.length, m.line + 3)` | `Math.max(srcLines.length, m.line + 3)` | MethodExpression |
| 84 | `${ctxStart + i + 1}: ${l}`)` | ```` | StringLiteral |
| 84 | `l, i) => `${ctxStart + i + 1}: ${l}`)` | `() => undefined` | ArrowFunction |
| 84 | `txStart + i + 1}` | `ctxStart + i - 1` | ArithmeticOperator |
| 84 | `txStart + i ` | `ctxStart - i` | ArithmeticOperator |
| 86 | `
          `  - Рядок ${m.line}, колонка ${m.col}, тип мутації \`${m.mutantType}\``,
          `    Оригінал: \`${m.original}\``,
          `    Вижив варіант: \`${m.replacement}\``,
          context ? `    Контекст:\n\`\`\`\n${context}\n\`\`\`` : ''
        ]
          .filter(Boolean)` | `[`  - Рядок ${m.line}, колонка ${m.col}, тип мутації \`${m.mutantType}\``, `    Оригінал: \`${m.original}\``, `    Вижив варіант: \`${m.replacement}\``, context ? `    Контекст:\n\`\`\`\n${context}\n\`\`\`` : '']` | MethodExpression |
| 85 | `\n')` | `""` | StringLiteral |
| 90 | `    Контекст:\n\`\`\`\n${context}\n\`\`\`` ` | ```` | StringLiteral |
| 90 | `'` | `"Stryker was here!"` | StringLiteral |
| 93 | `\n')` | `""` | StringLiteral |
| 95 | `\n')` | `""` | StringLiteral |
| 99 | `'` | `"Stryker was here!"` | StringLiteral |
| 105 | `Твоє завдання — написати unit-тести, що вбивають наступні вцілілі мутанти Stryker.',` | `""` | StringLiteral |
| 106 | `Для кожного мутанта: знайди або створи відповідний test-файл, додай тест-кейс,',` | `""` | StringLiteral |
| 107 | `що явно перевіряє цю гілку/умову і провалиться якщо код замінити на "вцілілий варіант".',` | `""` | StringLiteral |
| 108 | `',` | `"Stryker was here!"` | StringLiteral |
| 109 | `## Вцілілі мутанти',` | `""` | StringLiteral |
| 110 | `',` | `"Stryker was here!"` | StringLiteral |
| 112 | `',` | `"Stryker was here!"` | StringLiteral |
| 113 | `## Правила',` | `""` | StringLiteral |
| 114 | `- Не змінюй source-файли — лише test-файли.',` | `""` | StringLiteral |
| 115 | `- Використовуй той самий test-фреймворк, що вже в проєкті.',` | `""` | StringLiteral |
| 116 | `- Запусти `bun test` (або відповідну команду) після кожного файлу — переконайся, що 0 fail.',` | `""` | StringLiteral |
| 117 | `- Якщо мутант охоплений іншим новим тестом — не дублюй.'` | `""` | StringLiteral |
| 118 | `\n')` | `""` | StringLiteral |
| 16 | `nv.N_CURSOR_COVERAGE_FIX_MODEL ?? resolveModel('max')` | `env.N_CURSOR_COVERAGE_FIX_MODEL && resolveModel('max')` | LogicalOperator |
| 16 | `max')` | `""` | StringLiteral |

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

### npm/src/gen-tests.mjs

| Рядок | Оригінал | Заміна | Тип |
| --- | --- | --- | --- |
| 16 | `\.[^.]+$/,` | `/\.[^.]+/` | Regex |
| 16 | `')` | `"Stryker was here!"` | StringLiteral |
| 16 | `\.[^.]+$/,` | `/\.[^.]$/` | Regex |
| 16 | `\.[^.]+$/,` | `/\.[.]+$/` | Regex |
| 17 | `/')` | `""` | StringLiteral |
| 18 | `astSlash === -1 ` | `true` | ConditionalExpression |
| 18 | `astSlash === -1 ` | `false` | ConditionalExpression |
| 18 | `1 ` | `+1` | UnaryOperator |
| 18 | `ase.slice(lastSlash + 1)` | `base` | MethodExpression |
| 18 | `astSlash === -1 ` | `lastSlash !== -1` | EqualityOperator |
| 19 | `astSlash === -1 ` | `lastSlash !== -1` | EqualityOperator |
| 19 | `astSlash === -1 ` | `false` | ConditionalExpression |
| 19 | `1 ` | `+1` | UnaryOperator |
| 18 | `astSlash + 1)` | `lastSlash - 1` | ArithmeticOperator |
| 20 | `
    `${base}.test.mjs`,
    `${base}.test.js`,
    `${base}.test.ts`,
    ...(dir ? [`${dir}/tests/${name}.test.mjs`, `${dir}/tests/${name}.test.js`] : [])
  ]` | `[]` | ArrayDeclaration |
| 19 | `ase.slice(0, lastSlash)` | `base` | MethodExpression |
| 19 | `astSlash === -1 ` | `true` | ConditionalExpression |
| 22 | `${base}.test.js`,` | ```` | StringLiteral |
| 21 | `${base}.test.mjs`,` | ```` | StringLiteral |
| 24 | `${dir}/tests/${name}.test.js`]` | ```` | StringLiteral |
| 24 | `${dir}/tests/${name}.test.mjs`,` | ```` | StringLiteral |
| 23 | `${base}.test.ts`,` | ```` | StringLiteral |
| 35 | `]` | `["Stryker was here"]` | ArrayDeclaration |
| 24 | ``${dir}/tests/${name}.test.mjs`, `${dir}/tests/${name}.test.js`] ` | `[]` | ArrayDeclaration |
| 38 | `'` | `"Stryker was here!"` | StringLiteral |
| 39 | `xistsSync(absPath))` | `false` | ConditionalExpression |
| 40 | `utf8')` | `""` | StringLiteral |
| 41 | `ontent.length > MAX_SRC_BYTES)` | `content.length >= MAX_SRC_BYTES` | EqualityOperator |
| 41 | `ontent.length > MAX_SRC_BYTES)` | `false` | ConditionalExpression |
| 45 | `'` | `"Stryker was here!"` | StringLiteral |
| 41 | `ontent.length > MAX_SRC_BYTES)` | `content.length <= MAX_SRC_BYTES` | EqualityOperator |
| 39 | `
      content = readFileSync(absPath, 'utf8')
      if (content.length > MAX_SRC_BYTES) content = content.slice(0, MAX_SRC_BYTES) + '\n...(truncated)'
    }` | `{}` | BlockStatement |
| 44 | ` => existsSync(join(dir, c)))` | `() => undefined` | ArrowFunction |
| 47 | `utf8')` | `""` | StringLiteral |
| 46 | `
      const testContent = readFileSync(join(dir, existingTest), 'utf8')
      existingTestSection = `\n\nІснуючий тест-файл (\`${existingTest}\`):\n\`\`\`js\n${testContent.slice(0, 2000)}\n\`\`\``
    }` | `{}` | BlockStatement |
| 48 | `\n\nІснуючий тест-файл (\`${existingTest}\`):\n\`\`\`js\n${testContent.slice(0, 2000)}\n\`\`\``` | ```` | StringLiteral |
| 48 | `estContent.slice(0, 2000)}` | `testContent` | MethodExpression |
| 41 | `ontent.length > MAX_SRC_BYTES)` | `true` | ConditionalExpression |
| 46 | `xistingTest)` | `false` | ConditionalExpression |
| 53 | `')` | `"Stryker was here!"` | StringLiteral |
| 54 | `\`\`\`js\n${content}\n\`\`\`` ` | ```` | StringLiteral |
| 54 | `(вміст недоступний)')` | `""` | StringLiteral |
| 61 | `',` | `"Stryker was here!"` | StringLiteral |
| 60 | `ДІЯ: Негайно напиши unit-тести для кожного з наступних файлів. Без запитань, без підтверджень — одразу пиши файли.',` | `""` | StringLiteral |
| 62 | `Для кожного файлу: створи або відредагуй відповідний `*.test.mjs` поруч із джерелом,',` | `""` | StringLiteral |
| 65 | `## Файли для покриття',` | `""` | StringLiteral |
| 64 | `',` | `"Stryker was here!"` | StringLiteral |
| 63 | `напиши тести що покривають основну логіку, гілки та граничні випадки.',` | `""` | StringLiteral |
| 66 | `',` | `"Stryker was here!"` | StringLiteral |
| 68 | `',` | `"Stryker was here!"` | StringLiteral |
| 69 | `## Обовʼязкові правила (дотримуйся СУВОРО)',` | `""` | StringLiteral |
| 70 | `- НЕ змінюй source-файли — лише test-файли (`*.test.mjs`).',` | `""` | StringLiteral |
| 75 | `- Якщо файл лише re-export або типи — пропусти і продовж до наступного.'` | `""` | StringLiteral |
| 74 | `- Не питай підтвердження — пиши всі файли підряд самостійно.',` | `""` | StringLiteral |
| 73 | `- Після кожного файлу виконай `bun test <шлях-до-тесту>` і переконайся що 0 fail.',` | `""` | StringLiteral |
| 76 | `\n')` | `""` | StringLiteral |
| 101 | `]` | `["Stryker was here"]` | ArrayDeclaration |
| 89 | `\n🤖 Генерую тести для ${files.length} файлів через pi агента...\n`)` | ```` | StringLiteral |
| 102 | `--no-session']` | `""` | StringLiteral |
| 104 | `inherit',` | `""` | StringLiteral |
| 12 | `nv.N_CURSOR_COVERAGE_FIX_MODEL ?? env.N_CLOUD_MAX_MODEL ?? ''` | `(env.N_CURSOR_COVERAGE_FIX_MODEL ?? env.N_CLOUD_MAX_MODEL) && ''` | LogicalOperator |
| 12 | `nv.N_CURSOR_COVERAGE_FIX_MODEL ?? env.N_CLOUD_MAX_MODEL ` | `env.N_CURSOR_COVERAGE_FIX_MODEL && env.N_CLOUD_MAX_MODEL` | LogicalOperator |
| 12 | `'` | `"Stryker was here!"` | StringLiteral |

**Приклад тесту** (`npm/src/gen-tests.test.mjs`):

```js
    it('includes file sections', () => {
      const prompt = buildGenTestsPrompt(mockFiles, mockDir)
      expect(prompt).toContain('### `src/a.js` (покриття: 50.0%)')
      expect(prompt).toContain('Причина: Low coverage')
      expect(prompt).toContain('### `src/b.js` (покриття: 10.0%)')
    })
```

### npm/src/lib/llm.mjs

| Рядок | Оригінал | Заміна | Тип |
| --- | --- | --- | --- |
| 139 | `memory ceiling'` | `""` | StringLiteral |
| 141 | `authentication_error'` | `""` | StringLiteral |
| 143 | `too long|exceeds[^.]*context|not found/i` | `/too long|exceeds[^.]context|not found/i` | Regex |
| 143 | `too long|exceeds[^.]*context|not found/i` | `/too long|exceeds[.]*context|not found/i` | Regex |

### npm/src/lib/models.mjs

| Рядок | Оригінал | Заміна | Тип |
| --- | --- | --- | --- |
| 42 | `nv.N_LOCAL_MIN_MODEL ?? ''` | `env.N_LOCAL_MIN_MODEL && ''` | LogicalOperator |
| 45 | `'` | `"Stryker was here!"` | StringLiteral |
| 45 | `nv.N_LOCAL_AVG_MODEL ?? ''` | `env.N_LOCAL_AVG_MODEL && ''` | LogicalOperator |
| 48 | `nv.N_LOCAL_MAX_MODEL ?? ''` | `env.N_LOCAL_MAX_MODEL && ''` | LogicalOperator |
| 53 | `nv.N_CLOUD_MIN_MODEL ?? ''` | `env.N_CLOUD_MIN_MODEL && ''` | LogicalOperator |
| 53 | `'` | `"Stryker was here!"` | StringLiteral |
| 48 | `'` | `"Stryker was here!"` | StringLiteral |
| 56 | `nv.N_CLOUD_AVG_MODEL ?? ''` | `env.N_CLOUD_AVG_MODEL && ''` | LogicalOperator |
| 56 | `'` | `"Stryker was here!"` | StringLiteral |
| 59 | `nv.N_CLOUD_MAX_MODEL ?? ''` | `env.N_CLOUD_MAX_MODEL && ''` | LogicalOperator |
| 70 | `
  if (tier === 'min') return LOCAL_MIN || LOCAL_AVG || LOCAL_MAX || CLOUD_MIN
  if (tier === 'avg') return LOCAL_AVG || LOCAL_MAX || CLOUD_AVG
  if (tier === 'max') return LOCAL_MAX || CLOUD_MAX
  throw new TypeError(`resolveModel: unknown tier "${tier}". Use 'min', 'avg', or 'max'.`)
}` | `{}` | BlockStatement |
| 59 | `'` | `"Stryker was here!"` | StringLiteral |
| 71 | `ier === 'min')` | `true` | ConditionalExpression |
| 71 | `ier === 'min')` | `false` | ConditionalExpression |
| 71 | `ier === 'min')` | `tier !== 'min'` | EqualityOperator |
| 71 | `min')` | `""` | StringLiteral |
| 72 | `ier === 'avg')` | `true` | ConditionalExpression |
| 72 | `ier === 'avg')` | `false` | ConditionalExpression |
| 72 | `ier === 'avg')` | `tier !== 'avg'` | EqualityOperator |
| 72 | `avg')` | `""` | StringLiteral |
| 73 | `ier === 'max')` | `true` | ConditionalExpression |
| 73 | `ier === 'max')` | `false` | ConditionalExpression |
| 73 | `ier === 'max')` | `tier !== 'max'` | EqualityOperator |
| 73 | `max')` | `""` | StringLiteral |
| 73 | `OCAL_MAX || CLOUD_MAX` | `true` | ConditionalExpression |
| 73 | `OCAL_MAX || CLOUD_MAX` | `false` | ConditionalExpression |
| 73 | `OCAL_MAX || CLOUD_MAX` | `LOCAL_MAX && CLOUD_MAX` | LogicalOperator |

### npm/src/lib/omlx-trace.mjs

| Рядок | Оригінал | Заміна | Тип |
| --- | --- | --- | --- |
| 28 | `'0', 'false', 'off', 'no'])` | `[]` | ArrayDeclaration |
| 25 | `0 * 1024 ` | `50 / 1024` | ArithmeticOperator |
| 25 | `0 * 1024 * 1024` | `50 * 1024 / 1024` | ArithmeticOperator |
| 28 | `off',` | `""` | StringLiteral |
| 28 | `0',` | `""` | StringLiteral |
| 28 | `false',` | `""` | StringLiteral |
| 28 | `no']` | `""` | StringLiteral |

### npm/src/lib/omlx.mjs

| Рядок | Оригінал | Заміна | Тип |
| --- | --- | --- | --- |
| 26 | `http://127.0.0.1:8000/v1/chat/completions'` | `""` | StringLiteral |
| 48 | `omlx/'` | `""` | StringLiteral |
| 81 | `<think>([\s\S]*?)<\/think>/` | `/<think>([\s\S])<\/think>/` | Regex |
| 51 | `2000, 8000]` | `[]` | ArrayDeclaration |
| 81 | `<think>([\s\S]*?)<\/think>/` | `/<think>([^\s\S]*?)<\/think>/` | Regex |
| 81 | `<think>([\s\S]*?)<\/think>/` | `/<think>([\S\S]*?)<\/think>/` | Regex |
| 81 | `<think>([\s\S]*?)<\/think>/` | `/<think>([\s\s]*?)<\/think>/` | Regex |

### npm/src/coverage-per-file.mjs

| Рядок | Оригінал | Заміна | Тип |
| --- | --- | --- | --- |
| 26 | `ine.slice(3).trim()` | `line.slice(3)` | MethodExpression |
| 26 | `ine.slice(3).` | `line` | MethodExpression |
| 33 | `ine === 'end_of_record' && currentFile)` | `line === 'end_of_record' || currentFile` | LogicalOperator |
| 33 | `ine === 'end_of_record' ` | `true` | ConditionalExpression |
| 33 | `ine === 'end_of_record' ` | `line !== 'end_of_record'` | EqualityOperator |
| 36 | `f === 0 ` | `false` | ConditionalExpression |
| 52 | `7n-cov-')` | `""` | StringLiteral |
| 59 | `--passWithNoTests',` | `""` | StringLiteral |
| 64 | `inherit',` | `""` | StringLiteral |
| 62 | `--coverage.reportsDirectory=${lcovDir}`` | ```` | StringLiteral |
| 66 | `lcov.info')` | `""` | StringLiteral |
| 68 | `utf8')` | `""` | StringLiteral |
| 69 | `llFiles
      .map(f => ({ ...f, file: relative(dir, f.file) }))
      .filter(f => !f.file.startsWith('..') && !TEST_FILE_RE.test(f.file))` | `allFiles.map(f => ({
  ...f,
  file: relative(dir, f.file)
}))` | MethodExpression |
| 71 | `f.file.startsWith('..') && !TEST_FILE_RE.test(f.file))` | `true` | ConditionalExpression |
| 71 | `f.file.startsWith('..') && !TEST_FILE_RE.test(f.file))` | `!f.file.startsWith('..') || !TEST_FILE_RE.test(f.file)` | LogicalOperator |
| 71 | `.file.startsWith('..') ` | `f.file.endsWith('..')` | MethodExpression |
| 72 | `
    await rm(lcovDir, { recursive: true, force: true }).catch(() => {})
  }` | `{}` | BlockStatement |
| 73 | ` recursive: true, force: true })` | `{}` | ObjectLiteral |
| 73 | `rue,` | `false` | BooleanLiteral |
| 73 | `rue ` | `false` | BooleanLiteral |
| 13 | `\.(test|spec)\.[^.]+$|[/\\]tests?[/\\]/` | `/\.(test|spec)\.[^.]$|[/\\]tests?[/\\]/` | Regex |
| 13 | `\.(test|spec)\.[^.]+$|[/\\]tests?[/\\]/` | `/\.(test|spec)\.[^.]+|[/\\]tests?[/\\]/` | Regex |
| 13 | `\.(test|spec)\.[^.]+$|[/\\]tests?[/\\]/` | `/\.(test|spec)\.[^.]+$|[^/\\]tests?[/\\]/` | Regex |
| 13 | `\.(test|spec)\.[^.]+$|[/\\]tests?[/\\]/` | `/\.(test|spec)\.[.]+$|[/\\]tests?[/\\]/` | Regex |
| 13 | `\.(test|spec)\.[^.]+$|[/\\]tests?[/\\]/` | `/\.(test|spec)\.[^.]+$|[/\\]tests[/\\]/` | Regex |
| 13 | `\.(test|spec)\.[^.]+$|[/\\]tests?[/\\]/` | `/\.(test|spec)\.[^.]+$|[/\\]tests?[^/\\]/` | Regex |

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
