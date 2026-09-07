---
number: 0017
title: Specify getTokenLargestAccounts
authors: [Triton One]
status: draft
created: 2026-09-07
reference-implementations: [https://github.com/solana-rpc/cloudbreak/blob/2dfa7dc286d014f503ea201402a838577bf7702b/crates/api/src/methods/get_token_largest_accounts.rs]
---

# Specify getTokenLargestAccounts

## Summary

Add the standard `getTokenLargestAccounts` HTTP method specification.

## Motivation

Clients need a standard top-holder query with exact token amounts and mint precision.

## Specification

Add the method pair. The method accepts a mint pubkey and optional commitment. It returns up to 20 token-account addresses ordered by descending balance in an `RpcResponse` envelope.

## Return-type impact

Adds an `RpcResponse` containing token-account addresses with flattened token amount fields.

## Compatibility

Agave conforms. Cloudbreak serves configured mints from a maintained record and other mints from SQL, but rejects or downgrades processed commitment and has index-local errors. Superbank does not serve the method. This is additive.

## Reference implementation

Cloudbreak at `2dfa7dc` ships the implementation at https://github.com/solana-rpc/cloudbreak/blob/2dfa7dc286d014f503ea201402a838577bf7702b/crates/api/src/methods/get_token_largest_accounts.rs.

## Security considerations

Implementations must bound the result to 20 entries. Unindexed mint scans can be expensive and need query timeouts and rate limits.
