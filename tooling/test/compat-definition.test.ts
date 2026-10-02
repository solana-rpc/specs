import fs from 'node:fs'
import http from 'node:http'
import { once } from 'node:events'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { stringify } from 'yaml'
import { makeFixture } from './helpers.js'
import { loadSpec } from '../src/loader.js'
import { buildDocument } from '../src/build.js'
import { validateSpec } from '../src/validate.js'
import { checkCompatibility } from '../src/compat/definition.js'
import { caseSources, checkAssertions, resolveTemplate, selectMethods, selectPath } from '../src/compat/cases.js'
import { discoverFixtures, run, type RunOptions } from '../src/compat/runner.js'

const cleanup: (() => Promise<unknown> | void)[] = []
afterEach(async () => { for (const close of cleanup.splice(0).reverse()) await close() })
const options: RunOptions = { endpoint: '', label: 'fixture', version: 'test', timeout: 500, maxBytes: 10_000, delay: 0, notificationWait: 10, discover: false }

function fixture(metadata: any = { category: 'Custom', tests: [{ name: 'basic', params: [7, 'compact'] }] }, suite?: any) {
  const root = makeFixture({
    'methods/http/newRead.yaml': stringify({
      name: 'newRead', summary: 'An unknown method', status: 'standard', implementations: { agave: { status: 'full' } },
      params: [{ name: 'count', required: true, schema: { type: 'integer' } }, { name: 'mode', required: false, schema: { type: 'string' } }],
      result: { name: 'value', schema: { type: 'integer' } },
      examples: [{ name: 'basic', params: [{ name: 'mode', value: 'compact' }, { name: 'count', value: 7 }], result: { name: 'value', value: 1 } }],
      ...metadata,
    }),
    'methods/http/newRead.md': '# newRead\n',
    'errors/codes.yaml': 'InvalidParams: {code: -32602, message: Invalid params}\n',
    ...(suite ? { 'compatibility.yaml': stringify(suite) } : {}),
  })
  cleanup.push(() => fs.rmSync(root, { recursive: true, force: true }))
  return { root, spec: loadSpec(root) }
}

async function endpoint(handler: (body: any) => any) {
  const app = http.createServer(async (req, res) => {
    let body = ''
    for await (const part of req) body += part
    const request = JSON.parse(body)
    res.end(JSON.stringify({ jsonrpc: '2.0', id: request.id, ...handler(request) }))
  })
  app.listen(0, '127.0.0.1')
  await once(app, 'listening')
  cleanup.push(() => new Promise<void>((resolve) => { app.closeAllConnections(); app.close(() => resolve()) }))
  return `http://127.0.0.1:${(app.address() as any).port}`
}

describe('declarative compatibility definitions', () => {
  it('executes a new method from real YAML alone, with explicit parameters and schema validation', async () => {
    const { root, spec } = fixture()
    expect(validateSpec(root)).toEqual([])
    const requests: any[] = []
    const url = await endpoint((body) => { requests.push(body); return { result: 99 } })
    const report = await run(spec, selectMethods(spec.methods, ['custom'], []), { ...options, endpoint: url })
    expect(requests).toMatchObject([{ method: 'newRead', params: [7, 'compact'] }])
    expect(report.summary.pass).toBe(1)
    expect(report.results[0]).toMatchObject({ category: 'Custom', probe: 'basic' })
    expect(report.results[0].source).toMatch(/newRead.yaml#tests$/)
  })

  it('changes behavior expectations by editing only YAML', async () => {
    const metadata = { tests: [{ name: 'exact', params: [7], expect: { result: { const: 42 } } }] }
    const { root, spec } = fixture(metadata)
    const url = await endpoint(() => ({ result: 42 }))
    expect((await run(spec, spec.methods, { ...options, endpoint: url })).summary.pass).toBe(1)
    const yaml = spec.methods[0].yaml
    yaml.tests[0].expect.result.const = 43
    fs.writeFileSync(path.join(root, 'methods/http/newRead.yaml'), stringify(yaml))
    const updated = loadSpec(root)
    const report = await run(updated, updated.methods, { ...options, endpoint: url })
    expect(report.summary.fail).toBe(1)
    expect(report.results[0].source).toMatch(/newRead.yaml#tests$/)
  })

  it('expands matrices, captures values, resolves fixtures, and tests symbolic errors', async () => {
    const { spec } = fixture({ tests: [
      { name: 'capture', params: [7], capture: { previous: '' } },
      { name: 'variant', matrix: { mode: ['first', 'second'] }, params: [{ $fixture: 'previous' }, { $matrix: 'mode' }], expect: { result: { const: { $fixture: 'previous' } } } },
      { name: 'bad-input', params: ['invalid'], expect: { error: 'InvalidParams' } },
    ] })
    expect(checkCompatibility(spec)).toEqual([])
    const requests: any[] = []
    const url = await endpoint((body) => { requests.push(body); return typeof body.params[0] === 'number' ? { result: body.params[0] } : { error: { code: -32602, message: 'invalid' } } })
    expect((await run(spec, spec.methods, { ...options, endpoint: url })).summary.pass).toBe(4)
    expect(requests.map((r) => r.params)).toEqual([[7], [7, 'first'], [7, 'second'], ['invalid']])
  })

  it('skips missing live fixtures while executing independent cases', async () => {
    const { spec } = fixture({ tests: [
      { name: 'live', params: [{ $fixture: 'live' }] },
      { name: 'bad-input', params: ['invalid'], expect: { error: 'InvalidParams' } },
    ] }, { version: 1, fixtures: { live: { schema: { type: 'integer' } } } })
    const requests: any[] = []
    const url = await endpoint((body) => { requests.push(body); return { error: { code: -32602, message: 'invalid' } } })
    expect((await run(spec, spec.methods, { ...options, endpoint: url })).summary).toMatchObject({ pass: 1, skipped: 1, fail: 0 })
    expect(requests).toHaveLength(1)
  })

  it.each([
    { tests: [{ name: 'bad', params: [7], typo: true }] },
    { tests: [{ name: 'bad', params: [{ $fixture: 'unknown' }] }] },
    { tests: [{ name: 'bad', params: [{ $matrix: 'unknown' }] }] },
    { tests: [{ name: 'bad', params: [], expect: { error: 'Unknown' } }] },
    { tests: [{ name: 'bad', params: [7], expect: { result: { type: 'unknown' } } }] },
    { tests: [{ name: 'bad', params: ['wrong-type'] }] },
    { tests: [{ name: 'duplicate', params: [7] }, { name: 'duplicate', params: [7] }] },
    { testSetup: [{ method: 'unknown', params: [] }] },
    { tests: [{ name: 'observe-http', observe: true, subscription: 1 }] },
    { tests: null },
    { readOnly: 'true' },
    { tests: { cases: [] } },
    { testExamples: 'true' },
    { testSetup: {} },
    { category: 1 },
    { 'x-compatibility': { category: 'Custom' } },
  ])('rejects invalid definitions before network access: %j', async (metadata) => {
    const { spec } = fixture(metadata)
    let calls = 0
    const url = await endpoint(() => { calls++; return { result: 7 } })
    expect(checkCompatibility(spec).length).toBeGreaterThan(0)
    await expect(run(spec, spec.methods, { ...options, endpoint: url })).rejects.toThrow('Invalid compatibility definitions')
    expect(calls).toBe(0)
  })

  it.each([undefined, []])('does not execute sendTransaction examples or setup when tests are %j', async (tests) => {
    const { spec } = fixture({ tests, testSetup: [{ method: 'prerequisite', params: [7] }] })
    const target = spec.methods[0]
    target.name = target.yaml.name = 'sendTransaction'
    const prerequisite = structuredClone(target)
    prerequisite.name = prerequisite.yaml.name = 'prerequisite'
    prerequisite.yaml.tests = [{ name: 'explicit', params: [7] }]
    delete prerequisite.yaml.testSetup
    spec.methods.push(prerequisite)
    let calls = 0
    const url = await endpoint(() => { calls++; return { result: 7 } })
    expect(target.yaml.examples).toHaveLength(1)
    expect(checkCompatibility(spec)).toEqual([])
    const report = await run(spec, [target], { ...options, endpoint: url, discover: true })
    expect(report.summary).toMatchObject({ skipped: 1, pass: 0, error: 0 })
    expect(calls).toBe(0)
  })

  it.each(['setup', 'discovery'])('rejects an untested method as a %s target before sending requests', async (kind) => {
    const { spec } = fixture()
    const untested = structuredClone(spec.methods[0])
    untested.name = untested.yaml.name = 'sendTransaction'
    delete untested.yaml.tests
    spec.methods.push(untested)
    if (kind === 'setup') spec.methods[0].yaml.testSetup = [{ method: 'sendTransaction', params: [7] }]
    else spec.compatibility = { version: 1, fixtures: {}, discovery: [{ name: 'bad', provides: [], steps: [{ name: 'bad', method: 'sendTransaction', params: [7], capture: {} }] }] }
    let calls = 0
    const url = await endpoint(() => { calls++; return { result: 7 } })
    await expect(run(spec, spec.methods, { ...options, endpoint: url, discover: true })).rejects.toThrow('declared tests')
    expect(calls).toBe(0)
  })

  it('loads and bundles suite and method metadata without losing test declarations', () => {
    const suite = { version: 1, fixtures: { count: { schema: { type: 'integer' }, value: 7 } } }
    const metadata = { category: 'Custom', tests: [{ name: 'exact', params: [7], expect: { result: { const: 42 } } }], testSetup: [] }
    const { root, spec } = fixture(metadata, suite)
    const built = buildDocument(spec, { title: 'Test', version: 'test' })
    expect(validateSpec(root)).toEqual([])
    expect(built['x-test-config']).toEqual(suite)
    expect(built.methods[0]['x-category']).toBe('Custom')
    expect(built.methods[0]).not.toHaveProperty('x-read-only')
    expect(built.methods[0]['x-tests']).toEqual(metadata.tests)
    expect(built.methods[0]['x-test-setup']).toEqual([])
    expect(built.methods[0]).not.toHaveProperty('x-test-examples')
    for (const key of Object.keys(metadata)) expect(built.methods[0]).not.toHaveProperty(key)
    expect(built).not.toHaveProperty('x-compatibility')
    expect(built.methods[0]).not.toHaveProperty('x-compatibility')
  })

  it('preserves empty test lists in the bundle', () => {
    const { spec } = fixture({ tests: [] })
    const built = buildDocument(spec, { title: 'Test', version: 'test' })
    expect(built.methods[0]['x-tests']).toEqual([])
  })

  it.each([
    [{}, []],
    [{ tests: [] }, []],
    [{ tests: [{ name: 'explicit', params: [7] }] }, ['explicit']],
    [{ category: 'Custom' }, []],
  ])('executes only explicit tests: %j', (metadata, names) => {
    const { spec } = fixture(metadata)
    expect(checkCompatibility(spec)).toEqual([])
    expect(caseSources(spec.methods[0]).map((source) => source.name)).toEqual(names)
  })

  it.each(['null', 'false', '{}'])('rejects a malformed shared configuration: %s', (content) => {
    const { root } = fixture()
    fs.writeFileSync(path.join(root, 'compatibility.yaml'), content)
    expect(checkCompatibility(loadSpec(root)).join(' ')).toContain('invalid definition')
  })

  it('rejects invalid fixture overrides before making requests', async () => {
    const { spec } = fixture({}, { version: 1, fixtures: { count: { schema: { type: 'integer' }, value: 7 } } })
    for (const fixtures of [{ typo: 7 }, { count: 'wrong' }, { count: Number.MAX_SAFE_INTEGER + 1 }]) {
      await expect(run(spec, spec.methods, { ...options, fixtures })).rejects.toThrow('Invalid compatibility definitions')
    }
  })

  it.each([undefined, []])('does not discover fixtures for methods with tests %j', async (tests) => {
    const { spec } = fixture({ tests, testSetup: [{ method: 'anotherRead', params: [{ $fixture: 'count' }] }] }, {
      version: 1, fixtures: { count: { schema: { type: 'integer' } } },
      discovery: [{ name: 'custom', provides: ['count'], steps: [{ name: 'read', method: 'anotherRead', params: [], capture: { count: { path: '' } } }] }],
    })
    let calls = 0
    await discoverFixtures(async () => { calls++; return { result: 7 } }, {}, spec.methods, spec)
    expect(calls).toBe(0)
  })

  it('runs discovery declared in YAML and rejects captured values with the wrong schema', async () => {
    const { spec } = fixture({ tests: [{ name: 'live', params: [{ $fixture: 'count' }] }] }, {
      version: 1, fixtures: { count: { schema: { type: 'integer' } } },
      discovery: [{ name: 'custom', provides: ['count'], steps: [{ name: 'read', method: 'newRead', params: [7], capture: { count: { path: '/items/*', where: { type: 'number' }, offset: 1 } } }] }],
    })
    expect(checkCompatibility(spec)).toEqual([])
    const values = {}
    await discoverFixtures(async () => ({ result: { items: ['ignored', 8] } }), values, spec.methods, spec)
    expect(values).toEqual({ count: 9 })
    const invalid = {}
    await discoverFixtures(async () => ({ result: { items: [1.5] } }), invalid, spec.methods, spec)
    expect(invalid).toEqual({})
  })

  it('resolves defaults, safe offsets, and escaped/wildcard JSON pointers', () => {
    expect(resolveTemplate({ $fixture: 'missing', default: { $fixture: 'tip', offset: -2 } }, { tip: 10 })).toBe(8)
    expect(() => resolveTemplate({ $fixture: 'tip', offset: 1 }, { tip: Number.MAX_SAFE_INTEGER })).toThrow('safe integers')
    expect(selectPath({ 'a/b': [{ '~key': 1 }, { '~key': 2 }] }, '/a~1b/*/~0key')).toEqual([1, 2])
    expect(selectPath({}, '/constructor')).toEqual([])
  })

  it('evaluates generic equality, ordering, and decoded base64 length assertions', () => {
    expect(checkAssertions({ a: 1, b: 2 }, [{ path: '/a', equalsPath: '/b' }])).toContain('differ')
    expect(checkAssertions([{ slot: 2 }, { slot: 1 }], [{ path: '', orderBy: '/slot', direction: 'descending' }])).toBeUndefined()
    expect(checkAssertions([{ slot: 1 }, { slot: 2 }], [{ path: '', orderBy: '/slot', direction: 'descending' }])).toContain('not descending')
    expect(checkAssertions('AA==', [{ path: '', base64Bytes: 1 }])).toBeUndefined()
    expect(checkAssertions('AA', [{ path: '', base64Bytes: 1 }])).toContain('encoding')
  })
})
