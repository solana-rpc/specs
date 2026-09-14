---
number: 0026
title: Specify getIdentity
authors: [Triton One]
status: draft
created: 2026-09-14
reference-implementations: [https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L2938-L2944]
---

# Specify getIdentity

## Summary

Add the standard `getIdentity` HTTP method specification.

## Motivation

Clients need an interoperable contract for returns the node identity public key.

## Specification

Add the paired HTTP method files. The method parameters, result schema, errors, and examples match the pinned Agave handler.

## Return-type impact

Adds the `getIdentity` result type.

## Compatibility

Agave conforms. Cloudbreak and Superbank do not currently serve this method. This change is additive for clients.

## Reference implementation

Agave implements the method at https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L2938-L2944.

## Security considerations

The method exposes node, ledger, or cluster state that a standard RPC node already serves. Input ranges and limits remain subject to the implementation's existing validation and resource limits.
