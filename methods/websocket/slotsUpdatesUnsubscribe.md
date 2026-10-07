# slotsUpdatesUnsubscribe

Cancels a subscription created by `slotsUpdatesSubscribe` on the same WebSocket connection and returns `true`. An id that this connection does not hold returns `InvalidParams` (-32602) with the message `Invalid subscription id.`

## Implementation notes

[**Agave**](../../implementations/agave.md) implements this method in the [pinned PubSub trait](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc_pubsub.rs#L189).
