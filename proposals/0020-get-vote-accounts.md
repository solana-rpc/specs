---
number: 0020
title: Specify getVoteAccounts
authors: [Triton One]
status: draft
created: 2026-09-07
reference-implementations: [https://github.com/solana-rpc/cloudbreak/blob/2dfa7dc286d014f503ea201402a838577bf7702b/crates/api/src/methods/vote_accounts.rs]
---

# Specify getVoteAccounts

## Summary

Add the standard `getVoteAccounts` HTTP method specification.

## Motivation

Clients need current and delinquent validator vote-account state with stake, commission, vote, root, and epoch-credit details.

## Specification

Add the method pair. The method accepts optional commitment, vote-pubkey, unstaked-delinquent, and delinquent-distance controls. It returns current and delinquent arrays of vote account information.

## Return-type impact

Adds a vote-account status object with current and delinquent arrays.

## Compatibility

Agave conforms. Cloudbreak implements the method when Vote and Stake programs are indexed and adds the optional basis-point commission field used by current Agave types. Superbank does not serve it. This is additive.

## Reference implementation

Cloudbreak at `2dfa7dc` ships the implementation at https://github.com/solana-rpc/cloudbreak/blob/2dfa7dc286d014f503ea201402a838577bf7702b/crates/api/src/methods/vote_accounts.rs.

## Security considerations

An unfiltered request can return every validator. Implementations should cache stake calculations and apply response-size and request-rate limits.
