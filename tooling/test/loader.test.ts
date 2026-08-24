import { describe, it, expect } from 'vitest'
import { loadSpec } from '../src/loader.js'
import { makeFixture } from './helpers.js'

const GET_FOO_YAML = `name: getFoo
summary: test method
params: []
result:
  name: foo
  schema: { type: integer }
`

describe('loadSpec', () => {
  it('loads paired yaml+md methods, schemas, and errors', () => {
    const root = makeFixture({
      'methods/http/getFoo.yaml': GET_FOO_YAML,
      'methods/http/getFoo.md': '# getFoo\nProse.',
      'schemas/Slot.yaml': 'type: integer\nminimum: 0\n',
      'errors/codes.yaml': 'NodeUnhealthy:\n  code: -32005\n  message: Node is unhealthy\n',
    })
    const spec = loadSpec(root)
    expect(spec.methods).toHaveLength(1)
    expect(spec.methods[0].name).toBe('getFoo')
    expect(spec.methods[0].transport).toBe('http')
    expect(spec.methods[0].md).toContain('Prose')
    expect(spec.schemas.Slot).toEqual({ type: 'integer', minimum: 0 })
    expect(spec.errors.NodeUnhealthy.code).toBe(-32005)
    expect(spec.unpaired).toEqual([])
  })

  it('reports unpaired files in both directions', () => {
    const root = makeFixture({
      'methods/http/getA.yaml': GET_FOO_YAML.replace('getFoo', 'getA'),
      'methods/websocket/getB.md': 'orphan prose',
    })
    const spec = loadSpec(root)
    expect(spec.methods).toHaveLength(0)
    expect(spec.unpaired).toHaveLength(2)
  })
})
