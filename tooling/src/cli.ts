import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateSpec } from './validate.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(process.argv[3] ?? path.join(here, '..', '..'))
const cmd = process.argv[2]

if (cmd === 'validate') {
  const problems = validateSpec(root)
  if (problems.length > 0) {
    for (const p of problems) console.error(`ERROR: ${p}`)
    process.exit(1)
  }
  console.log('spec is valid')
} else if (cmd === 'build') {
  const fs = await import('node:fs')
  const { parse } = await import('yaml')
  const { loadSpec } = await import('./loader.js')
  const { buildDocument } = await import('./build.js')
  const problems = validateSpec(root)
  if (problems.length > 0) {
    for (const p of problems) console.error(`ERROR: ${p}`)
    process.exit(1)
  }
  const info = parse(fs.readFileSync(path.join(root, 'spec-info.yaml'), 'utf8'))
  const doc = buildDocument(loadSpec(root), info)
  fs.mkdirSync(path.join(root, 'dist'), { recursive: true })
  fs.writeFileSync(path.join(root, 'dist', 'openrpc.json'), JSON.stringify(doc, null, 2))
  console.log(`wrote dist/openrpc.json (${doc.methods.length} methods)`)
} else {
  console.error('usage: cli.ts <validate|build> [repo-root]')
  process.exit(1)
}
