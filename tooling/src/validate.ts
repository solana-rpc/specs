import path from 'node:path'
import type { ValidateFunction } from 'ajv'
import { validateOpenRPCDocument } from '@open-rpc/schema-utils-js'
import { loadSpec, type SpecSource } from './loader.js'
import { collectRefs } from './refs.js'
import { compileWithComponents } from './examples.js'
import { buildDocument } from './build.js'

export function validateSpec(root: string): string[] {
  const spec = loadSpec(root)
  return [
    ...checkPairing(spec),
    ...checkNames(spec),
    ...checkRefs(spec),
    ...checkErrors(spec),
    ...checkMethodMetadata(spec),
    ...checkExamples(spec),
    ...checkOpenRpcDocument(spec),
  ]
}

export function checkPairing(spec: SpecSource): string[] {
  return spec.unpaired.map((f) => `unpaired file (every .yaml needs a sibling .md and vice versa): ${f}`)
}

export function checkNames(spec: SpecSource): string[] {
  const problems: string[] = []
  for (const m of spec.methods) {
    const base = path.basename(m.file, '.yaml')
    if (m.name !== base) {
      problems.push(`${m.file}: yaml 'name' is '${m.name}' but filename says '${base}'`)
    }
  }
  return problems
}

export function checkRefs(spec: SpecSource): string[] {
  const problems: string[] = []
  const sources: Array<[string, any]> = [
    ...spec.methods.map((m): [string, any] => [m.file, m.yaml]),
    ...Object.entries(spec.schemas).map(([n, s]): [string, any] => [`schemas/${n}.yaml`, s]),
    ...Object.entries(spec.errors).map(([n, e]): [string, any] => [`errors/codes.yaml#${n}`, e]),
  ]
  for (const [file, node] of sources) {
    for (const ref of collectRefs(node)) {
      const schemaMatch = ref.match(/^#\/components\/schemas\/(.+)$/)
      const errorMatch = ref.match(/^#\/components\/errors\/(.+)$/)
      if (schemaMatch) {
        if (!Object.hasOwn(spec.schemas, schemaMatch[1])) problems.push(`${file}: unresolved schema $ref '${ref}'`)
      } else if (errorMatch) {
        if (!Object.hasOwn(spec.errors, errorMatch[1])) problems.push(`${file}: unresolved error $ref '${ref}' (add it to errors/codes.yaml)`)
      } else {
        problems.push(`${file}: $ref '${ref}' must start with #/components/schemas/ or #/components/errors/`)
      }
    }
  }
  return problems
}

export function checkErrors(spec: SpecSource): string[] {
  const problems: string[] = []
  for (const [name, e] of Object.entries<any>(spec.errors)) {
    if (typeof e?.code !== 'number') problems.push(`errors/codes.yaml#${name}: missing numeric 'code'`)
    if (typeof e?.message !== 'string') problems.push(`errors/codes.yaml#${name}: missing 'message'`)
  }
  const byCode = new Map<number, string[]>()
  for (const [name, e] of Object.entries<any>(spec.errors)) {
    if (typeof e?.code === 'number') byCode.set(e.code, [...(byCode.get(e.code) ?? []), name])
  }
  for (const [code, names] of byCode) {
    if (names.length > 1) problems.push(`errors/codes.yaml: code ${code} assigned to multiple names: ${names.join(', ')}`)
  }
  return problems
}

const VALID_STATUSES = ['standard', 'deprecated']

/**
 * Enforce the per-method metadata CONTRIBUTING.md requires but that no schema
 * check would catch: an example to keep the return types honest, an
 * implementation support matrix, a known lifecycle status, and examples that
 * actually exercise every required parameter.
 */
export function checkMethodMetadata(spec: SpecSource): string[] {
  const problems: string[] = []
  for (const m of spec.methods) {
    const y = m.yaml ?? {}
    const examples = y.examples ?? []

    if (examples.length === 0) {
      problems.push(`${m.file}: method has no examples (every method needs at least one)`)
    }
    if (typeof y.implementations !== 'object' || y.implementations === null || Array.isArray(y.implementations)) {
      problems.push(`${m.file}: missing 'implementations' support matrix`)
    }
    if (!VALID_STATUSES.includes(y.status)) {
      problems.push(`${m.file}: 'status' is '${y.status}' but must be one of: ${VALID_STATUSES.join(', ')}`)
    }

    const requiredParams = (y.params ?? []).filter((p: any) => p?.required === true).map((p: any) => p.name)
    for (const ex of examples) {
      const supplied = new Set((ex.params ?? []).map((p: any) => p?.name))
      for (const name of requiredParams) {
        if (!supplied.has(name)) {
          problems.push(`${m.file}: example '${ex.name}' omits required param '${name}'`)
        }
      }
    }
  }
  return problems
}

/**
 * Compile a declared schema, or return null if ajv rejects it (an unresolvable
 * $ref, a missing schema). checkRefs already reports those causes, so examples
 * that lean on a broken schema are skipped rather than crashing the run.
 */
function tryCompile(schema: any, schemas: Record<string, any>): ValidateFunction | null {
  try {
    return compileWithComponents(schema, schemas)
  } catch {
    return null
  }
}

export function checkExamples(spec: SpecSource): string[] {
  const problems: string[] = []
  for (const m of spec.methods) {
    for (const ex of m.yaml?.examples ?? []) {
      for (const exParam of ex.params ?? []) {
        const decl = (m.yaml.params ?? []).find((p: any) => p.name === exParam.name)
        if (!decl) {
          problems.push(`${m.file}: example '${ex.name}' references unknown param '${exParam.name}'`)
          continue
        }
        const validate = tryCompile(decl.schema, spec.schemas)
        if (validate && !validate(exParam.value)) {
          problems.push(`${m.file}: example '${ex.name}' param '${exParam.name}' does not match its schema: ${JSON.stringify(validate.errors)}`)
        }
      }
      if (ex.result && m.yaml.result?.schema) {
        const validate = tryCompile(m.yaml.result.schema, spec.schemas)
        if (validate && !validate(ex.result.value)) {
          problems.push(`${m.file}: example '${ex.name}' result does not match the result schema: ${JSON.stringify(validate.errors)}`)
        }
      }
    }
  }
  return problems
}

/**
 * Bundle the sources and check the result against the OpenRPC meta-schema, so
 * structural mistakes are caught here rather than by downstream consumers of
 * dist/openrpc.json. An empty spec has no document worth checking.
 */
export function checkOpenRpcDocument(spec: SpecSource): string[] {
  if (spec.methods.length === 0) return []
  const doc = buildDocument(spec, { title: 'validation', version: '0.0.0' })
  const result = validateOpenRPCDocument(doc)
  return result === true ? [] : [`bundled document fails OpenRPC meta-schema: ${result.message}`]
}
