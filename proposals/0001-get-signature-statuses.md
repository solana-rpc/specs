---
number: 0001
title: Specify getSignatureStatuses
authors: [Triton One]
status: draft
created: 2026-09-02
reference-implementations: [https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/signatures.rs]
---

# Specify getSignatureStatuses

## Summary

Add the standard `getSignatureStatuses` HTTP method specification.

## Motivation

Clients use this method to determine whether submitted transactions have landed. The method needs a defined response order, cache scope, and historical-search behavior.

## Specification

Add `methods/http/getSignatureStatuses.yaml` and `methods/http/getSignatureStatuses.md`. The method accepts one to 256 signatures and an optional `searchTransactionHistory` configuration object. It returns an `RpcResponse` whose value has one status or null entry per input signature. The specification defines recent-cache and finalized-history search behavior.

## Return-type impact

Adds an `RpcResponse` containing an array of nullable signature-status objects.

## Compatibility

Agave conforms. Superbank v0.6.0-rc1 implements the method from cache tiers and ClickHouse history, with the documented malformed-signature and default-context differences. Cloudbreak does not serve the method. This is additive for clients.

## Reference implementation

Superbank v0.6.0-rc1 ships the implementation at https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/signatures.rs.

## Security considerations

The 256-signature limit bounds request size and lookup work. Historical searches can read storage, so operators must apply normal RPC request limits.
