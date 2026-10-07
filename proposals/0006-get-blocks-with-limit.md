---
number: 0006
title: Add getBlocksWithLimit
authors: [linuskendall]
status: draft
created: 2026-09-02
reference-implementations:
  - https://github.com/solana-rpc/superbank/blob/v0.6.0-rc1/crates/superbank-rpc/src/handlers/blocks.rs#L2119-L2222
---

# Add getBlocksWithLimit

## Summary

Add the standard HTTP `getBlocksWithLimit` method to the Solana RPC specification.

## Motivation

Range scanners often need a bounded page of produced blocks rather than every slot in an interval. Agave and shipped Superbank releases implement this standard method, but it is absent from this repository.

## Specification

Add `methods/http/getBlocksWithLimit.yaml` and its normative Markdown companion. The method accepts a start slot, a required limit of at most 500,000, and optional commitment configuration. It returns an ascending sparse list of slots with blocks.

## Return-type impact

The result is a bare array of slot integers. No shared schema changes are required.

## Compatibility

This is additive for clients. Agave implements the method. Cloudbreak does not implement it. Superbank returns ClickHouse-backed results, requires its optional head cache for `processed`, and does not implement `minContextSlot`.

## Reference implementation

Superbank v0.6.0-rc1 contains the shipped handler at the pinned source link above. Agave defines the baseline behavior documented by the Solana RPC reference.

## Security considerations

The method can force a storage scan across a large slot range. The 500,000 limit bounds one request, and implementations should apply request and database-query limits.
