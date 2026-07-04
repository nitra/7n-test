#!/usr/bin/env node
import { run } from '../src/index.js'

// Незакриті pi-сесії (createAgentSession) тримають event loop, тож без явного
// process.exit процес висить після завершення роботи навіть з кодом 0.
// eslint-disable-next-line n/no-process-exit
process.exit(await run(process.argv.slice(2)))
