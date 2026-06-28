/**
 * Classifies named exports of a JS/MJS source file by test-generation complexity.
 * Used to route: trivial/simple → local LLM, complex → cloud LLM.
 */

const EXPORT_RE = /^export\s+(?:async\s+)?(?:const|function|class|let)\s+(\w+)/gm

/**
 * Patterns that flag an export as too complex for local model.
 * Matched against the export's extracted body (up to 3000 chars).
 */
const COMPLEX_SIGNALS = [
  /\bfetch\b/,
  /\bnew\s+Date\b/,
  /\bprocess\.env\b/,
  /\bFormData\b/,
  /\bcheckEnv\b/,
  /\bXMLHttpRequest\b/,
  /\bWebSocket\b/,
  /\bsetTimeout\b|\bsetInterval\b/
]

/**
 * @typedef {'trivial'|'simple'|'complex'} ExportComplexity
 * @typedef {{ name: string, complexity: ExportComplexity }} ExportInfo
 */

/**
 * Extracts all named exports and classifies each by test complexity.
 * @param {string} content source file text
 * @returns {ExportInfo[]}
 */
export function extractExportsWithComplexity(content) {
  const names = [...content.matchAll(EXPORT_RE)].map(m => m[1])
  return names.map(name => ({ name, complexity: classifyExport(name, content) }))
}

/**
 * Classifies one export by inspecting the code region that defines it.
 * @param {string} name
 * @param {string} content
 * @returns {ExportComplexity}
 */
function classifyExport(name, content) {
  // Primitive constant: `export const NAME = <literal>`
  const trivialRe = new RegExp(
    `^export\\s+const\\s+${name}\\s*=\\s*` + `(?:\\d[\\d_]*(?:\\.\\d+)?|'[^']*'|"[^"]*"|true|false|null)\\s*$`,
    'm'
  )
  if (trivialRe.test(content)) return 'trivial'

  const body = extractBody(name, content)
  if (!body) return 'simple'
  if (COMPLEX_SIGNALS.some(re => re.test(body))) return 'complex'
  return 'simple'
}

/**
 * Extracts the code region from the export declaration to the next export
 * (or end of file). Used for complexity signal matching only — not exact AST.
 * @param {string} name
 * @param {string} content
 * @returns {string|null}
 */
function extractBody(name, content) {
  const startRe = new RegExp(`export\\s+(?:async\\s+)?(?:const|function)\\s+${name}\\b`)
  const startMatch = startRe.exec(content)
  if (!startMatch) return null

  const after = content.slice(startMatch.index + startMatch[0].length)
  const nextExport = /^export\s/m.exec(after)
  const end = nextExport ? nextExport.index : Math.min(after.length, 3000)
  return startMatch[0] + after.slice(0, end)
}
