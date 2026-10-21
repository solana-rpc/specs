import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadSpec } from '../src/loader.js'
import { compileWithComponents } from '../src/examples.js'

const spec = loadSpec(fileURLToPath(new URL('../../', import.meta.url)))
const method = spec.methods.find((m) => m.name === 'getTransactionsForAddress')!.yaml
const config = compileWithComponents(method.params[1].schema, spec.schemas)
const result = compileWithComponents(method.result.schema, spec.schemas)
const cursor = compileWithComponents(spec.schemas.TransactionsForAddressCursor, spec.schemas)
const summaryPage = method.examples.find((ex: any) => ex.name === 'signature-page').result.value
const fullPage = method.examples.find((ex: any) => ex.name === 'full-page').result.value
const signature: string = summaryPage.data[0].signature

describe('getTransactionsForAddress request schema', () => {
  it.each([
    {}, { limit: 1001 }, { transactionDetails: 'full', limit: 101 },
    { beforeSlot: 0 }, { beforeSlot: 114, untilSlot: 114 },
    { beforeSlot: 114, filters: { slot: { gte: 100 } } },
    { untilSlot: 100, filters: { slot: { lte: 114 } } },
    { filters: { slot: { gt: 114, lt: 100 } } },
    { filters: { blockTime: { eq: -1 }, signature: { gte: signature } } },
    { filters: { status: 'all', tokenAccounts: 'balanceChanged' } },
  ])('accepts canonical config %j', (value) => { expect(config(value)).toBe(true) })

  it.each([
    { beforeSlot: 114, filters: { slot: { lt: 114 } } },
    { beforeSlot: 114, filters: { slot: { lte: 114 } } },
    { untilSlot: 100, filters: { slot: { gt: 100 } } },
    { untilSlot: 100, filters: { slot: { gte: 100 } } },
    { filters: { slot: { eq: 114 } } },
    { filters: { signature: { eq: signature } } },
  ])('rejects forbidden filter combinations %j', (value) => {
    expect(config(value)).toBe(false)
  })

  it.each([
    { limit: 0 }, { limit: -1 }, { limit: 1.5 }, { limit: '1' },
    { beforeSlot: -1 }, { untilSlot: '100' },
    { transactionDetails: 'accounts' }, { sortOrder: 'newest' },
    { filters: { status: 'success' } }, { filters: { tokenAccounts: 'owned' } },
    { filters: { blockTime: { eq: 'now' } } }, { maxSupportedTransactionVersion: 256 },
  ])('rejects invalid recognized inputs %j', (value) => {
    expect(config(value)).toBe(false)
  })

  it('distinguishes canonical forms from shipped parsing tolerances', () => {
    expect(config({ transactionDetails: 'FULL' })).toBe(false)
    expect(config({ beforeSlot: null })).toBe(false)
    expect(config({ filters: { slot: { eq: null } } })).toBe(false)
    expect(config({ unknownOption: true, filters: { unknownFilter: true } })).toBe(true)
  })
})

describe('getTransactionsForAddress cursor syntax', () => {
  it.each([signature, '0:0', '114:2', '18446744073709551615:4294967295'])(
    'accepts supported cursor form %s', (value) => { expect(cursor(value)).toBe(true) },
  )

  // Width/overflow and existence checks belong to the implementation, not this regex.
  it.each(['', ':2', '114:', '114:2:3', '-1:2', '114:1.5', ' 114:2 ', 'not-a-signature', 114])(
    'rejects malformed canonical cursor %j', (value) => { expect(cursor(value)).toBe(false) },
  )
})

describe('getTransactionsForAddress page variants', () => {
  it.each([summaryPage, fullPage, { data: [], paginationToken: null }])(
    'accepts each distinct result shape', (page) => { expect(result(page)).toBe(true) },
  )

  it.each([
    { data: [], paginationToken: signature },
    { data: summaryPage.data, paginationToken: null },
    { data: fullPage.data, paginationToken: null },
    { data: [...summaryPage.data, ...fullPage.data], paginationToken: signature },
    { data: [{}], paginationToken: signature },
    { data: [] },
  ])('rejects inconsistent or mixed pages', (page) => { expect(result(page)).toBe(false) })

  it.each([signature, '114:2'])('accepts either token form for either detail mode', (token) => {
    expect(result({ ...summaryPage, paginationToken: token })).toBe(true)
    expect(result({ ...fullPage, paginationToken: token })).toBe(true)
  })

  it('validates every declared request and result example', () => {
    for (const example of method.examples) {
      expect(config(example.params[1].value), example.name).toBe(true)
      expect(result(example.result.value), example.name).toBe(true)
    }
  })
})
