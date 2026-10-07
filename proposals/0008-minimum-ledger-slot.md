---
number: 0008
title: Add minimumLedgerSlot
authors: [linuskendall]
status: draft
created: 2026-09-02
reference-implementations:
  - https://github.com/solana-rpc/superbank/blob/v0.6.0-rc1/crates/superbank-rpc/src/handlers/blocks.rs#L2622-L2664
---

# Add minimumLedgerSlot

## Summary

Add the standard HTTP `minimumLedgerSlot` method to the Solana RPC specification.

## Motivation

Clients use the node's ledger floor to explain unavailable historical data and choose an archival source when needed. Agave and shipped Superbank releases implement the method, but this repository does not specify it.

## Specification

Add `methods/http/minimumLedgerSlot.yaml` and its normative Markdown companion. The parameterless method returns the lowest slot for which the node has ledger information.

## Return-type impact

The result is a bare slot integer. No shared schema changes are required.

## Compatibility

This is additive for clients. Agave implements the method. Cloudbreak does not implement it. Superbank reports a ClickHouse storage-retention floor, which approximates but does not exactly reproduce validator blockstore metadata, and returns null while its storage is empty.

## Reference implementation

Superbank v0.6.0-rc1 contains the shipped handler at the pinned source link above. Agave defines the baseline behavior documented by the Solana RPC reference.

## Security considerations

The method has no caller-controlled range or payload. Implementations should still protect the single metadata lookup with ordinary RPC rate limits.
