---
number: 0011
title: Standardize getTransaction slot lookup
authors: [Triton One]
status: draft
created: 2026-09-02
reference-implementations: [https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/transactions.rs]
---

# Standardize getTransaction slot lookup

## Summary

Add the optional `slot` member to the `getTransaction` configuration object.

## Motivation

A caller can know both a transaction signature and its slot from another RPC response. An exact-slot lookup lets storage-backed implementations avoid a broader signature search and gives callers a deterministic way to reject a same-signature result from another slot.

## Specification

Add optional `config.slot`, a non-negative slot number, to `getTransaction`. When present, the server MUST return a transaction only when the supplied signature is present in that exact slot. It MUST return `null` when the signature is not present there. The field does not change the result shape or the meaning of commitment and encoding fields.

## Return-type impact

None. The method continues to return the existing transaction-or-null result.

## Compatibility

Superbank v0.6.0-rc1 implements an exact signature-and-slot lookup. Agave ignores the unknown field and remains partial until it implements this behavior. Cloudbreak does not serve the method. This is additive for clients that omit the new optional field.

## Reference implementation

Superbank v0.6.0-rc1 ships the implementation at https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/transactions.rs.

## Security considerations

The field narrows a lookup to one slot and has no unbounded input. Implementations must validate it as an unsigned slot number and retain normal request limits.
