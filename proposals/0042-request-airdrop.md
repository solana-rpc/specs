---
number: 0042
title: Add requestAirdrop method specification
authors: [rpcpool]
status: draft
created: 2026-09-14
reference-implementations:
  - https://github.com/anza-xyz/agave/tree/6dd9d38771e46103b9680357a855804165612602
---

# Add requestAirdrop method specification

## Summary

Add the public requestAirdrop RPC method.

## Motivation

Clients need a portable contract for this public Agave RPC method.

## Specification

Add the paired HTTP method files. The method accepts a recipient, lamports, and optional blockhash and commitment configuration, then returns the submitted signature.

## Return-type impact

Adds the result shape defined by the paired method source.

## Compatibility

This is additive. Agave conforms. Cloudbreak and Superbank do not serve the method.

## Reference implementation

- [Agave implementation](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3868-L3922)

## Security considerations

Airdrops spend faucet funds. Operators must rate limit and expose this method only on intended development networks.
