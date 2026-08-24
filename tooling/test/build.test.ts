import { describe, it, expect } from 'vitest'
import { validateOpenRPCDocument } from '@open-rpc/schema-utils-js'
import { loadSpec } from '../src/loader.js'
import { buildDocument } from '../src/build.js'
import { makeFixture } from './helpers.js'

describe('buildDocument', () => {
  it('assembles a valid OpenRPC document with prose, tags, and extensions', () => {
    const root = makeFixture({
      'methods/http/getFoo.yaml': `name: getFoo
summary: test
status: standard
params: []
result: { name: x, schema: { type: integer } }
implementations:
  agave: { status: full }
`,
      'methods/http/getFoo.md': 'Normative prose for getFoo.',
      'methods/websocket/fooSubscribe.yaml': `name: fooSubscribe
summary: sub
params: []
result: { name: subscriptionId, schema: { type: integer } }
notification:
  name: fooNotification
  schema: { type: object }
`,
      'methods/websocket/fooSubscribe.md': 'Sub prose.',
      'schemas/Slot.yaml': 'type: integer\n',
      'errors/codes.yaml': 'NodeUnhealthy:\n  code: -32005\n  message: Node is unhealthy\n',
    })
    const doc = buildDocument(loadSpec(root), { title: 't', version: '0.0.1' })
    expect(doc.openrpc).toBe('1.2.6')
    expect(doc.methods.map((m: any) => m.name)).toEqual(['fooSubscribe', 'getFoo'])
    const getFoo = doc.methods[1]
    expect(getFoo.description).toContain('Normative prose')
    expect(getFoo.tags).toEqual([{ name: 'http' }])
    expect(getFoo.paramStructure).toBe('by-position')
    expect(getFoo['x-solana-implementations'].agave.status).toBe('full')
    expect(doc.methods[0]['x-notification'].name).toBe('fooNotification')
    expect(doc.components.schemas.Slot).toEqual({ type: 'integer' })
    expect(doc.components.errors.NodeUnhealthy.code).toBe(-32005)
    // No error carries data/emittedBy, so the extension map is omitted entirely.
    expect(doc['x-solana-errors']).toBeUndefined()
  })

  it('keeps component errors spec-legal and lifts description/data/emittedBy into x-solana-errors', () => {
    const root = makeFixture({
      'methods/http/getFoo.yaml': `name: getFoo
summary: test
params: []
result: { name: x, schema: { type: integer } }
errors:
  - $ref: '#/components/errors/BlockNotAvailable'
`,
      'methods/http/getFoo.md': 'Normative prose for getFoo.',
      'errors/codes.yaml': `BlockNotAvailable:
  code: -32004
  message: Block not available for slot
  description: The slot exists but the block was never produced.
  data:
    type: object
    properties:
      slot: { type: integer }
  emittedBy:
    - getFoo
ScanError:
  code: -32012
  message: "{message}"
  description: An accounts-index scan failed or was aborted.
NodeUnhealthy:
  code: -32005
  message: Node is unhealthy
`,
    })
    const doc = buildDocument(loadSpec(root), { title: 't', version: '0.0.1' })

    // (1) components.errors stays exactly {code, message} — the OpenRPC
    // errorObject forbids additional properties and allows no x- extensions.
    expect(doc.components.errors.BlockNotAvailable).toEqual({
      code: -32004,
      message: 'Block not available for slot',
    })

    // …including the normative description, which is otherwise lost: a
    // component errorObject has nowhere to put it.
    expect(doc.components.errors.ScanError).toEqual({
      code: -32012,
      message: '{message}',
    })

    // (2) the extension data moves to the root-level map, and only errors that
    // actually carry something appear there — an entry with nothing but a
    // description still earns a slot.
    expect(doc['x-solana-errors']).toEqual({
      BlockNotAvailable: {
        description: 'The slot exists but the block was never produced.',
        dataSchema: { type: 'object', properties: { slot: { type: 'integer' } } },
        emittedBy: ['getFoo'],
      },
      ScanError: {
        description: 'An accounts-index scan failed or was aborted.',
      },
    })

    // (3) the regression this shape exists to prevent.
    expect(validateOpenRPCDocument(doc)).toBe(true)
  })
})
