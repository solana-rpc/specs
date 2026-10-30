---
number: 0043
title: Add sendTransaction method specification
authors: [rpcpool]
status: draft
created: 2026-09-14
reference-implementations:
  - https://github.com/anza-xyz/agave/tree/6dd9d38771e46103b9680357a855804165612602
---

# Add sendTransaction method specification

## Summary

Add the public sendTransaction RPC method.

## Motivation

Clients need a portable contract for this public Agave RPC method.

## Specification

Add the paired HTTP method files. The config makes the two accepted binary encodings and preflight behavior explicit.

## Return-type impact

Adds the result shape defined by the paired method source.

## Compatibility

This is additive. Agave conforms. Cloudbreak and Superbank do not serve the method.

## Reference implementation

- [Agave implementation](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3925-L4068)

## Security considerations

Serialized client input is decoded and can trigger preflight simulation. Nodes must enforce normal RPC size and request limits.
