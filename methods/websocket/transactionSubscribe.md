# transactionSubscribe

WebSocket-only. Subscribes to transactions that match the requested filter. The call returns a numeric subscription id. The server then sends `transactionNotification` messages on the same connection.

## Filters

All configured filters are combined with logical AND. An empty filter object matches every transaction.

- `vote` matches vote transactions when `true` and non-vote transactions when `false`.
- `failed` matches failed transactions when `true` and successful transactions when `false`.
- `signature` matches one exact transaction signature.
- `accounts.include` requires at least one listed account key.
- `accounts.exclude` rejects a transaction that contains any listed account key.
- `accounts.required` requires every listed account key.

An omitted account list is empty and does not restrict the match. A key can occur anywhere in the transaction's resolved account-key set.

## Config

`commitment` defaults to `finalized`. `encoding` defaults to `base64`. `transactionDetails` defaults to `full`, and `showRewards` defaults to `false`.

When `maxSupportedTransactionVersion` is omitted, only legacy transactions can be encoded. A transaction with a newer version still produces a notification, but its value contains `error` instead of `transaction`.

## Notification wire format

The notification uses the standard JSON-RPC subscription envelope. `params.result.context.slot` and `params.result.value.slot` both identify the transaction slot.

```json
{
  "jsonrpc": "2.0",
  "method": "transactionNotification",
  "params": {
    "result": {
      "context": { "slot": 430 },
      "value": {
        "slot": 430,
        "signature": "5NfHk6JxqzQ54zk5cYBkiM7mj9XodPFdJNbB4z8zTETSV4gTWjSQm3yYAxT9Y7DkVMwq3siB1oX7nWdTUkzHd4Wq"
      }
    },
    "subscription": 1
  }
}
```

The selected `transactionDetails` value controls the notification value:

- `full` includes `transaction` as an `EncodedTransactionWithStatusMeta`.
- `accounts` includes `transaction` with the reduced accounts-list transaction form and reduced status metadata.
- `signatures` includes `signature` and omits `transaction`.
- `none` omits both `signature` and `transaction`.

For `full` and `accounts`, an unsupported transaction version or an internal transaction parse failure omits `transaction` and includes `error`. The error does not cancel the subscription.

Subscriptions are scoped to their WebSocket connection. Closing the connection cancels them.

## Implementation notes

- [**Richat**](https://github.com/lamports-dev/richat) implements this method behind `enable_transaction_subscription`. See the pinned [request parser](https://github.com/lamports-dev/richat/blob/45e8df4c674d14c7e81c17a30740e31271ee31a7/richat/src/pubsub/solana.rs#L333-L393), [filter](https://github.com/lamports-dev/richat/blob/45e8df4c674d14c7e81c17a30740e31271ee31a7/richat/src/pubsub/filter.rs#L38-L85), and [notification encoder](https://github.com/lamports-dev/richat/blob/45e8df4c674d14c7e81c17a30740e31271ee31a7/richat/src/pubsub/notification.rs#L130-L201).
