# getSignaturesForAddress

Returns signatures for confirmed transactions that include `address` in their
`accountKeys` list — including addresses loaded from lookup tables — ordered
**newest first**. This is the standard way to walk an account's transaction
history; it returns signatures and status summaries only, so each entry
normally needs a follow-up `getTransaction` call to see the transaction
itself.

## Ordering and pagination

Results are ordered by descending slot, and within a slot by descending
position in the block. The cursor pair walks backwards in time:

- `before` — start from the transaction *older* than this signature. The
  signature itself is **excluded**. Omitted, the search starts from the newest
  transaction the node can serve at the requested commitment.
- `until` — stop when this signature is reached. It too is **excluded**, and
  it is only honoured if reached before `limit` entries have been collected.
- `beforeSlot` — start below this slot. The slot is **excluded**, so every returned entry has `slot < beforeSlot`. It is mutually exclusive with `before`.
- `untilSlot` — stop above this slot. The slot is **excluded**, so every returned entry has `slot > untilSlot`. It is mutually exclusive with `until`.
- `limit` — at most this many entries; default and maximum 1000. Values of `0`
  or above 1000 are `InvalidParams` (-32602), message
  `Invalid limit; max 1000`.

To page through history, take the `signature` of the last (oldest) entry of a
page and pass it as `before` on the next call. A short page — fewer than
`limit` entries — means the node has no more matching transactions in range,
not necessarily that the account has no older history: it may simply be beyond
this node's retention.

Slot cursors are whole-slot boundaries. They do not identify a transaction within a slot and cannot replace signature cursors when a caller needs to continue inside a slot. A request containing both `before` and `beforeSlot`, or both `until` and `untilSlot`, is invalid and returns `InvalidParams` (-32602).

Each slot cursor is an unsigned 64-bit integer, including zero. Omission means
no bound on that side. Negative, fractional, string and boolean slot values are
invalid; null is outside the canonical schema. JSON clients must preserve integer
precision above 2^53-1.

Cross-side combinations (`before` with `untilSlot`, or `beforeSlot` with `until`)
are allowed. Both bounds apply together. A slot cursor does not need to identify
an existing block or transaction. Equal or reversed slot bounds, and `beforeSlot:
0`, describe an empty range and return `[]` after normal request validation;
backend errors retain their usual behavior. `untilSlot: 0` excludes slot zero.

For example, if a page ends at transaction index 7 in slot 114, using
`beforeSlot: 114` next skips any remaining transactions in that slot. Use the last
signature as `before` to continue within the slot. Commitment, result shape and
base-method limit semantics are unchanged by the slot extension.

The signature cursors `before` and `until` must identify transactions the node can locate. A `before` or `until`
signature the node cannot find yields `FilterTransactionNotFound` (-32020),
message `Transaction {signature} not found`. This makes cursors from a
different node, or from a range this node has pruned, a hard error rather than
an empty page.

## Commitment and `minContextSlot`

Only `confirmed` and `finalized` are accepted; `processed` is rejected with
`InvalidParams` (-32602), message "Method does not support commitment below
`confirmed`". The default is `finalized`.

`minContextSlot` is enforced against the node's highest super-majority root
and, when it has not been reached, returns `MinContextSlotNotReached` (-32016)
with the node's `contextSlot` in the error `data`. Under `commitment:
confirmed` the bound is applied to the confirmed bank instead.

## Result entries

Each entry carries:

- `signature` — the transaction signature.
- `slot` — the slot that produced the transaction.
- `err` — `null` on success, otherwise the `TransactionError`. A failed
  transaction still appears in the list; it was committed and paid a fee.
- `memo` — SPL Memo content for the transaction, rendered as
  `[byteLength] content` and joined with `; ` when a transaction carries
  several memo instructions. `null` when there was no memo.
- `blockTime` — Unix timestamp in seconds, or `null`.
- `confirmationStatus` — `finalized` for entries at or below the node's
  highest super-majority root, `confirmed` above it.
- `transactionIndex` — position within the block, omitted by nodes and storage
  backends that do not record it.

## Long-term storage

A node with Bigtable configured transparently continues the search into
long-term storage when the local blockstore cannot fill the page. Failures
talking to that storage surface as `LongTermStorageUnreachable` (-32019). A
node with transaction history disabled entirely fails every call with
`TransactionHistoryNotAvailable` (-32011).

## Implementation notes

- **superbank**: served from ClickHouse and optional cache tiers.
  - Parses `commitment` as a raw lowercased string and accepts only
    `confirmed` and `finalized` (plus `processed` as a vendor extension when
    the gRPC head cache is enabled). Agave, by contrast, deserializes the
    Agave `CommitmentConfig` and so also accepts its deprecated aliases.
  - Rejects `limit: 0` with -32602 (matching Agave), but **clamps** a limit
    above the maximum instead of erroring, where Agave rejects it. The default
    and maximum limit are env-tunable; the shipped default is 1000.
  - Supports the proposed `beforeSlot` / `untilSlot` slot cursors and rejects a
    slot cursor combined with its corresponding signature cursor.
  - Optional null cursor values deserialize as absent, so conflicts are checked
    only between non-null values. Unknown option fields are rejected. These are
    implementation details, not additional canonical request forms.
- [**Agave**](https://github.com/solana-rpc/specs/blob/60f4c2fed5b5e23f2b1ed4063f9498489a349a93/implementations/agave.md): implements the base method but not the slot cursor extension. Its pinned [request handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L4293-L4325) accepts signature cursors only.
- **cloudbreak**: method not served (account-state RPC only).
