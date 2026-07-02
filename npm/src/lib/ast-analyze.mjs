/**
 * Static analysis of JS/ESM source files via oxc (rollup/parseAst).
 *
 * Extracts:
 *  - externalMocks — exact vi.mock() lines with shapes derived from import usage
 *  - exportedNames — names of exported symbols
 *  - internalNames — non-exported top-level declarations
 *  - hasSideEffects — top-level call expressions (e.g. checkEnv([...]))
 *  - envReads — process.env / env.KEY accesses (for vi.stubEnv hints)
 *  - usesFetch — whether source calls fetch()
 */
import { parseAstAsync } from 'rollup/parseAst'

const FETCH_CALL_RE = /\bfetch\s*\(/

// ---------------------------------------------------------------------------
// AST walker
// ---------------------------------------------------------------------------

/**
 * Обходить AST та викликає callback для кожного вузла.
 * @param {unknown} node AST-вузол або значення вузла
 * @param {(node: Record<string, unknown>) => void} fn callback для кожного вузла
 * @returns {void}
 */
function walk(node, fn) {
  if (!node || typeof node !== 'object') return
  fn(/** @type {Record<string, unknown>} */ (node))
  for (const val of Object.values(node)) {
    if (Array.isArray(val)) {
      for (const child of val) walk(child, fn)
    } else if (val && typeof val === 'object' && val.type) {
      walk(val, fn)
    }
  }
}

// ---------------------------------------------------------------------------
// Mock shape derivation
// ---------------------------------------------------------------------------

/**
 * Collects all member-access chains for a binding name.
 * log.error(x)   → ['error']
 * log             → []   (direct call/use)
 * @param {unknown} ast parsed AST
 * @param {string} binding import binding name
 * @returns {string[][]} member-access chains for the binding
 */
function collectUsagePaths(ast, binding) {
  const paths = []
  walk(ast, node => {
    if (node.type === 'CallExpression' && node.callee?.type === 'Identifier' && node.callee.name === binding) {
      paths.push([])
      return
    }
    if (node.type === 'MemberExpression' && !node.computed) {
      const chain = []
      let cur = node
      while (cur?.type === 'MemberExpression' && !cur.computed) {
        chain.unshift(cur.property?.name ?? '')
        cur = cur.object
      }
      if (cur?.type === 'Identifier' && cur.name === binding) {
        paths.push(chain)
      }
    }
  })
  return paths
}

/**
 * Builds a nested shape object from usage paths.
 * [['error'], ['warn']] → { error: 'vi.fn()', warn: 'vi.fn()' }
 * [[]]                  → 'vi.fn()'  (direct call)
 * @param {string[][]} paths usage chains for one binding
 * @returns {string | Record<string, unknown>} mock shape
 */
function buildShape(paths) {
  if (!paths.length || paths.some(p => p.length === 0)) return 'vi.fn()'
  const shape = {}
  for (const path of paths) {
    let obj = shape
    for (let i = 0; i < path.length - 1; i++) {
      if (!obj[path[i]] || typeof obj[path[i]] === 'string') obj[path[i]] = {}
      obj = obj[path[i]]
    }
    const last = path.at(-1)
    if (!obj[last]) obj[last] = 'vi.fn()'
  }
  return shape
}

/**
 * Serializes a mock shape back to formatted JS object text.
 * @param {string | Record<string, unknown>} shape mock shape tree
 * @param {number} depth indentation depth
 * @returns {string} formatted JS object text
 */
function serializeShape(shape, depth = 0) {
  if (shape === 'vi.fn()') return 'vi.fn()'
  const pad = '  '.repeat(depth + 1)
  const close = '  '.repeat(depth)
  const entries = Object.entries(shape).map(([k, v]) => `${pad}${k}: ${serializeShape(v, depth + 1)}`)
  return `{
${entries.join(',\n')}
${close}}`
}

// ---------------------------------------------------------------------------
// Env reads
// ---------------------------------------------------------------------------

/**
 * Collects env keys read as `env.KEY` or `process.env.KEY`.
 * @param {unknown} ast parsed AST
 * @returns {string[]} unique env keys
 */
function collectEnvReads(ast) {
  const keys = new Set()
  walk(ast, node => {
    // env.KEY or process.env.KEY
    if (
      node.type === 'MemberExpression' &&
      !node.computed &&
      node.object?.type === 'Identifier' &&
      (node.object.name === 'env' || node.object.name === 'process')
    ) {
      const prop = node.property?.name
      if (prop === 'env') return // process.env itself, not a key
      if (node.object.name === 'env' && prop) {
        keys.add(prop)
      }
    }
    if (
      node.type === 'MemberExpression' &&
      !node.computed &&
      node.object?.type === 'MemberExpression' &&
      node.object.object?.name === 'process' &&
      node.object.property?.name === 'env' &&
      node.property?.name
    ) {
      keys.add(node.property.name)
    }
  })
  return [...keys]
}

/**
 * Maps import bindings to package names.
 * @param {unknown} ast parsed AST
 * @returns {Map<string, string>} binding → package map
 */
function collectBindingToPkg(ast) {
  const bindingToPkg = new Map()
  for (const node of ast.body) {
    if (node.type !== 'ImportDeclaration') continue
    const pkg = node.source.value
    if (pkg.startsWith('node:') || pkg.startsWith('.')) continue
    for (const spec of node.specifiers ?? []) {
      bindingToPkg.set(spec.local.name, pkg)
    }
  }
  return bindingToPkg
}

/**
 * Collects mock shapes for every package based on binding usage.
 * @param {unknown} ast parsed AST
 * @param {Map<string, string>} bindingToPkg binding → package map
 * @returns {Map<string, Record<string, string | Record<string, unknown>>>} package shapes
 */
function collectPackageShapes(ast, bindingToPkg) {
  const pkgShapes = new Map()
  for (const [binding, pkg] of bindingToPkg) {
    const paths = collectUsagePaths(ast, binding)
    const shape = buildShape(paths)
    if (!pkgShapes.has(pkg)) pkgShapes.set(pkg, {})
    pkgShapes.get(pkg)[binding] = shape
  }
  return pkgShapes
}

/**
 * Converts package shapes to `vi.mock(...)` lines.
 * @param {Map<string, Record<string, string | Record<string, unknown>>>} pkgShapes package shapes
 * @returns {Array<{pkg: string, mockLine: string}>} mock line definitions
 */
function collectExternalMocks(pkgShapes) {
  const externalMocks = []
  for (const [pkg, bindings] of pkgShapes) {
    const shape =
      Object.keys(bindings).length === 1 && Object.values(bindings)[0] === 'vi.fn()'
        ? `{ ${Object.keys(bindings)[0]}: vi.fn() }`
        : serializeShape(bindings)
    externalMocks.push({ pkg, mockLine: `vi.mock("${pkg}", () => (${shape}))` })
  }
  return externalMocks
}

/**
 * Collects explicitly exported top-level names.
 * @param {unknown} ast parsed AST
 * @returns {string[]} exported names
 */
function collectExportedNames(ast) {
  const exportedNames = []
  for (const node of ast.body) {
    if (node.type !== 'ExportNamedDeclaration' || !node.declaration) continue
    if (node.declaration.type === 'VariableDeclaration') {
      exportedNames.push(...node.declaration.declarations.map(d => d.id?.name).filter(Boolean))
    } else if (node.declaration.id?.name) {
      exportedNames.push(node.declaration.id.name)
    }
  }
  return exportedNames
}

/**
 * Collects non-exported top-level declarations.
 * @param {unknown} ast parsed AST
 * @returns {string[]} internal names
 */
function collectInternalNames(ast) {
  const internalNames = []
  for (const node of ast.body) {
    if (node.type === 'VariableDeclaration') {
      internalNames.push(...node.declarations.map(d => d.id?.name).filter(Boolean))
    } else if (node.type === 'FunctionDeclaration' && node.id?.name) {
      internalNames.push(node.id.name)
    }
  }
  return internalNames
}

/**
 * Detects top-level call expressions.
 * @param {unknown} ast parsed AST
 * @returns {boolean} true when module has top-level side effects
 */
function hasTopLevelSideEffects(ast) {
  return ast.body.some(n => n.type === 'ExpressionStatement' && n.expression?.type === 'CallExpression')
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Analyses ESM source and returns structured info for test generation.
 * @param {string} source JS/ESM source text
 * @returns {Promise<{
 *   externalMocks: Array<{pkg: string, mockLine: string}>,
 *   exportedNames: string[],
 *   internalNames: string[],
 *   hasSideEffects: boolean,
 *   envReads: string[],
 *   usesFetch: boolean,
 * }>} структуровані дані аналізу модуля
 */
export async function analyzeModule(source) {
  let ast
  try {
    ast = await parseAstAsync(source)
  } catch {
    return {
      externalMocks: [],
      exportedNames: [],
      internalNames: [],
      hasSideEffects: false,
      envReads: [],
      usesFetch: false
    }
  }

  const bindingToPkg = collectBindingToPkg(ast)
  const pkgShapes = collectPackageShapes(ast, bindingToPkg)

  return {
    externalMocks: collectExternalMocks(pkgShapes),
    exportedNames: collectExportedNames(ast),
    internalNames: collectInternalNames(ast),
    hasSideEffects: hasTopLevelSideEffects(ast),
    envReads: collectEnvReads(ast),
    usesFetch: FETCH_CALL_RE.test(source)
  }
}
