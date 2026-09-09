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

Add the method pair. The method accepts a mint pubkey and optional account configuration. `programId` selects either the legacy SPL Token program or Token-2022 and defaults to the legacy program. The result always uses an `RpcResponse` envelope and contains keyed accounts whose first 32 data bytes equal the mint. Result order is unspecified.

## Return-type impact

Adds an `RpcResponse` containing an array of `RpcKeyedAccount` values.

## Compatibility

Cloudbreak ships the method, but it currently accepts any indexed owner program rather than only the two token programs. It also rejects or downgrades `processed` and does not reproduce the proposed standard error contract. Agave and Superbank do not serve the method and must add it to claim full support after standardization. The new method is additive for existing clients.

## Reference implementation

Cloudbreak at `2dfa7dc` ships the implementation at https://github.com/solana-rpc/cloudbreak/blob/2dfa7dc286d014f503ea201402a838577bf7702b/crates/api/src/methods/mint_accounts.rs.

## Security considerations

Mint-wide queries can return large responses. Implementations should index mint bytes and apply request, response, timeout, and concurrency limits.
