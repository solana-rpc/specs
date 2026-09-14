---
number: 0045
title: Add getStakeMinimumDelegation method specification
authors: [rpcpool]
status: draft
created: 2026-09-14
reference-implementations:
  - https://github.com/anza-xyz/agave/tree/6dd9d38771e46103b9680357a855804165612602
---

# Add getStakeMinimumDelegation method specification

## Summary

Add the public getStakeMinimumDelegation RPC method.

## Motivation

Clients need a portable contract for this public Agave RPC method.

## Specification

Add the paired HTTP method files. The result is a context envelope around an unsigned lamport value.

## Return-type impact

Adds the result shape defined by the paired method source.

## Compatibility

This is additive. Agave conforms. Cloudbreak and Superbank do not serve the method.

## Reference implementation

- [Agave implementation](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L4407-L4414)

## Security considerations

The method reads public bank configuration.
