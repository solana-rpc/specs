import { describe, it, expect } from 'vitest'
import { validateSpec } from '../src/validate.js'
import { makeFixture } from './helpers.js'

const BASE = {
  'schemas/Slot.yaml': 'type: integer\nminimum: 0\n',
  'errors/codes.yaml': 'NodeUnhealthy:\n  code: -32005\n  message: Node is unhealthy\n',
}

/** Metadata every method must carry; appended unless a test overrides it. */
const META = `status: standard
implementations:
  agave: { status: full }
`

function method(yaml: string, meta: string = META) {
  return { 'methods/http/getFoo.yaml': yaml + meta, 'methods/http/getFoo.md': '# getFoo' }
}

describe('validateSpec', () => {
  it('accepts a fully valid spec', () => {
    const root = makeFixture({
      ...BASE,
      ...method(`name: getFoo
summary: test
params:
  - name: slot
    required: true
    schema: { $ref: '#/components/schemas/Slot' }
result:
  name: height
  schema: { $ref: '#/components/schemas/Slot' }
errors:
  - $ref: '#/components/errors/NodeUnhealthy'
examples:
  - name: basic
    params:
      - name: slot
        value: 42
    result:
      name: height
      value: 40
`),
    })
    expect(validateSpec(root)).toEqual([])
  })

  it('flags unresolved schema refs', () => {
    const root = makeFixture({
      ...BASE,
      ...method(`name: getFoo
summary: test
params: []
result:
  name: x
  schema: { $ref: '#/components/schemas/Missing' }
`),
    })
    expect(validateSpec(root).join('\n')).toContain('Missing')
  })

  it('flags unknown error refs', () => {
    const root = makeFixture({
      ...BASE,
      ...method(`name: getFoo
summary: test
params: []
result: { name: x, schema: { type: integer } }
errors:
  - $ref: '#/components/errors/NoSuchError'
`),
    })
    expect(validateSpec(root).join('\n')).toContain('NoSuchError')
  })

  it('flags examples that do not match their schemas', () => {
    const root = makeFixture({
      ...BASE,
      ...method(`name: getFoo
summary: test
params:
  - name: slot
    required: true
    schema: { $ref: '#/components/schemas/Slot' }
result: { name: x, schema: { type: integer } }
examples:
  - name: bad
    params:
      - name: slot
        value: "not-an-integer"
    result: { name: x, value: 1 }
`),
    })
    expect(validateSpec(root).join('\n')).toContain('example')
  })

  it('reports rather than throws when an example uses an unresolvable schema ref', () => {
    const root = makeFixture({
      ...BASE,
      ...method(`name: getFoo
summary: test
params:
  - name: slot
    required: true
    schema: { $ref: '#/components/schemas/Missing' }
result: { name: x, schema: { type: integer } }
examples:
  - name: basic
    params:
      - name: slot
        value: 1
`),
    })
    expect(validateSpec(root).join('\n')).toContain(
      "unresolved schema $ref '#/components/schemas/Missing'",
    )
  })

  it('flags a bundled document that violates the OpenRPC meta-schema', () => {
    const root = makeFixture({
      ...BASE,
      // A result content descriptor with no 'schema' is structurally invalid
      // OpenRPC, but trips none of the source-level checks above.
      ...method(`name: getFoo
summary: test
params: []
result:
  name: x
`),
    })
    expect(validateSpec(root).join('\n')).toContain('fails OpenRPC meta-schema')
  })

  it('does not treat Object.prototype keys as declared schemas or errors', () => {
    const root = makeFixture({
      ...BASE,
      ...method(`name: getFoo
summary: test
params: []
result:
  name: x
  schema: { $ref: '#/components/schemas/toString' }
errors:
  - $ref: '#/components/errors/hasOwnProperty'
`),
    })
    const problems = validateSpec(root).join('\n')
    expect(problems).toContain("unresolved schema $ref '#/components/schemas/toString'")
    expect(problems).toContain("unresolved error $ref '#/components/errors/hasOwnProperty'")
  })

  describe('checkErrors', () => {
    const okMethod = method(`name: getFoo
summary: test
params: []
result: { name: x, schema: { type: integer } }
`)

    it('flags a registry entry with no numeric code', () => {
      const root = makeFixture({
        ...okMethod,
        'errors/codes.yaml': 'NoSnapshot:\n  message: No snapshot\n',
      })
      expect(validateSpec(root).join('\n')).toContain(
        "errors/codes.yaml#NoSnapshot: missing numeric 'code'",
      )
    })

    it('flags a registry entry with no message', () => {
      const root = makeFixture({
        ...okMethod,
        'errors/codes.yaml': 'NoSnapshot:\n  code: -32008\n',
      })
      expect(validateSpec(root).join('\n')).toContain(
        "errors/codes.yaml#NoSnapshot: missing 'message'",
      )
    })

    it('flags two error names sharing one code', () => {
      const root = makeFixture({
        ...okMethod,
        'errors/codes.yaml': `NodeUnhealthy:
  code: -32005
  message: Node is unhealthy
AlsoUnhealthy:
  code: -32005
  message: Something else entirely
`,
      })
      expect(validateSpec(root).join('\n')).toContain(
        'code -32005 assigned to multiple names: NodeUnhealthy, AlsoUnhealthy',
      )
    })
  })

  describe('checkMethodMetadata', () => {
    it('flags a method with no examples', () => {
      const root = makeFixture({
        ...BASE,
        ...method(`name: getFoo
summary: test
params: []
result: { name: x, schema: { type: integer } }
`),
      })
      expect(validateSpec(root).join('\n')).toContain('method has no examples')
    })

    it('flags a method with no implementations matrix', () => {
      const root = makeFixture({
        ...BASE,
        ...method(
          `name: getFoo
summary: test
params: []
result: { name: x, schema: { type: integer } }
examples:
  - name: basic
    result: { name: x, value: 1 }
`,
          'status: standard\n',
        ),
      })
      expect(validateSpec(root).join('\n')).toContain("missing 'implementations' support matrix")
    })

    it('flags an unknown status value', () => {
      const root = makeFixture({
        ...BASE,
        ...method(
          `name: getFoo
summary: test
params: []
result: { name: x, schema: { type: integer } }
examples:
  - name: basic
    result: { name: x, value: 1 }
`,
          'status: experimental\nimplementations:\n  agave: { status: full }\n',
        ),
      })
      expect(validateSpec(root).join('\n')).toContain(
        "'status' is 'experimental' but must be one of: standard, deprecated",
      )
    })

    it('flags a missing status value', () => {
      const root = makeFixture({
        ...BASE,
        ...method(
          `name: getFoo
summary: test
params: []
result: { name: x, schema: { type: integer } }
examples:
  - name: basic
    result: { name: x, value: 1 }
`,
          'implementations:\n  agave: { status: full }\n',
        ),
      })
      expect(validateSpec(root).join('\n')).toContain("must be one of: standard, deprecated")
    })

    it('flags an example that omits a required param', () => {
      const root = makeFixture({
        ...BASE,
        ...method(`name: getFoo
summary: test
params:
  - name: slot
    required: true
    schema: { $ref: '#/components/schemas/Slot' }
  - name: config
    schema: { type: object }
result: { name: x, schema: { type: integer } }
examples:
  - name: configOnly
    params:
      - name: config
        value: {}
    result: { name: x, value: 1 }
`),
      })
      expect(validateSpec(root).join('\n')).toContain(
        "example 'configOnly' omits required param 'slot'",
      )
    })

    it('accepts an example that omits only optional params', () => {
      const root = makeFixture({
        ...BASE,
        ...method(`name: getFoo
summary: test
params:
  - name: slot
    required: true
    schema: { $ref: '#/components/schemas/Slot' }
  - name: config
    schema: { type: object }
result: { name: x, schema: { type: integer } }
examples:
  - name: minimal
    params:
      - name: slot
        value: 42
    result: { name: x, value: 1 }
`),
      })
      expect(validateSpec(root)).toEqual([])
    })
  })
})
