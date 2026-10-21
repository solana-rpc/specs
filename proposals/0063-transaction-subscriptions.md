---
number: 0063
title: Standardize transaction subscriptions
authors: [rpcpool]
status: draft
created: 2026-10-21
reference-implementations: [https://github.com/lamports-dev/richat/blob/45e8df4c674d14c7e81c17a30740e31271ee31a7/richat/src/pubsub/solana.rs#L333-L416]
---

# Standardize transaction subscriptions

## Summary

Add the `transactionSubscribe` and `transactionUnsubscribe` WebSocket methods and the `transactionNotification` notification. The subscription filters transactions by vote and failure status, signature, and included, excluded, or required account keys.

## Motivation

Clients that need complete transaction updates currently combine broader block or log subscriptions with client-side filtering. Richat already exposes a transaction-level stream with server-side filters and selectable transaction detail. A standard contract lets other PubSub servers implement the same method without copying an undocumented vendor wire format.

## Specification

Add paired method files for `transactionSubscribe` and `transactionUnsubscribe`. The subscribe method accepts one required filter object and an optional config object. Every configured filter is combined with logical AND. `accounts.include` requires at least one listed key, `accounts.exclude` rejects any listed key, and `accounts.required` requires every listed key. Empty or omitted filters match every transaction.

The config selects commitment, transaction encoding, transaction detail, reward metadata, and the highest supported transaction version. The server returns a numeric subscription id and sends contextual `transactionNotification` messages. Each notification repeats the transaction slot inside its value. The selected detail controls whether the value contains a signature, an encoded transaction with status metadata, or neither. An encoding failure appears in the notification value instead of ending the subscription.

`transactionUnsubscribe` cancels an id owned by the same WebSocket connection. It returns `true` on success and returns `InvalidParams` for an unknown or foreign id.

## Return-type impact

The subscribe response adds a numeric subscription id. `transactionNotification` adds a contextual value with a required `slot` and optional `signature`, `transaction`, or `error`. The unsubscribe response is `true` after cancellation.

## Compatibility

This proposal is additive. Richat implements both methods behind an operator setting. Agave, Cloudbreak, and Superbank do not expose these method names and return `Method not found`.

## Reference implementation

Richat implements the [request filters and config](https://github.com/lamports-dev/richat/blob/45e8df4c674d14c7e81c17a30740e31271ee31a7/richat/src/pubsub/solana.rs#L333-L416), [transaction matching](https://github.com/lamports-dev/richat/blob/45e8df4c674d14c7e81c17a30740e31271ee31a7/richat/src/pubsub/filter.rs#L38-L85), and [`transactionNotification` serialization](https://github.com/lamports-dev/richat/blob/45e8df4c674d14c7e81c17a30740e31271ee31a7/richat/src/pubsub/notification.rs#L130-L201).

## Security considerations

An empty filter matches every transaction and can produce sustained high-bandwidth output. Large account filter sets also increase matching work. Implementations must bound filter sizes, active subscriptions, notification buffering, and per-connection output. Operators should be able to disable the methods.
