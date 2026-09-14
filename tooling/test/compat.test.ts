import http from 'node:http'
import { once } from 'node:events'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer } from 'ws'
import { afterEach, describe, expect, it } from 'vitest'
import { loadSpec } from '../src/loader.js'
import { category, initialFixtures, probes, selectMethods } from '../src/compat/cases.js'
import { envelope, httpTransport, SocketTransport } from '../src/compat/transport.js'
import { discoverFixtures, Evaluator, exitCode, run, type RunOptions } from '../src/compat/runner.js'
import { htmlReport, textReport } from '../src/compat/report.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const spec = loadSpec(root)
const method = (name: string) => spec.methods.find((m) => m.name === name)!
const options: RunOptions = { endpoint: '', label: 'test', version: '0.1.0', timeout: 500, maxBytes: 100_000, delay: 0, notificationWait: 30, discover: false }
const cleanup: (() => Promise<unknown> | void)[] = []
afterEach(async () => { for (const close of cleanup.splice(0).reverse()) await close() })

async function server(handler: (body: any, response: http.ServerResponse) => void) {
  const app = http.createServer(async (request, response) => {
    let body = ''
    for await (const chunk of request) body += chunk
    handler(JSON.parse(body), response)
  })
  app.listen(0, '127.0.0.1')
  await once(app, 'listening')
  cleanup.push(() => new Promise<void>((resolve) => { app.closeAllConnections(); app.close(() => resolve()) }))
  return `http://127.0.0.1:${(app.address() as any).port}`
}

describe('selection and coverage', () => {
  it('selects all methods, case-insensitive categories, and exact names', () => {
    expect(selectMethods(spec.methods, [], [])).toHaveLength(spec.methods.length)
    expect(selectMethods(spec.methods, ['accounts'], ['getBalance']).map((m) => m.name)).toEqual(['getBalance'])
    expect(selectMethods(spec.methods, ['Accounts'], ['getBlock'])).toEqual([])
    expect(() => selectMethods(spec.methods, ['typo'], [])).toThrow('Unknown category')
    expect(() => selectMethods(spec.methods, [], ['getbalance'])).toThrow('Unknown method')
  })
  it('puts transaction reads in Ledger and keeps submission and simulation in Transactions', () => {
    for (const name of ['getTransaction', 'getSignaturesForAddress']) expect(category(method(name))).toBe('Ledger')
    for (const name of ['sendTransaction', 'simulateTransaction']) expect(category({ ...method('getBlock'), name, yaml: { category: 'Transactions' } })).toBe('Transactions')
  })
  it('does not turn documentation examples into live tests', () => {
    for (const tests of [undefined, []]) {
      const source = { ...method('getBalance'), yaml: { ...method('getBalance').yaml, tests } }
      expect(probes(source, initialFixtures(spec), spec)[0].skip).toBeTruthy()
    }
  })
  it('bounds program-account probes and marks unavailable ledger fixtures', () => {
    const fixtures = initialFixtures(spec)
    for (const probe of probes(method('getProgramAccounts'), fixtures, spec).filter((p) => p.error === undefined)) expect((probe.params[1] as any).filters.length).toBeGreaterThan(0)
    expect(probes(method('getTransaction'), fixtures, spec).filter((p) => p.name.startsWith('encoding')).every((p) => p.skip)).toBe(true)
  })
})

describe('spec-based evaluation', () => {
  const evaluate = (name: string, probe: any, response: any) => new Evaluator(spec).evaluate(method(name), { name: 'test', params: [], ...probe }, response)
  it('validates result schemas instead of comparing literal example values', () => {
    expect(evaluate('getSlot', {}, { result: 900_123 }).status).toBe('pass')
    expect(evaluate('getSlot', {}, { result: '900123' }).status).toBe('fail')
    expect(evaluate('getHealth', {}, { result: 'healthy' }).status).toBe('fail')
  })
  it('does not relax expectations using implementation notes', () => {
    expect(evaluate('getSlot', {}, { error: { code: -32003, message: 'PROCESSED_NOT_SUPPORTED' } }).status).toBe('fail')
  })
  it('validates required error data and exact messages where specified', () => {
    expect(evaluate('getSlot', { error: -32016 }, { error: { code: -32016, message: 'minimum', data: null } }).status).toBe('fail')
    expect(evaluate('getSlot', { error: -32016 }, { error: { code: -32016, message: 'minimum', data: { contextSlot: 42 } } }).status).toBe('pass')
    expect(evaluate('getSlot', { error: -32016, message: 'expected' }, { error: { code: -32016, message: 'other', data: { contextSlot: 42 } } }).status).toBe('fail')
  })
  it('separates unsupported, unexpected errors, operational errors, and data gaps', () => {
    expect(evaluate('getSlot', {}, { error: { code: -32601, message: 'missing' } }).status).toBe('unsupported')
    expect(evaluate('getBlock', {}, { error: { code: -32011, message: 'no history' } }).status).toBe('inconclusive')
    expect(evaluate('getSlot', {}, { error: { code: -32011, message: 'no history' } }).status).toBe('fail')
    expect(evaluate('getSlot', {}, { error: { code: -32603, message: 'internal' } }).status).toBe('error')
    expect(evaluate('getSlot', { error: -32602 }, { result: 42 }).status).toBe('fail')
    expect(evaluate('getTransaction', { availableSchema: { not: { type: 'null' } } }, { result: null }).status).toBe('inconclusive')
  })
  it('catches request-dependent encoding and block-shape mismatches accepted by broad schemas', () => {
    const fixture = initialFixtures(spec)
    const accountProbe = probes(method('getAccountInfo'), fixture, spec).find((p) => p.name === 'encoding-base64')!
    const value = structuredClone(method('getAccountInfo').yaml.examples[0].result.value)
    expect(evaluate('getAccountInfo', accountProbe, { result: value }).status).toBe('fail')
    const blockProbe = probes(method('getBlock'), { ...fixture, slot: 430 }, spec).find((p) => p.name === 'details-none-rewards-false')!
    const block = structuredClone(method('getBlock').yaml.examples[0].result.value)
    expect(evaluate('getBlock', blockProbe, { result: block }).status).toBe('fail')
  })
  it('does not hide wrong empty response shapes behind a data gap', () => {
    const fixture = initialFixtures(spec)
    const gpa = probes(method('getProgramAccounts'), fixture, spec).find((p) => p.name === 'withContext-true')!
    expect(evaluate('getProgramAccounts', gpa, { result: [] }).status).toBe('fail')
    const multiple = probes(method('getMultipleAccounts'), fixture, spec)[0]
    expect(evaluate('getMultipleAccounts', multiple, { result: { context: { slot: 1 }, value: [] } }).status).toBe('fail')
  })
})

describe('HTTP and JSON-RPC transport', () => {
  it.each([
    { jsonrpc: '1.0', id: 1, result: 1 }, { jsonrpc: '2.0', id: 2, result: 1 },
    { jsonrpc: '2.0', id: 1 }, { jsonrpc: '2.0', id: 1, result: 1, error: null },
    { jsonrpc: '2.0', id: 1, error: { code: 'bad', message: 1 } }, [], null,
  ])('rejects malformed envelopes: %j', (value) => expect(() => envelope(value, 1)).toThrow())
  it('preserves false and null results', () => {
    for (const result of [false, null]) expect(envelope({ jsonrpc: '2.0', id: 1, result }, 1).result).toBe(result)
  })
  it('uses independent request ids and reports schema failures', async () => {
    const ids: number[] = []
    const endpoint = await server((body, response) => {
      ids.push(body.id)
      response.end(JSON.stringify({ jsonrpc: '2.0', id: body.id, result: 'wrong' }))
    })
    const report = await run(spec, [method('getSlot')], { ...options, endpoint })
    expect(new Set(ids).size).toBe(ids.length)
    expect(report.summary.fail).toBe(5)
    expect(exitCode(report)).toBe(1)
  })
  it('bounds slow requests and does not leak connection URLs', async () => {
    const endpoint = await server(() => {})
    await expect(httpTransport(endpoint + '/private-token', { ...options, timeout: 20 })('getSlot', [])).rejects.toThrow('Request timed out')
  })
  it('bounds streamed response bodies', async () => {
    const endpoint = await server((_, response) => response.end('x'.repeat(1000)))
    await expect(httpTransport(endpoint, { ...options, maxBytes: 100 })('getSlot', [])).rejects.toThrow('byte limit')
  })
  it('does not follow redirects or include response bodies in reports', async () => {
    const endpoint = await server((_, response) => { response.writeHead(302, { location: '/secret' }); response.end('private-token') })
    const report = await run(spec, [method('getHealth')], { ...options, endpoint })
    expect(report.summary.error).toBe(1)
    expect(JSON.stringify(report)).not.toContain('private-token')
  })
  it('classifies non-JSON success as a protocol failure and HTTP 429 as operational', async () => {
    let status = 200
    const endpoint = await server((_, response) => { response.writeHead(status); response.end('not json') })
    expect((await run(spec, [method('getHealth')], { ...options, endpoint })).summary.fail).toBe(1)
    status = 429
    const report = await run(spec, [method('getHealth')], { ...options, endpoint })
    expect(report.summary.error).toBe(1)
    expect(exitCode(report)).toBe(2)
  })
})

describe('discovery and reports', () => {
  it('discovers chain-local fixtures and preserves overrides', async () => {
    const defaults = initialFixtures(spec)
    const fixtures = { ...defaults, signature: defaults.missingSignature }
    const calls: string[] = []
    await discoverFixtures(async (name) => {
      calls.push(name)
      return { result: name === 'getSlot' ? 100 : name === 'getBlocks' ? [50] : { transactions: [{ transaction: { signatures: [defaults.missingSignature], message: { accountKeys: [{ pubkey: defaults.clock }] } }, meta: { postTokenBalances: [{ owner: defaults.clock, mint: defaults.nativeMint, programId: defaults.tokenProgram }] } }] } }
    }, fixtures, [method('getTransaction'), method('getBlock')], spec, { signature: defaults.missingSignature })
    expect(calls).toEqual(['getSlot', 'getBlocks', 'getBlock'])
    expect(fixtures).toMatchObject({ slot: 50, signature: defaults.missingSignature, address: defaults.clock, tokenOwner: defaults.clock })
  })
  it('does no unrelated discovery for Accounts-only runs', async () => {
    let calls = 0
    await discoverFixtures(async () => { calls++; return {} }, initialFixtures(spec), [method('getBalance')], spec)
    expect(calls).toBe(0)
  })
  it('omits endpoints, headers, raw responses and server messages in every report format', async () => {
    const endpoint = await server((body, response) => response.end(JSON.stringify({ jsonrpc: '2.0', id: body.id, error: { code: -32602, message: 'server-private-host', data: 'sensitive' } })))
    const report = await run(spec, [method('getHealth')], { ...options, endpoint: endpoint + '/private-url', headers: { authorization: 'private-header' }, label: '<img src=x onerror=alert(1)>' })
    for (const output of [JSON.stringify(report), textReport(report), htmlReport(report)]) {
      for (const secret of [endpoint, 'private-url', 'private-header', 'server-private-host', 'sensitive']) expect(output).not.toContain(secret)
    }
    expect(htmlReport(report)).not.toContain('<img src=x')
    expect(htmlReport(report)).toContain('&lt;img')
  })
  it('reports absent WebSocket coverage and includes reproducible spec identity', async () => {
    const a = await run(spec, [method('accountSubscribe')], options)
    const b = await run(spec, [method('accountSubscribe')], options)
    expect(a.spec.sha256).toBe(b.spec.sha256)
    expect(a.summary.skipped).toBe(1)
    expect(a.coverage.methodsWithGaps).toBe(1)
    expect(exitCode(a)).toBe(2)
  })
})

describe('WebSocket lifecycle', () => {
  async function socketServer(handler: (socket: any, body: any) => void) {
    const app = new WebSocketServer({ port: 0, host: '127.0.0.1' })
    await once(app, 'listening')
    app.on('connection', (socket) => socket.on('message', (data) => handler(socket, JSON.parse(data.toString()))))
    cleanup.push(() => new Promise<void>((resolve) => { for (const c of app.clients) c.terminate(); app.close(() => resolve()) }))
    return `ws://127.0.0.1:${(app.address() as any).port}`
  }
  it('executes declared WebSocket setup, captures, notifications, and unsubscribe cases', async () => {
    let active = false
    const wsEndpoint = await socketServer((socket, body) => {
      let response: any
      if (body.method === 'accountSubscribe') {
        if (body.params[0] === 'bad!') response = { error: { code: -32602, message: 'bad key' } }
        else {
          active = true
          response = { result: 1 }
          setTimeout(() => socket.send(JSON.stringify({ jsonrpc: '2.0', method: 'accountNotification', params: { subscription: 1, result: { context: { slot: 10 }, value: { lamports: 1, owner: '11111111111111111111111111111111', executable: false, rentEpoch: 0, data: [Buffer.alloc(40).toString('base64'), 'base64'] } } } })), 5)
        }
      } else if (active) { active = false; response = { result: true } }
      else response = { error: { code: -32602, message: 'Invalid subscription id.' } }
      socket.send(JSON.stringify({ jsonrpc: '2.0', id: body.id, ...response }))
    })
    const report = await run(spec, [method('accountSubscribe'), method('accountUnsubscribe')], { ...options, wsEndpoint })
    expect(report.summary).toMatchObject({ pass: 7, fail: 0, error: 0, skipped: 0, inconclusive: 0 })
    expect(exitCode(report)).toBe(0)
  })
  it('rejects mismatched ids without hanging', async () => {
    const endpoint = await socketServer((socket) => socket.send(JSON.stringify({ jsonrpc: '2.0', id: 999, result: 1 })))
    const socket = new SocketTransport(endpoint, options)
    cleanup.push(() => socket.close())
    await socket.open()
    await expect(socket.call('accountSubscribe', [])).rejects.toThrow('Unexpected WebSocket response id')
  })
})
