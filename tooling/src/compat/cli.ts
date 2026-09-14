import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { parse } from 'yaml'
import { loadSpec } from '../loader.js'
import { validateSpec } from '../validate.js'
import { category, selectMethods, validateFixtureValues, type Fixtures } from './cases.js'
import { exitCode, run } from './runner.js'
import { htmlReport, textReport } from './report.js'

const help = `Usage: npm run compat -- [options]

  --endpoint URL          HTTP RPC URL (or RPC_ENDPOINT environment variable)
  --ws-endpoint URL       WebSocket URL (or RPC_WS_ENDPOINT); never inferred
  --category NAME         Repeat or comma-separate categories from method YAML
  --method NAME           Repeat or comma-separate exact RPC method names
  --list                  List selected methods and categories without network calls
  --label NAME            Report label, default "target"; avoid private addresses
  --format text|json|html  Output format, default text
  --output PATH           Write report to a file (default stdout)
  --fixtures PATH         JSON fixture overrides; see compatibility.md
  --headers-env NAME      Environment variable containing a JSON header object
  --no-discover           Disable automatic live fixture discovery
  --timeout MS            Per-request deadline, default 10000
  --delay MS              Delay before each HTTP call, default 100
  --max-bytes N           Response size limit, default 16777216
  --notification-wait MS  Observe declared notifications, default 3000
  --root PATH            Spec checkout root (default this repository)
  --help                  Show this help

No selector means all methods in the checked-out spec. Categories and methods
intersect when combined. Exit: 0 all probes pass, 1 incompatibility/unsupported,
2 incomplete coverage or operational/configuration error. Only declared tests
execute; methods without tests are skipped.
`

async function main() {
  const { values } = parseArgs({ options: {
    endpoint: { type: 'string' }, 'ws-endpoint': { type: 'string' },
    category: { type: 'string', multiple: true }, method: { type: 'string', multiple: true },
    list: { type: 'boolean' }, help: { type: 'boolean' }, label: { type: 'string', default: 'target' },
    format: { type: 'string', default: 'text' }, output: { type: 'string' }, fixtures: { type: 'string' },
    'headers-env': { type: 'string' }, 'no-discover': { type: 'boolean' },
    timeout: { type: 'string', default: '10000' }, delay: { type: 'string', default: '100' },
    'max-bytes': { type: 'string', default: '16777216' }, 'notification-wait': { type: 'string', default: '3000' },
    root: { type: 'string' },
  } })
  if (values.help) { console.log(help); return }
  const root = path.resolve(values.root ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..'))
  const problems = validateSpec(root)
  if (problems.length) throw new Error('Spec validation failed; run npm run validate before testing an endpoint')
  const spec = loadSpec(root)
  const split = (v: string[] | undefined) => (v ?? []).flatMap((s) => s.split(',').map((n) => n.trim())).filter(Boolean)
  const selected = selectMethods(spec.methods, split(values.category), split(values.method))
  if (!selected.length) throw new Error('Selection contains no methods')
  if (values.list) { console.log(selected.map((m) => `${category(m).padEnd(15)} ${m.transport.padEnd(10)} ${m.name}`).join('\n')); return }
  if (!['text', 'json', 'html'].includes(values.format)) throw new Error('Format must be text, json, or html')
  const endpoint = values.endpoint ?? process.env.RPC_ENDPOINT
  const wsEndpoint = values['ws-endpoint'] ?? process.env.RPC_WS_ENDPOINT
  const url = (value: string | undefined, protocols: string[], name: string) => {
    let parsed: URL
    try { parsed = new URL(value ?? '') } catch { throw new Error(`${name} requires a valid URL`) }
    if (!protocols.includes(parsed.protocol)) throw new Error(`${name} has an unsupported protocol`)
  }
  url(endpoint, ['http:', 'https:'], 'Endpoint')
  if (wsEndpoint) url(wsEndpoint, ['ws:', 'wss:'], 'WebSocket endpoint')
  const integer = (value: string, name: string, minimum: number) => {
    const n = Number(value)
    if (!Number.isSafeInteger(n) || n < minimum || n > 2_147_483_647) throw new Error(`${name} must be an integer between ${minimum} and 2147483647`)
    return n
  }
  let headers: Record<string, string> | undefined
  if (values['headers-env']) {
    try { headers = JSON.parse(process.env[values['headers-env']] ?? '') } catch { throw new Error('Headers environment variable must contain a JSON object') }
    if (!headers || Array.isArray(headers) || typeof headers !== 'object' || Object.values(headers).some((v) => typeof v !== 'string')) throw new Error('Headers must be an object of string values')
  }
  let fixtures: Partial<Fixtures> | undefined
  if (values.fixtures) {
    try { fixtures = JSON.parse(fs.readFileSync(values.fixtures, 'utf8')) } catch { throw new Error('Cannot read fixtures as JSON') }
    if (!fixtures || Array.isArray(fixtures) || typeof fixtures !== 'object' || validateFixtureValues(spec, fixtures).length) throw new Error('Invalid fixture fields; see compatibility.md')
  }
  const report = await run(spec, selected, {
    endpoint: endpoint!, wsEndpoint, headers, label: values.label,
    version: parse(fs.readFileSync(path.join(root, 'spec-info.yaml'), 'utf8')).version,
    timeout: integer(values.timeout, 'timeout', 1), maxBytes: integer(values['max-bytes'], 'max-bytes', 1),
    delay: integer(values.delay, 'delay', 0), notificationWait: integer(values['notification-wait'], 'notification-wait', 0),
    discover: !values['no-discover'], fixtures,
  })
  const output = values.format === 'json' ? JSON.stringify(report, null, 2) + '\n' : values.format === 'html' ? htmlReport(report) : textReport(report)
  if (values.output) fs.writeFileSync(values.output, output, { mode: 0o600 })
  else process.stdout.write(output)
  process.exitCode = exitCode(report)
}

main().catch((error) => {
  // Configuration messages are local; transport and server strings are never printed.
  console.error(error instanceof Error && !('code' in error) ? error.message : 'Compatibility runner failed; check local configuration')
  process.exitCode = 2
})
