import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'

export interface MethodSource {
  name: string
  file: string
  mdFile: string
  transport: 'http' | 'websocket'
  yaml: any
  md: string
}

export interface SpecSource {
  methods: MethodSource[]
  schemas: Record<string, any>
  errors: Record<string, any>
  unpaired: string[]
}

export function loadSpec(root: string): SpecSource {
  const methods: MethodSource[] = []
  const unpaired: string[] = []

  for (const transport of ['http', 'websocket'] as const) {
    const dir = path.join(root, 'methods', transport)
    if (!fs.existsSync(dir)) continue
    // readdirSync order is filesystem-dependent; sort so the bundled
    // document's key order is reproducible across machines.
    const entries = fs.readdirSync(dir).sort()
    for (const f of entries.filter((f) => f.endsWith('.yaml'))) {
      const base = f.slice(0, -'.yaml'.length)
      if (!entries.includes(base + '.md')) {
        unpaired.push(path.join(dir, f))
        continue
      }
      const yamlPath = path.join(dir, f)
      const doc = parse(fs.readFileSync(yamlPath, 'utf8'))
      methods.push({
        name: doc?.name,
        file: yamlPath,
        mdFile: path.join(dir, base + '.md'),
        transport,
        yaml: doc,
        md: fs.readFileSync(path.join(dir, base + '.md'), 'utf8'),
      })
    }
    for (const f of entries.filter((f) => f.endsWith('.md'))) {
      if (!entries.includes(f.slice(0, -'.md'.length) + '.yaml')) {
        unpaired.push(path.join(dir, f))
      }
    }
  }

  const schemas: Record<string, any> = {}
  const schemasDir = path.join(root, 'schemas')
  if (fs.existsSync(schemasDir)) {
    for (const f of fs.readdirSync(schemasDir).sort().filter((f) => f.endsWith('.yaml'))) {
      schemas[f.slice(0, -'.yaml'.length)] = parse(
        fs.readFileSync(path.join(schemasDir, f), 'utf8'),
      )
    }
  }

  const errorsFile = path.join(root, 'errors', 'codes.yaml')
  const errors = fs.existsSync(errorsFile)
    ? (parse(fs.readFileSync(errorsFile, 'utf8')) ?? {})
    : {}

  return { methods, schemas, errors, unpaired }
}
