---
number: 0039
title: Add getRecentPerformanceSamples method specification
authors: [rpcpool]
status: draft
created: 2026-09-14
reference-implementations:
  - https://github.com/anza-xyz/agave/tree/6dd9d38771e46103b9680357a855804165612602
---

# Add getRecentPerformanceSamples method specification

## Summary

Add the public getRecentPerformanceSamples RPC method.

## Motivation

Clients need a portable contract for this public Agave RPC method.

## Specification

Add the paired HTTP method files. The optional limit is bounded to Agave current 720-sample maximum.

## Return-type impact

Adds the result shape defined by the paired method source.

## Compatibility

This is additive. Agave conforms. Cloudbreak and Superbank do not serve the method.

## Reference implementation

- [Agave implementation](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3742-L3766)

## Security considerations

The bounded limit prevents callers from selecting an unbounded blockstore response.
