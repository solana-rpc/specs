import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadSpec } from '../src/loader.js'
import { compileWithComponents } from '../src/examples.js'

const spec = loadSpec(fileURLToPath(new URL('../../', import.meta.url)))
const method = spec.methods.find((m) => m.name === 'getTransaction')!.yaml
const config = compileWithComponents(method.params[1].schema, spec.schemas)
const result = compileWithComponents(method.result.schema, spec.schemas)

describe('getTransaction exact-slot schema', () => {
  it.each([{}, { slot: 0 }, { slot: 430 }, { slot: Number.MAX_SAFE_INTEGER }])(
    'accepts canonical config %j', (value) => { expect(config(value)).toBe(true) },
  )

  // Null is shipped tolerance, not a canonical numeric request in this draft.
  it.each([-1, 1.5, '430', true, null, [], {}])(
    'rejects non-slot value %j', (slot) => { expect(config({ slot })).toBe(false) },
  )

  it('keeps the mismatch result in the existing transaction-or-null shape', () => {
    const example = method.examples.find((ex: any) => ex.name === 'exact-slot-mismatch')
    expect(config(example.params[1].value)).toBe(true)
    expect(example.result.value).toBeNull()
    expect(result(example.result.value)).toBe(true)
  })
})
