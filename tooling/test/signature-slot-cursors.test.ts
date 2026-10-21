import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadSpec } from '../src/loader.js'
import { compileWithComponents } from '../src/examples.js'

const spec = loadSpec(fileURLToPath(new URL('../../', import.meta.url)))
const method = spec.methods.find((m) => m.name === 'getSignaturesForAddress')!.yaml
const config = compileWithComponents(method.params[1].schema, spec.schemas)
const signature = method.examples[0].result.value[0].signature

describe('getSignaturesForAddress slot cursor schema', () => {
  it.each([
    {}, { beforeSlot: 0 }, { untilSlot: 0 },
    { beforeSlot: 114, untilSlot: 111 },
    { beforeSlot: 114, untilSlot: 114 },
    { beforeSlot: 111, untilSlot: 114 },
    { before: signature, untilSlot: 111 },
    { beforeSlot: 114, until: signature },
  ])('accepts independent and cross-side bounds %j', (value) => {
    expect(config(value)).toBe(true)
  })

  it.each([
    { before: signature, beforeSlot: 114 },
    { until: signature, untilSlot: 111 },
  ])('rejects conflicting same-side bounds %j', (value) => {
    expect(config(value)).toBe(false)
  })

  it.each([-1, 1.5, '114', true, null])('rejects non-slot value %j', (value) => {
    expect(config({ beforeSlot: value })).toBe(false)
    expect(config({ untilSlot: value })).toBe(false)
  })

  it('accepts the empty-range example without inventing a range error', () => {
    const example = method.examples.find((ex: any) => ex.name === 'empty-slot-range')
    expect(config(example.params[1].value)).toBe(true)
    expect(example.result.value).toEqual([])
  })
})
