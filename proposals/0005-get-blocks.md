---
number: 0005
title: Add getBlocks
authors: [linuskendall]
status: draft
created: 2026-09-02
reference-implementations:
  - https://github.com/solana-rpc/superbank/blob/v0.6.0-rc1/crates/superbank-rpc/src/handlers/blocks.rs#L1926-L2117
---

# Add getBlocks

## Summary

Add the standard HTTP `getBlocks` method to the Solana RPC specification.

## Motivation

Clients need a sparse list of produced blocks when they scan a slot range. Agave and shipped Superbank releases implement this standard method, but this repository does not yet define it.

## Specification

Add `methods/http/getBlocks.yaml` and its normative Markdown companion. The method takes a required start slot, optional inclusive end slot, and optional commitment configuration. It returns ascending slots that contain blocks and enforces the 500,000-slot range limit.

## Return-type impact

The result is a bare array of slot integers. No shared schema changes are required.

## Compatibility

This is additive for clients. Agave implements the method. Cloudbreak does not implement it. Superbank returns ClickHouse-backed results, requires its optional head cache for `processed`, and does not implement `minContextSlot`.

## Reference implementation

Superbank v0.6.0-rc1 contains the shipped handler at the pinned source link above. Agave defines the baseline behavior documented by the Solana RPC reference.

## Security considerations

The method can read a large metadata range. The 500,000-slot limit bounds one request, and implementations should apply request and database-query limits.
