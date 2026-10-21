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

## Exact-slot lookup

The optional `config.slot` is an exact lookup constraint, not an advisory hint.
When supplied, it MUST be an unsigned 64-bit integer (0 through 2^64-1).
Negative, fractional, string and boolean values are invalid. Omitting the field
preserves the ordinary signature lookup; the canonical request schema does not
accept `null` for this field.

A successful non-null result MUST match both the requested signature and slot.
If that signature is absent from the requested slot, the result is `null`, even
when it exists in another slot. A caller can use this constraint to avoid a
broader signature search, but no particular storage strategy is required.
Slot zero is a valid constraint. An unavailable transaction at the requested
commitment still returns `null`; backend failures retain their normal errors
and MUST NOT be translated into proof of absence.

This field does not change commitment, encoding, version gating or the result
shape. The defaults remain finalized commitment and JSON encoding. JSON clients
must preserve integer precision when sending slots above 2^53-1.

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
    and `slot`; any other config member is rejected with -32602, where Agave
    would ignore it. Its `slot` lookup is an exact signature-and-slot query.
  - At the [reference release](https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/transactions.rs#L67-L100),
    omitted and `null` slot values are both treated as absent. This tolerance
    is not required by the canonical request schema; see proposal 0011.
    Matching cache entries may answer before the storage query.
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
- [**Agave**](https://github.com/solana-rpc/specs/blob/60f4c2fed5b5e23f2b1ed4063f9498489a349a93/implementations/agave.md): implements the base method but not the `slot` extension. The pinned [request handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L4279-L4291) ignores `slot` as an unknown config member and performs the normal signature lookup.
- **cloudbreak**: method not served (account-state RPC only).
