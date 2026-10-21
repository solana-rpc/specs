# accountUnsubscribe

Cancels a subscription created by `accountSubscribe` on the same WebSocket
connection, returning `true`; the subscription set is per-connection, so
closing the socket cancels everything on it without any unsubscribe call.
An id this connection does not currently hold — never issued, already
unsubscribed, or issued on another connection — is rejected with
`InvalidParams` (-32602) carrying the bare message `Invalid subscription id.`
rather than the usual `Invalid params: …` form, so a failed unsubscribe is an
error response, never `false`.

## Implementation notes

- [**Agave**](../../implementations/agave.md): baseline implementation. See the pinned [request handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc_pubsub.rs#L448-L450).

Neither cloudbreak nor superbank serves WebSocket subscriptions.
