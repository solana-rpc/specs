import { randomBytes } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import type { MethodSource, SpecSource } from '../loader.js'
import { compileWithComponents } from '../examples.js'

export type Fixtures = Record<string, any>
export interface Assertion { path: string; equalsPath?: string; orderBy?: string; direction?: 'ascending' | 'descending'; base64Bytes?: number }
export interface CaseSource {
  name: string
  params?: any[]
  matrix?: Record<string, any[]>
  requires?: string[]
  expect?: { error?: string; message?: string; result?: any; shape?: any; available?: any; assertions?: Assertion[] }
  capture?: Record<string, string>
  observe?: boolean
  subscription?: any
}
export interface Probe {
  name: string
  params: unknown[]
  error?: number
  message?: string
  skip?: string
  resultSchema?: any
  shapeSchema?: any
  availableSchema?: any
  assertions?: Assertion[]
  capture?: Record<string, string>
  observe?: boolean
  subscription?: any
}

export class MissingFixture extends Error {}

export function base58(bytes: Uint8Array): string {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let number = BigInt('0x' + Buffer.from(bytes).toString('hex'))
  let result = ''
  while (number) { result = alphabet[Number(number % 58n)] + result; number /= 58n }
  for (const byte of bytes) { if (byte !== 0) break; result = '1' + result }
  return result
}

export function initialFixtures(spec: SpecSource): Fixtures {
  return Object.fromEntries(Object.entries<any>(spec.compatibility?.fixtures ?? {}).flatMap(([name, definition]) => {
    if (Object.hasOwn(definition, 'value')) return [[name, structuredClone(definition.value)]]
    if (definition.generate) return [[name, base58(randomBytes(definition.generate.bytes))]]
    return []
  }))
}

export function category(method: MethodSource): string { return method.yaml.category ?? 'Other' }

export function selectMethods(methods: MethodSource[], categories: string[], names: string[]): MethodSource[] {
  const available = new Set(methods.map(category).map((v) => v.toLowerCase()))
  for (const c of categories) if (!available.has(c.toLowerCase())) throw new Error(`Unknown category: ${c}`)
  for (const n of names) if (!methods.some((m) => m.name === n)) throw new Error(`Unknown method: ${n}`)
  return methods.filter((m) => (!categories.length || categories.some((c) => c.toLowerCase() === category(m).toLowerCase())) && (!names.length || names.includes(m.name)))
}

export function resolveTemplate(value: any, fixtures: Fixtures): any {
  if (Array.isArray(value)) return value.map((v) => resolveTemplate(v, fixtures))
  if (value && typeof value === 'object') {
    if (Object.hasOwn(value, '$fixture')) {
      let resolved = Object.hasOwn(fixtures, value.$fixture) ? fixtures[value.$fixture] : undefined
      if (resolved === undefined && Object.hasOwn(value, 'default')) resolved = resolveTemplate(value.default, fixtures)
      if (resolved === undefined) throw new MissingFixture(`Missing fixture: ${value.$fixture}`)
      if (value.offset !== undefined) {
        if (!Number.isSafeInteger(resolved) || !Number.isSafeInteger(resolved + value.offset)) throw new Error('Fixture offset requires safe integers')
        resolved += value.offset
      }
      return structuredClone(resolved)
    }
    return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, resolveTemplate(v, fixtures)]))
  }
  return value
}

export function fixtureReferences(value: any): string[] {
  if (!value || typeof value !== 'object') return []
  return [...(typeof value.$fixture === 'string' ? [value.$fixture] : []), ...Object.values(value).flatMap(fixtureReferences)]
}

export function selectPath(value: any, pointer: string): any[] {
  if (pointer === '') return [value]
  let selected = [value]
  for (const part of pointer.slice(1).split('/').map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'))) {
    selected = selected.flatMap((v) => {
      if (part === '*') return Array.isArray(v) ? v : []
      return v !== null && typeof v === 'object' && Object.hasOwn(v, part) ? [v[part]] : []
    })
  }
  return selected
}

export function caseSources(method: MethodSource): CaseSource[] {
  const metadata = method.yaml
  const sources: CaseSource[] = []
  for (const source of metadata.tests ?? []) {
    let variants: Fixtures[] = [{}]
    for (const [key, values] of Object.entries<any[]>(source.matrix ?? {})) variants = variants.flatMap((v) => values.map((value) => ({ ...v, [key]: value })))
    for (const variant of variants) {
      const substitute = (value: any): any => {
        if (Array.isArray(value)) return value.map(substitute)
        if (value && typeof value === 'object') {
          if (Object.hasOwn(value, '$matrix')) return structuredClone(variant[value.$matrix])
          return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, substitute(v)]))
        }
        return value
      }
      const { matrix, ...expanded } = substitute(source)
      sources.push({ ...expanded, name: source.name + Object.values(variant).map((v) => `-${v}`).join('') })
    }
  }
  return sources
}

export function resolveProbe(source: CaseSource, fixtures: Fixtures, spec: SpecSource): Probe {
  try {
    for (const name of source.requires ?? []) if (!Object.hasOwn(fixtures, name)) throw new MissingFixture(`Missing fixture: ${name}`)
    const resolved = resolveTemplate(source, fixtures)
    return {
      name: source.name, params: resolved.params ?? [], error: resolved.expect?.error === undefined ? undefined : spec.errors[resolved.expect.error].code,
      message: resolved.expect?.message, resultSchema: resolved.expect?.result, shapeSchema: resolved.expect?.shape,
      availableSchema: resolved.expect?.available, assertions: resolved.expect?.assertions,
      capture: source.capture, observe: source.observe, subscription: resolved.subscription,
    }
  } catch (error) {
    if (error instanceof MissingFixture) return { name: source.name, params: [], skip: error.message }
    throw error
  }
}

export function probes(method: MethodSource, fixtures: Fixtures, spec: SpecSource): Probe[] {
  const sources = caseSources(method)
  return sources.length ? sources.map((source) => resolveProbe(source, fixtures, spec)) : [{ name: 'coverage', params: [], skip: 'No tests declared in the method spec' }]
}

export function checkAssertions(result: any, assertions: Assertion[] = []): string | undefined {
  for (const assertion of assertions) {
    const selected = selectPath(result, assertion.path)
    if (!selected.length) return `Assertion path ${assertion.path} is absent`
    if (assertion.base64Bytes !== undefined && selected.some((v) => typeof v !== 'string' || Buffer.from(v, 'base64').length !== assertion.base64Bytes || Buffer.from(v, 'base64').toString('base64') !== v)) return `Base64 data at ${assertion.path} has an unexpected decoded length or encoding`
    if (assertion.equalsPath !== undefined) {
      const other = selectPath(result, assertion.equalsPath)
      if (!other.length || !isDeepStrictEqual(selected, other)) return `Values at ${assertion.path} and ${assertion.equalsPath} differ`
    } else if (assertion.orderBy !== undefined) {
      for (const list of selected) {
        if (!Array.isArray(list)) return `Sort assertion at ${assertion.path} requires an array`
        const keys = list.map((item) => selectPath(item, assertion.orderBy!)[0])
        if (keys.some((key) => typeof key !== 'number' && typeof key !== 'string')) return 'Sort key is absent or not a scalar'
        if (keys.some((key, i) => i > 0 && (assertion.direction === 'ascending' ? key < keys[i - 1] : key > keys[i - 1]))) return `Array at ${assertion.path} is not ${assertion.direction ?? 'descending'}`
      }
    }
  }
}

export function validateFixtureValues(spec: SpecSource, fixtures: Fixtures): string[] {
  const definitions = spec.compatibility?.fixtures ?? {}
  return Object.entries(fixtures).flatMap(([name, value]) => {
    const definition = definitions[name]
    if (!definition) return [`Unknown fixture: ${name}`]
    if (!compileWithComponents(definition.schema, spec.schemas)(value)) return [`Fixture ${name} does not match its schema`]
    if (typeof value === 'number' && !Number.isSafeInteger(value)) return [`Fixture ${name} must be a safe integer`]
    return []
  })
}
