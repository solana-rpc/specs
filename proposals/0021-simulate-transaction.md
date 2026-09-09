---
number: 0021
title: Specify simulateTransaction
authors: [Triton One]
status: draft
created: 2026-09-07
reference-implementations: [https://github.com/solana-rpc/cloudbreak/blob/2dfa7dc286d014f503ea201402a838577bf7702b/crates/api/src/methods/simulate_transaction.rs]
---

# Specify simulateTransaction

## Summary

Add the standard `simulateTransaction` HTTP method specification.

## Motivation

Clients simulate signed or unsigned transactions to inspect runtime errors, logs, compute use, return data, requested account state, and balance changes before submission.

## Specification

Add the method pair and register `simulateTransaction` as an emitter of `MinContextSlotNotReached`. The method accepts a base58- or base64-encoded transaction and simulation configuration. It returns an `RpcResponse` containing the complete simulation result shape used by current Agave.

## Return-type impact

Adds the simulation result object and its nullable logs, accounts, resource totals, return data, inner instructions, replacement blockhash, fee, balance arrays, token balance arrays, and loaded addresses.

## Compatibility

Agave conforms. Cloudbreak implements the method only on a full unfiltered account index and reconstructs a runtime view from indexed state. It rejects or downgrades `processed`, and its min-context error payload differs from Agave. Superbank does not serve the method. This is additive.

## Reference implementation

Cloudbreak at `2dfa7dc` ships the implementation at https://github.com/solana-rpc/cloudbreak/blob/2dfa7dc286d014f503ea201402a838577bf7702b/crates/api/src/methods/simulate_transaction.rs.

## Security considerations

Transaction simulation executes untrusted programs and can consume substantial CPU and memory. Implementations must enforce runtime compute, loaded-account-data, request-size, concurrency, and time limits.
