---
number: 0022
title: Specify getLargestAccounts
authors: [Triton One]
status: draft
created: 2026-09-07
reference-implementations: [https://github.com/solana-rpc/cloudbreak/blob/2dfa7dc286d014f503ea201402a838577bf7702b/crates/api/src/methods/get_largest_accounts.rs]
---

# Specify getLargestAccounts

## Summary

Add the standard `getLargestAccounts` HTTP method specification.

## Motivation

Clients need a standard bounded query for the accounts with the greatest lamport balances, including circulating-supply filters.

## Specification

Add the method pair. The method accepts optional commitment, circulating filter, and result-sorting control. It returns at most 20 account addresses and lamport balances in an `RpcResponse` envelope.

## Return-type impact

Adds an `RpcResponse` containing address and lamport objects.

## Compatibility

Agave conforms. Cloudbreak implements the method only when its largest-accounts feature has a populated record. Superbank does not serve it. This is additive.

## Reference implementation

Cloudbreak at `2dfa7dc` ships the conditional implementation at https://github.com/solana-rpc/cloudbreak/blob/2dfa7dc286d014f503ea201402a838577bf7702b/crates/api/src/methods/get_largest_accounts.rs.

## Security considerations

The 20-entry result bound limits response size. Implementations should maintain or cache the ranking instead of running an unbounded full-state sort per request.
