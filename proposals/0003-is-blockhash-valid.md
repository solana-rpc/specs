---
number: 0003
title: Specify isBlockhashValid
authors: [Triton One]
status: draft
created: 2026-09-02
reference-implementations: [https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/blocks.rs]
---

# Specify isBlockhashValid

## Summary

Add the standard `isBlockhashValid` HTTP method specification.

## Motivation

Clients need a direct way to decide whether a transaction's recent blockhash has expired before they submit or retry it. The result must be tied to a selected commitment and bank context.

## Specification

Add `methods/http/isBlockhashValid.yaml` and `methods/http/isBlockhashValid.md`. The method accepts a required base58 blockhash and optional context configuration. It returns an `RpcResponse` containing a boolean and defines invalid-blockhash and minimum-context behavior.

## Return-type impact

Adds an `RpcResponse<bool>` result type.

## Compatibility

Agave conforms. Superbank v0.6.0-rc1 checks a ClickHouse-backed processing-age window and requires its optional head cache for processed commitment. Cloudbreak does not serve the method. This is additive for clients.

## Reference implementation

Superbank v0.6.0-rc1 ships the implementation at https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/blocks.rs.

## Security considerations

The input has fixed size and the lookup is bounded by the recent-blockhash processing window. Implementations must rate-limit calls in the same way as other storage-backed RPC methods.
