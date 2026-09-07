---
number: 0023
title: Standardize getTokenAccountsByMint
authors: [Triton One]
status: draft
created: 2026-09-07
reference-implementations: [https://github.com/solana-rpc/cloudbreak/blob/2dfa7dc286d014f503ea201402a838577bf7702b/crates/api/src/methods/mint_accounts.rs]
---

# Standardize getTokenAccountsByMint

## Summary

Add `getTokenAccountsByMint` as a standard HTTP method based on Cloudbreak's shipped extension.

## Motivation

Clients commonly need every token account for one mint. Expressing this through `getProgramAccounts` requires token layout knowledge and a manual offset-zero memcmp filter. A direct method makes intent explicit and supports implementation-specific mint indexes.

## Specification

Add the method pair. The method accepts a mint pubkey and optional account configuration. `programId` selects the account owner and defaults to the legacy SPL Token program. The result always uses an `RpcResponse` envelope and contains keyed accounts whose first 32 data bytes equal the mint.

## Return-type impact

Adds an `RpcResponse` containing an array of `RpcKeyedAccount` values.

## Compatibility

Cloudbreak ships the method. Agave and Superbank do not serve it and must add it to claim full support after standardization. This is additive for clients.

## Reference implementation

Cloudbreak at `2dfa7dc` ships the implementation at https://github.com/solana-rpc/cloudbreak/blob/2dfa7dc286d014f503ea201402a838577bf7702b/crates/api/src/methods/mint_accounts.rs.

## Security considerations

Mint-wide queries can return large responses. Implementations should index mint bytes and apply request, response, timeout, and concurrency limits.
