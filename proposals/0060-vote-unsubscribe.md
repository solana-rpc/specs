---
number: 0060
title: Add voteUnsubscribe
authors: [rpcpool]
status: draft
created: 2026-09-14
reference-implementations: [https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc_pubsub.rs#L227]
---

# Add voteUnsubscribe

## Summary

Add the voteUnsubscribe WebSocket RPC method.

## Motivation

Agave exposes this public PubSub lifecycle method.

## Specification

Add the paired WebSocket method page. It defines the connection-scoped cancellation request, true result, and invalid-subscription error.

## Return-type impact

The method returns true after cancellation.

## Compatibility

This is additive. Agave implements it. Cloudbreak and Superbank do not currently implement WebSocket PubSub.

## Reference implementation

[Agave pinned handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc_pubsub.rs#L227)

## Security considerations

Servers release the subscription resources when this call succeeds.
