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

Neither cloudbreak nor superbank serves WebSocket subscriptions.
