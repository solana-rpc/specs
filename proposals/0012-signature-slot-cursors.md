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

Add optional `beforeSlot` and `untilSlot` members to the `getSignaturesForAddress` configuration object. `beforeSlot` excludes that slot and all newer slots, so returned entries have `slot < beforeSlot`. `untilSlot` excludes that slot and all older slots, so returned entries have `slot > untilSlot`. `beforeSlot` MUST NOT be combined with `before`; `untilSlot` MUST NOT be combined with `until`. A request that violates either rule returns `InvalidParams`.

## Return-type impact

None. The method continues to return the existing ordered signature-entry array.

## Compatibility

Superbank v0.6.0-rc1 implements both exclusive slot cursors and rejects conflicting signature cursors. Agave does not implement the new members and is partial. Cloudbreak does not serve the method. This is additive for clients that omit the new optional fields.

## Reference implementation

Superbank v0.6.0-rc1 ships the implementation at https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/signatures.rs.

## Security considerations

Slot cursors bound a query range and do not require a cursor-signature lookup. Implementations must still enforce page-size limits and validate cursor combinations before querying storage.
