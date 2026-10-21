---
number: 0036
title: Add getBlockCommitment method specification
authors: [rpcpool]
status: draft
created: 2026-09-14
reference-implementations:
  - https://github.com/anza-xyz/agave/tree/6dd9d38771e46103b9680357a855804165612602
---

# Add getBlockCommitment method specification

## Summary

Add the public ledger commitment query.

## Motivation

Clients need a portable contract for this public Agave RPC method.

## Specification

Add the paired HTTP method files. The method accepts one slot and returns a nullable stake array with the total stake.

## Return-type impact

Adds the result shape defined by the paired method source.

## Compatibility

This is additive. Agave conforms. Cloudbreak and Superbank do not serve the method.

## Reference implementation

- [Agave handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3383-L3389)

## Security considerations

The method reads public cluster metadata and has a fixed-size request.
