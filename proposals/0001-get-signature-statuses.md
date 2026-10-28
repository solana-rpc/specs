---
number: 0001
title: Specify getSignatureStatuses
authors: [Triton One]
status: draft
created: 2026-09-02
reference-implementations:
  - https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L1686-L1787
  - https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/signatures.rs#L49-L379
---

# Specify getSignatureStatuses

## Summary

Add the standard `getSignatureStatuses` HTTP method specification.

## Motivation

Clients use this method to determine whether submitted transactions have landed. The method needs a defined response order, cache scope, and historical-search behavior.

## Specification

Add `methods/http/getSignatureStatuses.yaml` and `methods/http/getSignatureStatuses.md`. The method accepts up to 256 signatures and an optional configuration object with `searchTransactionHistory`, `commitment`, and `minContextSlot`. It returns an `RpcResponse` whose value has one status or null entry per input signature. The specification defines recent-cache and finalized-history search behavior.

## Return-type impact

Adds an `RpcResponse` containing an array of nullable signature-status objects.

## Compatibility

Agave conforms. Superbank v0.6.0-rc1 implements the method from cache tiers and ClickHouse history, with the documented configuration, empty-input, malformed-signature, and default-context differences. This is additive for clients.

## Reference implementation

- [Agave request processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L1686-L1787)
- [Superbank v0.6.0-rc1 handler](https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/signatures.rs#L49-L379)

## Security considerations

The 256-signature limit bounds request size and lookup work. Historical searches can read storage, so operators must apply normal RPC request limits.
