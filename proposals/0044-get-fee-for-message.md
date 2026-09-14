---
number: 0044
title: Add getFeeForMessage method specification
authors: [rpcpool]
status: draft
created: 2026-09-14
reference-implementations:
  - https://github.com/anza-xyz/agave/tree/6dd9d38771e46103b9680357a855804165612602
---

# Add getFeeForMessage method specification

## Summary

Add the public getFeeForMessage RPC method.

## Motivation

Clients need a portable contract for this public Agave RPC method.

## Specification

Add the paired HTTP method files. The result uses an RpcResponse envelope with a nullable lamport fee.

## Return-type impact

Adds the result shape defined by the paired method source.

## Compatibility

This is additive. Agave conforms. Cloudbreak and Superbank do not serve the method.

## Reference implementation

- [Agave implementation](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L4381-L4405)

## Security considerations

The method decodes client-provided message bytes. Nodes must apply standard request-size limits.
