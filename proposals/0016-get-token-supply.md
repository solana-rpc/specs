---
number: 0016
title: Specify getTokenSupply
authors: [Triton One]
status: draft
created: 2026-09-07
reference-implementations: [https://github.com/solana-rpc/cloudbreak/blob/2dfa7dc286d014f503ea201402a838577bf7702b/crates/api/src/methods/get_token_supply.rs]
---

# Specify getTokenSupply

## Summary

Add the standard `getTokenSupply` HTTP method specification.

## Motivation

Clients need the current supply and display precision for a token mint without decoding mint account data.

## Specification

Add the method pair. The method accepts a mint pubkey and optional commitment. It returns the raw supply, decimals, nullable numeric UI amount, and exact UI amount string in an `RpcResponse` envelope.

## Return-type impact

Adds an `RpcResponse` containing a token amount object.

## Compatibility

Agave conforms. Cloudbreak supports SPL Token and Token-2022 but rejects or downgrades processed commitment and has index-local error behavior. Superbank does not serve the method. This is additive.

## Reference implementation

Cloudbreak at `2dfa7dc` ships the implementation at https://github.com/solana-rpc/cloudbreak/blob/2dfa7dc286d014f503ea201402a838577bf7702b/crates/api/src/methods/get_token_supply.rs.

## Security considerations

The method performs one bounded mint lookup. Normal request-rate limits cover its resource use.
