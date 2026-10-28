---
number: 0021
title: Specify simulateTransaction
authors: [Triton One]
status: draft
created: 2026-09-07
reference-implementations:
  - https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L4070-L4227
  - https://github.com/solana-rpc/cloudbreak/blob/4b2f28e40b0c984538a57874c4bac3697fccaaec/crates/api/src/methods/simulate_transaction.rs#L71-L300
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

Agave conforms. Cloudbreak implements the method only on a full unfiltered account index and reconstructs a runtime view from indexed state. It rejects or downgrades `processed`. Its min-context error payload matches Agave, and 14 of 16 live corpus cases were byte-identical. The other two use the standard `InvalidParams` code with different message text. This is additive.

## Reference implementation

- [Agave request handler and processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L4070-L4227)
- [Cloudbreak at `4b2f28e`](https://github.com/solana-rpc/cloudbreak/blob/4b2f28e40b0c984538a57874c4bac3697fccaaec/crates/api/src/methods/simulate_transaction.rs#L71-L300)

## Security considerations

Transaction simulation executes untrusted programs and can consume substantial CPU and memory. Implementations must enforce runtime compute, loaded-account-data, request-size, concurrency, and time limits.
