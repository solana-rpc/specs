import { Ajv } from 'ajv'
import type { MethodSource, SpecSource } from '../loader.js'
import { compileWithComponents } from '../examples.js'
import { caseSources, initialFixtures, resolveProbe, validateFixtureValues, type Fixtures, type Probe } from './cases.js'

const identifier = { type: 'string', pattern: '^[A-Za-z][A-Za-z0-9_]*$', not: { enum: ['constructor', 'prototype'] } }
const pointer = { type: 'string', pattern: '^(|/.*)$' }
const strings = { type: 'array', items: identifier, uniqueItems: true }
const object = (properties: Record<string, any>, required: string[] = []) => ({ type: 'object', properties, required, additionalProperties: false })
const capture = { type: 'object', propertyNames: identifier, additionalProperties: pointer }
const assertion = {
  ...object({ path: pointer, equalsPath: pointer, orderBy: pointer, direction: { enum: ['ascending', 'descending'] }, base64Bytes: { type: 'integer', minimum: 0 } }, ['path']),
  oneOf: [{ required: ['equalsPath'], not: { anyOf: [{ required: ['orderBy'] }, { required: ['base64Bytes'] }, { required: ['direction'] }] } }, { required: ['orderBy'], not: { anyOf: [{ required: ['equalsPath'] }, { required: ['base64Bytes'] }] } }, { required: ['base64Bytes'], not: { anyOf: [{ required: ['equalsPath'] }, { required: ['orderBy'] }, { required: ['direction'] }] } }],
}
const expectation = {
  ...object({ error: identifier, message: { type: 'string' }, result: {}, shape: {}, available: {}, assertions: { type: 'array', items: assertion } }),
  dependencies: { message: ['error'] },
  not: { required: ['error'], anyOf: ['result', 'shape', 'available', 'assertions'].map((key) => ({ required: [key] })) },
}
const caseSchema = {
  ...object({
    name: { type: 'string', minLength: 1 }, params: { type: 'array' }, expect: expectation,
    requires: strings, capture, observe: { const: true }, subscription: {},
    matrix: { type: 'object', minProperties: 1, propertyNames: identifier, additionalProperties: { type: 'array', minItems: 1, maxItems: 64, uniqueItems: true, items: { type: ['string', 'number', 'boolean'] } } },
  }, ['name']),
  oneOf: [{ required: ['params'], not: { anyOf: [{ required: ['observe'] }, { required: ['subscription'] }] } }, { required: ['observe', 'subscription'], not: { anyOf: [{ required: ['params'] }, { required: ['capture'] }] } }],
}
const metadataSchema = object({
  category: { type: 'string', minLength: 1 },
  tests: { type: 'array', maxItems: 1000, items: caseSchema },
  testSetup: { type: 'array', maxItems: 100, items: object({ method: { type: 'string' }, params: { type: 'array' }, capture }, ['method', 'params']) },
})
const suiteSchema = object({
  version: { const: 1 },
  fixtures: { type: 'object', propertyNames: identifier, additionalProperties: {
    ...object({ schema: {}, value: {}, generate: object({ bytes: { type: 'integer', minimum: 1, maximum: 512 } }, ['bytes']) }, ['schema']),
    not: { required: ['value', 'generate'] },
  } },
  discovery: { type: 'array', items: object({
    name: { type: 'string', minLength: 1 }, provides: strings,
    steps: { type: 'array', maxItems: 100, items: object({
      name: { type: 'string', minLength: 1 }, method: { type: 'string', minLength: 1 }, params: { type: 'array' },
      capture: { type: 'object', propertyNames: identifier, additionalProperties: object({ path: pointer, where: {}, field: pointer, offset: { type: 'integer' } }, ['path']) },
    }, ['name', 'method', 'params', 'capture']) },
  }, ['name', 'provides', 'steps']) },
}, ['version', 'fixtures'])
const ajv = new Ajv({ strict: false, allowUnionTypes: true, allErrors: true })
const validateMetadata = ajv.compile(metadataSchema)
const validateSuite = ajv.compile(suiteSchema)

export function requestIssue(method: MethodSource, probe: Probe, spec: SpecSource): string | undefined {
  if (probe.skip || probe.observe || probe.error !== undefined) return
  const params = method.yaml.params ?? []
  const minItems = params.reduce((min: number, p: any, i: number) => p.required ? i + 1 : min, 0)
  const schema = { type: 'array', minItems, ...(params.length ? { items: params.map((p: any) => p.schema), additionalItems: false } : { maxItems: 0 }) }
  return compileWithComponents(schema, spec.schemas)(probe.params) ? undefined : 'Live test params do not match the method parameter schemas'
}

export function checkCompatibility(spec: SpecSource): string[] {
  const problems: string[] = []
  if (spec.compatibility !== undefined && !validateSuite(spec.compatibility)) return [`compatibility.yaml: invalid definition: ${ajv.errorsText(validateSuite.errors)}`]
  const definitions = spec.compatibility?.fixtures ?? {}
  const globalNames = new Set<string>(Object.keys(definitions))
  const schemaCheck = (schema: any, context: string) => {
    try { compileWithComponents(schema, spec.schemas) } catch { problems.push(`${context}: invalid assertion or fixture schema`) }
  }
  const templates = (value: any, names: Set<string>, matrix: Set<string>, context: string): void => {
    if (!value || typeof value !== 'object') return
    if (Object.hasOwn(value, '$fixture')) {
      if (typeof value.$fixture !== 'string' || !names.has(value.$fixture)) problems.push(`${context}: unknown fixture reference`)
      if (Object.keys(value).some((k) => !['$fixture', 'default', 'offset'].includes(k)) || (value.offset !== undefined && !Number.isSafeInteger(value.offset))) problems.push(`${context}: invalid fixture substitution`)
    }
    if (Object.hasOwn(value, '$matrix') && (Object.keys(value).length !== 1 || !matrix.has(value.$matrix))) problems.push(`${context}: unknown matrix reference`)
    for (const v of Object.values(value)) templates(v, names, matrix, context)
  }
  for (const [name, definition] of Object.entries<any>(definitions)) schemaCheck(definition.schema, `fixture ${name}`)
  let defaults: Fixtures = {}
  if (!problems.length) {
    defaults = initialFixtures(spec)
    problems.push(...validateFixtureValues(spec, defaults))
  }
  for (const group of spec.compatibility?.discovery ?? []) {
    for (const name of group.provides) if (!globalNames.has(name)) problems.push(`discovery ${group.name}: unknown provided fixture ${name}`)
    for (const step of group.steps) {
      const context = `discovery ${group.name}/${step.name}`
      templates(step.params, globalNames, new Set(), context)
      const method = spec.methods.find((m) => m.name === step.method)
      if (method && (method.transport !== 'http' || !Array.isArray(method.yaml.tests) || !method.yaml.tests.length)) problems.push(`${context}: discovery requires an HTTP method with declared tests`)
      for (const [name, selection] of Object.entries<any>(step.capture)) {
        if (!globalNames.has(name)) problems.push(`${context}: capture names an undeclared fixture`)
        if (selection.where !== undefined) schemaCheck(selection.where, context)
      }
    }
  }
  for (const method of spec.methods) {
    const context = `${method.file}: tests`
    for (const key of ['x-compatibility', 'readOnly', 'testExamples']) {
      if (Object.hasOwn(method.yaml, key)) problems.push(`${context}: ${key} is not supported; declare executable requests in the tests list`)
    }
    const metadata: any = Object.fromEntries(Object.keys(metadataSchema.properties).filter((key) => Object.hasOwn(method.yaml, key)).map((key) => [key, method.yaml[key]]))
    if (!validateMetadata(metadata as unknown)) { problems.push(`${context}: ${ajv.errorsText(validateMetadata.errors)}`); continue }
    const known = new Set(globalNames)
    for (const setup of metadata.testSetup ?? []) {
      const target = spec.methods.find((m) => m.name === setup.method)
      if (!target || target.transport !== method.transport || !Array.isArray(target.yaml.tests) || !target.yaml.tests.length) problems.push(`${context}: setup must name a method with declared tests on the same transport`)
      templates(setup.params, known, new Set(), context)
      for (const name of Object.keys(setup.capture ?? {})) known.add(name)
    }
    for (const source of metadata.tests ?? []) {
      const combinations = Object.values<any[]>(source.matrix ?? {}).reduce((n, v) => n * v.length, 1)
      if (combinations > 1000) { problems.push(`${context}: matrix expands beyond 1000 cases`); continue }
      templates(source, known, new Set(Object.keys(source.matrix ?? {})), context)
      for (const name of source.requires ?? []) if (!known.has(name)) problems.push(`${context}: unknown required fixture`)
      if (source.observe && (method.transport !== 'websocket' || !method.yaml.notification || source.expect?.error)) problems.push(`${context}: observe requires a WebSocket notification schema and cannot expect an RPC error`)
      if (source.expect?.error && !Object.hasOwn(spec.errors, source.expect.error)) problems.push(`${context}: unknown expected error ${source.expect.error}`)
      if (source.expect?.error && spec.errors[source.expect.error]?.emittedBy && !(method.yaml.errors ?? []).some((e: any) => e.$ref === `#/components/errors/${source.expect.error}`)) problems.push(`${context}: expected error is not declared for this method`)
      for (const key of ['result', 'shape', 'available']) if (source.expect?.[key] !== undefined) schemaCheck(source.expect[key], context)
      for (const name of Object.keys(source.capture ?? {})) known.add(name)
    }
    if (problems.length) continue
    const sources = caseSources(method)
    if (new Set(sources.map((s) => s.name)).size !== sources.length) problems.push(`${context}: duplicate expanded case name`)
    for (const source of sources) {
      try {
        const probe = resolveProbe(source, defaults, spec)
        const issue = requestIssue(method, probe, spec)
        if (issue) problems.push(`${context}/${source.name}: ${issue}`)
      } catch { problems.push(`${context}/${source.name}: invalid executable case`) }
    }
  }
  return problems
}
