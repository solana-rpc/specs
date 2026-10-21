---
number: 0012
title: Standardize getSignaturesForAddress slot cursors
authors: [Triton One]
status: draft
created: 2026-09-02
reference-implementations: [https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/signatures.rs]
---

# Standardize getSignaturesForAddress slot cursors

## Summary

Add optional exclusive `beforeSlot` and `untilSlot` cursors to `getSignaturesForAddress`.

## Motivation

Callers can know a slot range without knowing boundary transaction signatures. Whole-slot bounds make bounded history scans possible without a cursor lookup and give storage-backed implementations simple shard-friendly predicates.

## Specification

Add optional `beforeSlot` and `untilSlot` members to the `getSignaturesForAddress` configuration object. `beforeSlot` excludes that slot and all newer slots, so returned entries have `slot < beforeSlot`. `untilSlot` excludes that slot and all older slots, so returned entries have `slot > untilSlot`. `beforeSlot` MUST NOT be combined with `before`; `untilSlot` MUST NOT be combined with `until`. A request that violates either rule returns `InvalidParams` (-32602). Both fields are optional u64 integers; cross-side signature/slot combinations are allowed. Bounds intersect: equal or reversed bounds and beforeSlot zero describe empty ranges, not a new error. Slot cursors do not require a transaction or block at the boundary. They cannot resume within a slot; clients must use signature cursors for that. The canonical schema requires numbers, while Superbank treats null as omission.

## Return-type impact

None. The method continues to return the existing ordered signature-entry array.

## Compatibility

Superbank v0.6.0-rc1 implements both exclusive slot cursors and rejects conflicting signature cursors. Agave does not implement the new members and is partial. Cloudbreak does not serve the method. This is additive for clients that omit the new optional fields.

## Reference implementation

Superbank v0.6.0-rc1 ships the implementation at https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/signatures.rs.

## Security considerations

Slot cursors bound a query range and do not require a cursor-signature lookup. Implementations must still enforce page-size limits and validate cursor combinations before querying storage.

## Evidence and validation

The reference is the published [v0.6.0-rc1 release](https://github.com/solana-rpc/superbank/releases/tag/v0.6.0-rc1), resolved to `0a77db6fb01191c771994b71e1d7b6ed8500aeca`.

| Evidence | What it establishes |
| --- | --- |
| [Request types](https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/types.rs#L12-L33), [handler](https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/signatures.rs#L437-L554) | Optional u64 fields, null tolerance, strict option names and same-side conflicts; zero limits rejected and oversized limits clamped. |
| [Boundary predicates](https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/clickhouse/queries.rs#L575-L654) | Strict whole-slot comparisons and intersection with positional bounds. |
| [Conflict tests](https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/tests/mod.rs#L1212-L1259), [head-cache boundary test](https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/tests/mod.rs#L5651-L5707) | Existing targeted coverage at the release revision; not proof of every storage path. |

The paired examples cover bounded and empty ranges. The actual config schema is
checked by `tooling/test/signature-slot-cursors.test.ts`, including forbidden
same-side pairs and allowed cross-side pairs. These tests do not execute range
queries. The shared Slot schema omits the u64 maximum; lossless large-integer
handling and boundary semantics require implementation validation. No current
deployment or live extension-conformance claim is made.

## Unresolved standardization questions

- Should null-as-absent be standardized or remain Superbank tolerance? The draft
  keeps numeric canonical fields; it does not equate a null-valued key with a
  conflicting populated cursor in the implementation evidence.
- Should the support matrix distinguish extension support from base-method
  deviations? Superbank implements these cursors, but its configurable/clamped
  limit differs from the base specification's fixed maximum and error behavior.
  The existing rating is retained pending that classification decision.
- Does the proposed empty-range behavior meet implementers' expectations? The
  draft follows the shipped strict predicates and does not add range errors.

The proposal changes neither response fields nor limit policy. Acceptance needs
two maintainers representing different implementations under GOVERNANCE.md; the
minor-version bump must be sequenced with other RFCs before merge.
