---
number: 0015
title: Specify getTokenAccountBalance
authors: [Triton One]
status: draft
created: 2026-09-07
reference-implementations: [https://github.com/solana-rpc/cloudbreak/blob/2dfa7dc286d014f503ea201402a838577bf7702b/crates/api/src/methods/get_token_account_balance.rs]
---

# Specify getTokenAccountBalance

## Summary

Add the standard `getTokenAccountBalance` HTTP method specification.

## Motivation

Clients need a stable integer and display balance for one token account without decoding token account data and mint decimals themselves.

## Specification

Add the method pair. The method accepts a token-account pubkey and optional commitment. It returns the raw amount, decimals, nullable numeric UI amount, and exact UI amount string in an `RpcResponse` envelope.

## Return-type impact

Adds an `RpcResponse` containing a token amount object.

## Compatibility

Agave conforms. Cloudbreak supports SPL Token and Token-2022 but rejects or downgrades processed commitment and has index-local error behavior. Superbank does not serve the method. This is additive.

## Reference implementation

Cloudbreak at `2dfa7dc` ships the implementation at https://github.com/solana-rpc/cloudbreak/blob/2dfa7dc286d014f503ea201402a838577bf7702b/crates/api/src/methods/get_token_account_balance.rs.

## Security considerations

The method performs bounded account and mint lookups. Normal request-rate limits cover its resource use.
