---
number: 0046
title: Add getRecentPrioritizationFees method specification
authors: [rpcpool]
status: draft
created: 2026-09-14
reference-implementations:
  - https://github.com/anza-xyz/agave/tree/6dd9d38771e46103b9680357a855804165612602
---

# Add getRecentPrioritizationFees method specification

## Summary

Add the public getRecentPrioritizationFees RPC method.

## Motivation

Clients need a portable contract for this public Agave RPC method.

## Specification

Add the paired HTTP method files. The optional account list is limited to Agave 128 transaction-account locks.

## Return-type impact

Adds the result shape defined by the paired method source.

## Compatibility

This is additive. Agave conforms. Cloudbreak and Superbank do not serve the method.

## Reference implementation

- [Agave implementation](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L4416-L4436)

## Security considerations

The account-list bound limits work and aligns with the transaction account-lock limit.
