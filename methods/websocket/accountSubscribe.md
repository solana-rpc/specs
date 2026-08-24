# accountSubscribe

WebSocket-only. Subscribes to an account; the server pushes an
`accountNotification` JSON-RPC notification each time the account is modified
in a slot that reaches the requested commitment. The subscribe call itself
returns only a subscription id — there is no initial snapshot notification.

## Notification wire format

```json
{
  "jsonrpc": "2.0",
  "method": "accountNotification",
  "params": {
    "result": {
      "context": { "slot": 5199307 },
      "value": {
        "lamports": 33594,
        "data": ["", "base64"],
        "owner": "11111111111111111111111111111111",
        "executable": false,
        "rentEpoch": 635,
        "space": 0
      }
    },
    "subscription": 23784
  }
}
```

The reference implementation serializes `result` before `subscription` and
omits `apiVersion` from `context` — unlike the HTTP account methods, whose
`context` may carry it. Member order is not significant to JSON parsers, but
the absent `apiVersion` is: do not require it on notifications.

## Config

The config object is the same wire type as `getAccountInfo`'s
(`RpcAccountInfoConfig`), so all four of its members deserialize here, but
they are not all honoured:

- `commitment` — honoured; defaults to `finalized`. It selects which slot the
  watcher compares against (`processed` = the node's current slot,
  `confirmed` = highest confirmed, `finalized` = highest super-majority root).
- `encoding` — honoured; defaults to the legacy `binary` encoding, whose data
  is a **bare base58 string**, not a `[data, encoding]` tuple. As on
  `getAccountInfo`, clients that omit `encoding` must accept that variant.
- `dataSlice` — accepted, and it participates in the subscription's identity,
  but it is **not applied** to notification payloads: the notification encoder
  is called with no slice, so every notification carries the account's full
  data. Two subscriptions differing only in `dataSlice` are nonetheless
  distinct subscriptions with distinct ids.
- `minContextSlot` — accepted and silently ignored. A subscription has no
  context floor, so `MinContextSlotNotReached` is never raised here.

## Semantics

- Notifications fire per slot in which the account was modified, once that
  slot satisfies the requested commitment. An unchanged account produces no
  traffic.
- On a fork rollback the node re-notifies with the reverted state: the
  watcher compares the account's last-modified slot against the last slot it
  notified for, and any difference — forward or backward — emits a
  notification. Clients subscribing below `finalized` must handle that.
- A deleted (or never-created) account is reported as a zeroed account —
  `lamports: 0`, empty data, `owner: 11111111111111111111111111111111` —
  rather than as `null` or a dropped subscription.
- Subscriptions are deduplicated by their full parameter set (pubkey,
  commitment, encoding, dataSlice). Subscribing twice with identical params
  returns the **same** subscription id, and on a single connection the second
  call does not create a second cancellable entry: one `accountUnsubscribe`
  cancels it.
- Subscriptions are per-connection. Closing the WebSocket drops every
  subscription on it; no explicit unsubscribe is required.
- A `pubkey` that is not valid base58 or not 32 bytes is rejected with
  `InvalidParams` (-32602), message
  `Invalid Request: Invalid pubkey provided`.
- When the node is at its subscription cap
  (`--rpc-pubsub-max-active-subscriptions`, default 1,000,000) the call fails with `InternalError` (-32603), message
  `Internal Error: Subscription refused. Node subscription limit reached`.
  The cap counts live subscribers, so deduplicated duplicates each consume a
  slot.

## Implementation notes

Neither cloudbreak nor superbank serves WebSocket subscriptions.
