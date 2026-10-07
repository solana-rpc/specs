---
number: 0047
title: Add programSubscribe
authors: [rpcpool]
status: draft
created: 2026-09-14
reference-implementations: [https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc_pubsub.rs#L89]
---

# Add programSubscribe

## Summary

Add the programSubscribe WebSocket RPC method and its programNotification notification.

## Motivation

Agave exposes this public PubSub method. A standard method page lets clients and alternative implementations use one contract.

## Specification

Add the paired WebSocket method page. It defines the request, subscription id, notification name and payload, and the connection-scoped lifecycle.

## Return-type impact

The subscribe response is a numeric subscription id. Notifications carry the method-specific payload.

## Compatibility

This is additive. Agave implements it. Cloudbreak and Superbank do not currently implement WebSocket PubSub.

## Reference implementation

[Agave pinned handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc_pubsub.rs#L89)

## Security considerations

Servers must bound active subscriptions and release them when the connection closes.
