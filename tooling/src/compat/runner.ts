import { createHash } from 'node:crypto'
import type { ValidateFunction } from 'ajv'
import type { MethodSource, SpecSource } from '../loader.js'
import { compileWithComponents } from '../examples.js'
import { category, caseSources, checkAssertions, fixtureReferences, initialFixtures, MissingFixture, resolveProbe, resolveTemplate, selectPath, validateFixtureValues, type Fixtures, type Probe } from './cases.js'
import { checkCompatibility, requestIssue } from './definition.js'
import { httpTransport, ProtocolError, SocketTransport, type Call, type TransportOptions } from './transport.js'

export type Status = 'pass' | 'fail' | 'unsupported' | 'inconclusive' | 'error' | 'skipped'
export interface Result {
  method: string
  category: string
  transport: string
  probe: string
  source: string
  status: Status
  detail: string
  durationMs: number
  code?: number
}
export interface Report {
  formatVersion: 1
  target: string
  startedAt: string
  durationMs: number
  spec: { version: string, sha256: string }
  scope: string[]
  summary: Record<Status, number>
  coverage: { selectedMethods: number, methodsWithPass: number, methodsWithGaps: number }
  discovery: string[]
  limitations: string[]
  results: Result[]
}
export interface RunOptions extends TransportOptions {
  endpoint: string
  wsEndpoint?: string
  label: string
  version: string
  discover: boolean
  fixtures?: Fixtures
  delay: number
  notificationWait: number
  progress?: (result: Result) => void
}

const operational = new Set([-32001, -32004, -32005, -32007, -32009, -32010, -32011, -32012, -32014, -32019])
const universal = new Set([-32700, -32600, -32601, -32602, -32603])

export class Evaluator {
  private validators = new Map<string, ValidateFunction>()
  constructor(private spec: SpecSource) {}

  validate(key: string, schema: any, value: unknown): string | undefined {
    const cacheKey = key + JSON.stringify(schema)
    let validate = this.validators.get(cacheKey)
    if (!validate) { validate = compileWithComponents(schema, this.spec.schemas); this.validators.set(cacheKey, validate) }
    if (validate(value)) return
    return (validate.errors ?? []).slice(0, 4).map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ')
  }

  evaluate(method: MethodSource, probe: Probe, response: any): Pick<Result, 'status' | 'detail' | 'code'> {
    if (Object.hasOwn(response, 'error')) {
      const { code } = response.error
      const allowed = (method.yaml.errors ?? []).map((ref: any) => this.spec.errors[ref.$ref.split('/').pop()])
      const definition = allowed.find((e: any) => e?.code === code)
      if (definition?.data !== undefined) {
        const issue = this.validate(`error-${code}`, definition.data, response.error.data)
        if (issue) return { status: 'fail', code, detail: `Error data violates spec: ${issue}` }
      }
      if (code === -32601) return { status: 'unsupported', code, detail: 'Method not found' }
      if (!definition && !universal.has(code)) return { status: 'fail', code, detail: 'Error code is not declared for this method' }
      if (probe.error === code) {
        if (probe.message && response.error.message !== probe.message) return { status: 'fail', code, detail: 'Error message differs from the normative message' }
        return { status: 'pass', code, detail: 'Expected error code and declared data schema' }
      }
      if (operational.has(code) && definition) return { status: 'inconclusive', code, detail: 'Declared availability, retention, health, or index error; behavior not exercised' }
      if (code === -32603) return { status: 'error', code, detail: 'Server internal error; behavior not exercised' }
      return { status: 'fail', code, detail: probe.error === undefined ? 'Unexpected error for a valid probe' : `Expected error ${probe.error}` }
    }
    if (probe.error !== undefined) return { status: 'fail', detail: `Expected error ${probe.error}, received success` }
    const schema = probe.observe ? method.yaml.notification.schema : method.yaml.result.schema
    const issue = this.validate(method.name, schema, response.result)
    if (issue) return { status: 'fail', detail: `Result schema: ${issue}` }
    if (probe.shapeSchema !== undefined) {
      const shapeIssue = this.validate('shape', probe.shapeSchema, response.result)
      if (shapeIssue) return { status: 'fail', detail: `Result shape: ${shapeIssue}` }
    }
    if (probe.availableSchema !== undefined && this.validate('available', probe.availableSchema, response.result)) return { status: 'inconclusive', detail: 'Required live data is absent; schema matches but behavior is untested' }
    if (probe.resultSchema !== undefined) {
      const resultIssue = this.validate('assertion', probe.resultSchema, response.result)
      if (resultIssue) return { status: 'fail', detail: `Result assertion: ${resultIssue}` }
    }
    const assertion = checkAssertions(response.result, probe.assertions)
    return assertion ? { status: 'fail', detail: assertion } : { status: 'pass', detail: 'Result schema and declared assertions match' }
  }
}

export async function discoverFixtures(call: Call, fixtures: Fixtures, selected: MethodSource[], spec: SpecSource, overrides: Fixtures = {}): Promise<string[]> {
  const notes: string[] = []
  const wanted = new Set(selected.filter((m) => m.yaml.tests?.length).flatMap((m) => [...fixtureReferences([m.yaml.tests, m.yaml.testSetup]), ...(m.yaml.tests ?? []).flatMap((c: any) => c.requires ?? [])]))
  for (const group of spec.compatibility?.discovery ?? []) {
    if (!group.provides.some((name: string) => wanted.has(name) && !Object.hasOwn(fixtures, name))) continue
    let discovered = 0
    for (const step of group.steps) {
      try {
        const params = resolveTemplate(step.params, fixtures)
        const target = spec.methods.find((m) => m.name === step.method)
        if (target && requestIssue(target, { name: step.name, params }, spec)) { notes.push(`Discovery ${group.name}/${step.name}: invalid setup parameters`); continue }
        const response: any = await call(step.method, params)
        if (!Object.hasOwn(response, 'result')) { notes.push(`Discovery ${group.name}/${step.name}: no result`); continue }
        for (const [name, selection] of Object.entries<any>(step.capture)) {
          if (Object.hasOwn(overrides, name)) continue
          const candidates = selectPath(response.result, selection.path)
          const validate = selection.where === undefined ? undefined : compileWithComponents(selection.where, spec.schemas)
          const filtered = validate ? candidates.filter((value) => validate(value)) : candidates
          let value = filtered[0]
          if (selection.field !== undefined) value = selectPath(value, selection.field)[0]
          if (selection.offset !== undefined) value = typeof value === 'number' ? value + selection.offset : undefined
          if (value === undefined || validateFixtureValues(spec, { [name]: value }).length) continue
          fixtures[name] = value
          discovered++
        }
      } catch (error) {
        notes.push(`Discovery ${group.name}/${step.name}: ${error instanceof MissingFixture ? 'missing prerequisite fixture' : 'request unavailable'}`)
      }
    }
    notes.push(`Discovery ${group.name}: captured ${discovered} fixture values`)
  }
  return notes
}

export async function run(spec: SpecSource, selected: MethodSource[], options: RunOptions): Promise<Report> {
  const problems = [...checkCompatibility(spec), ...validateFixtureValues(spec, options.fixtures ?? {})]
  if (problems.length) throw new Error(`Invalid compatibility definitions: ${problems.join('; ')}`)
  const started = Date.now()
  const fixtures = { ...initialFixtures(spec), ...options.fixtures }
  const results: Result[] = []
  const evaluator = new Evaluator(spec)
  const baseCall = httpTransport(options.endpoint, options)
  const http: Call = async (method, params) => {
    if (options.delay) await new Promise((resolve) => setTimeout(resolve, options.delay))
    return baseCall(method, params)
  }
  const discovery = options.discover ? await discoverFixtures(http, fixtures, selected, spec, options.fixtures) : ['Automatic fixture discovery disabled']
  const record = (method: MethodSource, probe: string, result: Pick<Result, 'status' | 'detail'> & Partial<Result>) => {
    const entry: Result = { method: method.name, category: category(method), transport: method.transport, probe, source: `methods/${method.transport}/${method.name}.yaml#tests`, durationMs: 0, ...result }
    results.push(entry)
    options.progress?.(entry)
  }
  const execute = async (method: MethodSource, probe: Probe, call: Call, local: Fixtures, socket?: SocketTransport): Promise<void> => {
    if (probe.skip) { record(method, probe.name, { status: 'skipped', detail: probe.skip }); return }
    const start = Date.now()
    try {
      const requestProblem = requestIssue(method, probe, spec)
      if (requestProblem) { record(method, probe.name, { status: 'error', detail: requestProblem }); return }
      if (probe.observe) {
        const messages: any[] = await socket!.observe(options.notificationWait)
        if (!messages.length) { record(method, probe.name, { status: 'inconclusive', detail: 'No notification observed during the bounded window', durationMs: Date.now() - start }); return }
        const evaluated = messages.map((message) => {
          if (message?.jsonrpc !== '2.0' || message.method !== method.yaml.notification.name || Object.hasOwn(message, 'id') || message.params?.subscription !== probe.subscription) return { status: 'fail' as const, detail: 'Invalid notification envelope or subscription id' }
          return evaluator.evaluate(method, probe, { result: message.params })
        })
        record(method, probe.name, { ...(evaluated.find((r) => r.status !== 'pass') ?? evaluated[0]), durationMs: Date.now() - start })
      } else {
        const response: any = await call(method.name, probe.params)
        const evaluated = evaluator.evaluate(method, probe, response)
        record(method, probe.name, { ...evaluated, durationMs: Date.now() - start })
        if (evaluated.status === 'pass' && Object.hasOwn(response, 'result')) {
          for (const [name, pointer] of Object.entries(probe.capture ?? {})) {
            const value = selectPath(response.result, pointer)[0]
            if (value !== undefined) local[name] = value
          }
        }
      }
    } catch (error) {
      record(method, probe.name, { status: error instanceof ProtocolError ? 'fail' : 'error', detail: safeError(error), durationMs: Date.now() - start })
    }
  }
  for (const method of selected) {
    const sources = caseSources(method)
    if (!sources.length) { record(method, 'coverage', { status: 'skipped', detail: 'No tests declared in the method spec' }); continue }
    if (method.transport === 'websocket' && !options.wsEndpoint) { record(method, 'coverage', { status: 'skipped', detail: 'Provide --ws-endpoint to test WebSocket behavior' }); continue }
    const local = { ...fixtures }
    let socket: SocketTransport | undefined
    try {
      if (method.transport === 'websocket') { socket = new SocketTransport(options.wsEndpoint!, options); await socket.open() }
      const call = socket?.call ?? http
      for (const setup of method.yaml.testSetup ?? []) {
        const target = spec.methods.find((m) => m.name === setup.method)!
        const probe = resolveProbe({ name: `setup/${method.name}/${setup.method}`, params: setup.params, capture: setup.capture }, local, spec)
        await execute(target, probe, call, local, socket)
      }
      for (const source of sources) await execute(method, resolveProbe(source, local, spec), call, local, socket)
    } catch (error) {
      record(method, 'session', { status: error instanceof ProtocolError ? 'fail' : 'error', detail: safeError(error) })
    } finally { socket?.close() }
  }
  const summary: Record<Status, number> = { pass: 0, fail: 0, unsupported: 0, inconclusive: 0, error: 0, skipped: 0 }
  for (const result of results) summary[result.status]++
  return {
    formatVersion: 1, target: options.label, startedAt: new Date(started).toISOString(), durationMs: Date.now() - started,
    spec: { version: options.version, sha256: createHash('sha256').update(JSON.stringify({ compatibility: spec.compatibility, methods: spec.methods.map((m) => ({ name: m.name, transport: m.transport, yaml: m.yaml, md: m.md })), schemas: spec.schemas, errors: spec.errors })).digest('hex') },
    scope: selected.map((m) => m.name), summary,
    coverage: {
      selectedMethods: selected.length,
      methodsWithPass: new Set(results.filter((r) => r.status === 'pass' && selected.some((m) => m.name === r.method)).map((r) => r.method)).size,
      methodsWithGaps: new Set(results.filter((r) => ['skipped', 'inconclusive', 'error'].includes(r.status) && selected.some((m) => m.name === r.method)).map((r) => r.method)).size,
    }, discovery,
    limitations: [
      'This is sampled schema and behavior coverage, not proof of full specification conformance.',
      'Only explicit tests lists execute. Omitted or empty tests are skipped; documentation examples never execute.',
      'Only declared assertions execute; prose requirements are not automatically inferred.',
      'Setup calls may exercise prerequisites outside the selected scope and are labeled setup in the report.',
      'Error message text is checked only where a case declares a message. Declared error data schemas are validated.',
      'JSON numbers use JavaScript number precision; integers above 2^53 cannot be compared exactly.',
      'Reports omit endpoint URLs, headers, request fixtures, raw responses, and server error text. Target labels are user supplied.',
    ], results,
  }
}

function safeError(error: unknown): string {
  if (error instanceof ProtocolError) return error.message
  if (error instanceof Error && ['HTTP connection failed', 'Request timed out', 'Response exceeds configured byte limit', 'WebSocket connection failed', 'WebSocket closed', 'WebSocket request timed out', 'WebSocket send failed', 'WebSocket notification buffer limit reached'].includes(error.message)) return error.message
  if (error instanceof Error && /^HTTP \d{3}$/.test(error.message)) return error.message
  return 'Probe execution failed'
}

export function exitCode(report: Report): number {
  if (report.summary.fail || report.summary.unsupported) return 1
  if (report.summary.error || report.summary.skipped || report.summary.inconclusive) return 2
  return 0
}
