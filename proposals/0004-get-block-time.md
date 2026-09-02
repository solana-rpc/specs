---
number: 0004
title: Add getBlockTime
authors: [linuskendall]
status: draft
created: 2026-09-02
reference-implementations:
  - https://github.com/solana-rpc/superbank/blob/v0.6.0-rc1/crates/superbank-rpc/src/handlers/blocks.rs#L1777-L1924
---

# Add getBlockTime

## Summary

Add the standard HTTP `getBlockTime` method to the Solana RPC specification.

## Motivation

Clients use block time to present block history and to correlate on-chain events with external systems. The method is implemented by Agave and by shipped Superbank releases, but it is not yet represented in this repository.

## Specification

Add `methods/http/getBlockTime.yaml` and its normative Markdown companion. The method takes one required slot and returns the estimated Unix timestamp for its block, or `null` when that block has no recorded timestamp.

## Return-type impact

The result is a bare signed integer or `null`. No shared schema changes are required.

## Compatibility

This is additive for clients. Agave implements the method. Cloudbreak does not implement it. Superbank serves stored block times, but returns `LongTermStorageSlotSkipped` for a missing or skipped slot where this specification permits a null result.

## Reference implementation

Superbank v0.6.0-rc1 contains the shipped handler at the pinned source link above. Agave defines the baseline behavior documented by the Solana RPC reference.

## Security considerations

The method accepts one bounded scalar input and returns one scalar value. Implementations should still rate-limit storage lookups to prevent high-volume historical scans.
