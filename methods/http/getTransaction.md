# getTransaction

Returns a confirmed transaction and its status metadata, looked up by
signature. The transaction body is `EncodedTransaction` in the form selected
by `encoding`, and `meta` is the same `UiTransactionStatusMeta` that appears
inside `getBlock`.

## Not found is `null`, never an error

A signature the node cannot find — never submitted, dropped before
confirmation, or older than the node's history — produces a `null` result with
no error object. The same is true for a transaction that exists but has not
reached the requested commitment. Clients MUST NOT treat `null` as a protocol
failure; it is the normal negative answer, and polling for a freshly submitted
signature will see `null` until the transaction is confirmed.

The one "no history" case that *is* an error is a node running without
transaction history enabled at all: that fails every call with
`TransactionHistoryNotAvailable` (-32011).

## Commitment

Only `confirmed` and `finalized` are accepted; `processed` is rejected with
`InvalidParams` (-32602), message "Method does not support commitment below
`confirmed`". The default is `finalized`. Under `confirmed`, a transaction in
an unrooted but confirmed slot is returned and its `blockTime` may be filled
in from the live bank; under `finalized`, only rooted transactions are
returned.

## Result members

- `slot` — the slot containing the transaction.
- `transaction` — the transaction body, encoded per `encoding` (`json`
  default, `jsonParsed`, `base58`, `base64`, or the deprecated bare-base58
  `binary`). The `accounts` form never appears here; it exists only for
  `getBlock`.
- `meta` — status metadata, or `null` for very old transactions stored without
  it. Members are variously nulled or omitted when unavailable — see the
  `UiTransactionStatusMeta` schema. Unlike `getBlock`, rewards are never
  suppressed here: there is no `rewards` config flag.
- `version` — present only when `maxSupportedTransactionVersion` was set.
- `blockTime` — always serialized, `null` when the node cannot determine it.
- `transactionIndex` — the transaction's position within its block; omitted by
  nodes and storage backends that do not record it.

## Transaction version gating

Identical to `getBlock`. `maxSupportedTransactionVersion` is the highest
version the caller can decode; a transaction above it fails the request with
`UnsupportedTransactionVersion` (-32015). Omitting the parameter means only
legacy transactions are acceptable — a v0 transaction then errors rather than
returning — and also suppresses `version` in the response.

## Config-object compatibility

As with `getBlock`, the second parameter may be a bare encoding string instead
of an object; the reference implementation accepts it for backwards
compatibility, and new clients MUST send the object form. Unknown members of
the config object are ignored by the reference implementation.

## Implementation notes

- **superbank**:
  - Accepts only `encoding`, `commitment`, `maxSupportedTransactionVersion`,
    plus a vendor `slot` hint that is **not** part of this spec; any other
    config member is rejected with -32602, where Agave would ignore it.
  - Rejects the all-ones signature
    (`1111111111111111111111111111111111111111111111111111111111111111`) as an
    invalid signature rather than looking it up.
  - Rejects `processed` with -32602 (and a `requestedCommitment` member in
    the error `data`, which Agave does not send). Builds compiled with the
    `grpc-head-cache` feature and running with the head cache enabled accept
    `processed` as a vendor extension beyond this spec.
  - Supports transaction v1 (SIMD-0385) when the request sends
    `maxSupportedTransactionVersion: 1`; JSON encodings then report
    `version: 1` and expose `message.transactionConfig`.
- **cloudbreak**: method not served (account-state RPC only).
