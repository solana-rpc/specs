---
number: 0037
title: Add getSupply method specification
authors: [rpcpool]
status: draft
created: 2026-09-14
reference-implementations:
  - https://github.com/anza-xyz/agave/tree/6dd9d38771e46103b9680357a855804165612602
---

# Add getSupply method specification

## Summary

Add the public supply query.

## Motivation

Clients need a portable contract for this public Agave RPC method.

## Specification

Add the paired HTTP method files. The result is an RpcResponse envelope whose value contains lamport totals and an optional non-circulating account list.

## Return-type impact

Adds the result shape defined by the paired method source.

## Compatibility

This is additive. Agave conforms. Cloudbreak and Superbank do not serve the method.

## Reference implementation

- [Agave handler and processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L1126-L1153)

## Security considerations

Requesting the account list exposes public account identities and can require a supply scan. Clients can set the exclusion flag.
