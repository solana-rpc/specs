---
number: 0002
title: Specify getTransactionCount
authors: [Triton One]
status: draft
created: 2026-09-02
reference-implementations: [https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/blocks.rs]
---

# Specify getTransactionCount

## Summary

Add the standard `getTransactionCount` HTTP method specification.

## Motivation

Clients use the transaction count as a ledger-progress counter. They need to know that it is a commitment-selected cumulative value and how `minContextSlot` applies.

## Specification

Add `methods/http/getTransactionCount.yaml` and `methods/http/getTransactionCount.md`. The method accepts an optional context configuration and returns the selected bank's cumulative transaction count as a bare unsigned integer. The specification defines the default commitment and `MinContextSlotNotReached` behavior.

## Return-type impact

Adds one bare `U64` result type.

## Compatibility

Agave conforms. Superbank v0.6.0-rc1 derives the result from ClickHouse and supports processed commitment only with its optional head cache. Cloudbreak does not serve the method. This is additive for clients.

## Reference implementation

Superbank v0.6.0-rc1 ships the implementation at https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/blocks.rs.

## Security considerations

The method has no caller-controlled scan range. Implementations still need normal storage-query timeouts and request limits.
