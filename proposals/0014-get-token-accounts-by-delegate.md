---
number: 0014
title: Specify getTokenAccountsByDelegate
authors: [Triton One]
status: draft
created: 2026-09-07
reference-implementations: [https://github.com/solana-rpc/cloudbreak/blob/2dfa7dc286d014f503ea201402a838577bf7702b/crates/api/src/http/rpc.rs#L602-L647]
---

# Specify getTokenAccountsByDelegate

## Summary

Add the standard `getTokenAccountsByDelegate` HTTP method specification.

## Motivation

Clients use this method to find token accounts that approved a delegate. The method needs the same filter, encoding, commitment, and response contract as the existing owner query.

## Specification

Add `methods/http/getTokenAccountsByDelegate.yaml` and `methods/http/getTokenAccountsByDelegate.md`. The method accepts a delegate pubkey, exactly one mint or token-program filter, and an optional account configuration. It returns matching keyed token accounts in an `RpcResponse` envelope.

## Return-type impact

Adds an `RpcResponse` containing an array of `RpcKeyedAccount` values.

## Compatibility

Agave conforms. Cloudbreak implements both SPL Token and Token-2022 through its shared owner/delegate handler but does not provide native processed reads. Superbank does not serve the method. This is additive for clients.

## Reference implementation

Cloudbreak at `2dfa7dc` ships the dispatcher and shared handler at https://github.com/solana-rpc/cloudbreak/blob/2dfa7dc286d014f503ea201402a838577bf7702b/crates/api/src/http/rpc.rs#L602-L647 and https://github.com/solana-rpc/cloudbreak/blob/2dfa7dc286d014f503ea201402a838577bf7702b/crates/api/src/methods/token.rs#L159-L234.

## Security considerations

Broad token-account scans can produce large responses. Implementations should bound request and response work with normal RPC limits and indexes.
