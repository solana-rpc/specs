# blockSubscribe

WebSocket-only. Subscribe to block data and content. The request returns a numeric subscription id. Agave then sends `blockNotification` notifications on the same connection.

## Notification wire format

The notification uses JSON-RPC 2.0 with `params.result` as the payload declared in the paired YAML and `params.subscription` as the id returned by this method.

## Semantics

Subscriptions are scoped to the WebSocket connection. Closing the connection cancels them. The reference handler deduplicates compatible active subscriptions and rejects new subscriptions when the node limit is reached. Agave returns `MethodNotFound` unless the validator enables `--rpc-pubsub-enable-block-subscription`, which also requires transaction history.

## Implementation notes

[**Agave**](../../implementations/agave.md) implements this method in the [pinned PubSub trait](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc_pubsub.rs#L201).
