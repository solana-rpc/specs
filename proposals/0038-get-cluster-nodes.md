---
number: 0038
title: Add getClusterNodes method specification
authors: [rpcpool]
status: draft
created: 2026-09-14
reference-implementations:
  - https://github.com/anza-xyz/agave/tree/6dd9d38771e46103b9680357a855804165612602
---

# Add getClusterNodes method specification

## Summary

Add the public cluster peer inventory query.

## Motivation

Clients need a portable contract for this public Agave RPC method.

## Specification

Add the paired HTTP method files. The result models public RpcContactInfo fields and permits null for optional endpoints and version metadata.

## Return-type impact

Adds the result shape defined by the paired method source.

## Compatibility

This is additive. Agave conforms. Cloudbreak and Superbank do not serve the method.

## Reference implementation

- [Agave handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3769-L3817)

## Security considerations

The method publishes gossip-visible network addresses. Deployments must apply their normal RPC exposure policy.
