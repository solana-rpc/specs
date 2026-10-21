# transactionUnsubscribe

Cancels a subscription created by `transactionSubscribe` on the same WebSocket connection and returns `true`. An id that this connection does not hold returns `InvalidParams` (-32602) with the message `Invalid subscription id.`

When transaction subscriptions are disabled, this method returns `MethodNotFound` (-32601).

## Implementation notes

- [**Richat**](https://github.com/lamports-dev/richat) implements this method behind `enable_transaction_subscription`. See the pinned [request parser and feature gate](https://github.com/lamports-dev/richat/blob/45e8df4c674d14c7e81c17a30740e31271ee31a7/richat/src/pubsub/solana.rs#L394-L416) and [unsubscribe response path](https://github.com/lamports-dev/richat/blob/45e8df4c674d14c7e81c17a30740e31271ee31a7/richat/src/pubsub/server.rs#L319-L345).
