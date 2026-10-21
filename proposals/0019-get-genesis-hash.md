---
number: 0019
title: Specify getGenesisHash
authors: [Triton One]
status: draft
created: 2026-09-07
reference-implementations: [https://github.com/solana-rpc/cloudbreak/blob/2dfa7dc286d014f503ea201402a838577bf7702b/crates/api/src/methods/genesis.rs]
---

# Specify getGenesisHash

## Summary

Add the standard `getGenesisHash` HTTP method specification.

## Motivation

Clients use the genesis hash to identify the cluster and prevent cross-cluster mistakes.

## Specification

Add the method pair. The method has no parameters and returns the base58-encoded genesis hash.

## Return-type impact

Adds a hash string result.

## Compatibility

Agave and Cloudbreak conform. Superbank does not serve the method. This is additive.

## Reference implementation

Cloudbreak at `2dfa7dc` ships the implementation at https://github.com/solana-rpc/cloudbreak/blob/2dfa7dc286d014f503ea201402a838577bf7702b/crates/api/src/methods/genesis.rs.

## Security considerations

The genesis hash is public cluster identity data. No additional risk is introduced.
