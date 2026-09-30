---
number: 0007
title: Add getFirstAvailableBlock
authors: [linuskendall]
status: draft
created: 2026-09-02
reference-implementations:
  - https://github.com/solana-rpc/superbank/blob/v0.6.0-rc1/crates/superbank-rpc/src/handlers/blocks.rs#L2512-L2554
---

# Add getFirstAvailableBlock

## Summary

Add the standard HTTP `getFirstAvailableBlock` method to the Solana RPC specification.

## Motivation

Clients need to distinguish a node's retained-history floor from temporary lookup failures. Agave and shipped Superbank releases implement this method, but it is not yet represented in this repository.

## Specification

Add `methods/http/getFirstAvailableBlock.yaml` and its normative Markdown companion. The parameterless method returns the lowest slot for which the node has block data.

## Return-type impact

The result is a bare slot integer. No shared schema changes are required.

## Compatibility

This is additive for clients. Agave implements the method. Cloudbreak does not implement it. Superbank reports its ClickHouse metadata floor, but returns null before any block metadata is indexed.

## Reference implementation

Superbank v0.6.0-rc1 contains the shipped handler at the pinned source link above. Agave defines the baseline behavior documented by the Solana RPC reference.

## Security considerations

The method has no caller-controlled range or payload. Implementations should still protect the single metadata lookup with ordinary RPC rate limits.
