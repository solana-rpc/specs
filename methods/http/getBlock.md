# getBlock

Returns identity and transaction information about a confirmed block at
`slot`. This is the primary block-history method: what it returns is not one
fixed object but a family of shapes selected by `transactionDetails`,
`rewards`, and `encoding`.

## Commitment

Only `confirmed` and `finalized` are accepted. `processed` — and any
commitment below `confirmed` — is rejected with `InvalidParams` (-32602),
message "Method does not support commitment below `confirmed`". The default is
`finalized`.

A block that is not yet rooted is served only when `commitment: confirmed` was
requested and the slot is an ancestor of the confirmed bank; otherwise the
call fails with `BlockNotAvailable` (-32004) rather than returning `null`.

## Result shape by `transactionDetails`

`previousBlockhash`, `blockhash`, `parentSlot`, `blockTime` and `blockHeight`
are present at every detail level (`blockTime` and `blockHeight` are always
serialized and may be `null`). Beyond those:

- **`full`** (default) — `transactions` is an array of
  `EncodedTransactionWithStatusMeta`. Each entry carries `transaction` in the
  form selected by `encoding`, `meta` (nullable), and `version` (present only
  when `maxSupportedTransactionVersion` was set). `signatures` is absent.
- **`accounts`** — `transactions` is present, but each `transaction` is the
  reduced `UiAccountsList` form: `signatures` plus resolved `accountKeys`,
  with no message body and no instructions. `encoding` is ignored for the
  transaction body. The accompanying `meta` is also reduced: it keeps `err`,
  `status`, `fee`, `preBalances`, `postBalances`, `preTokenBalances`,
  `postTokenBalances` and (unless suppressed) `rewards`, and **omits**
  `innerInstructions`, `logMessages`, `loadedAddresses`, `returnData`,
  `computeUnitsConsumed` and `costUnits`. `signatures` is absent.
- **`signatures`** — `signatures` is a flat array of transaction signature
  strings in block order. `transactions` is absent.
- **`none`** — neither `transactions` nor `signatures` is present. Combined
  with `rewards: true` (the default) this is the cheapest way to read a
  block's rewards.

Orthogonally, `rewards` controls the `rewards` member: it is present (possibly
an empty array) by default and **omitted entirely** when `rewards: false` was
requested. `numRewardPartitions` appears only on epoch-boundary blocks whose
stake rewards were distributed over several blocks (SIMD-0118).

## Result shape by `encoding`

`encoding` selects the wire form of each `transaction` under
`transactionDetails: full`:

- `json` (default) — `{ signatures, message }` with a `UiRawMessage` body:
  flat `accountKeys`, instructions referencing them by index.
- `jsonParsed` — `{ signatures, message }` with a `UiParsedMessage` body:
  `accountKeys` carry `writable`/`signer`/`source`, and instructions are
  parsed where a program parser exists and partially decoded otherwise.
  `meta.loadedAddresses` is omitted under this encoding because lookup-table
  addresses are already folded into `message.accountKeys`.
- `base58` / `base64` — a `[data, encoding]` tuple holding the serialized
  transaction.
- `binary` — the deprecated form: a bare base58 string rather than a tuple.

## Absent blocks and skipped slots

The reference implementation distinguishes several reasons a block cannot be
returned, and most of them are errors rather than a `null` result:

- `BlockNotAvailable` (-32004) — the slot is at or beyond the node's maximum
  root and the block is not (yet) readable, or the slot is unrooted and not
  confirmed.
- `BlockStatusNotAvailableYet` (-32014) — the block exists but the node has
  not finished writing its transaction statuses.
- `SlotSkipped` (-32007) — the slot was skipped by the leader, or is missing
  because the node jumped to a recent snapshot.
- `LongTermStorageSlotSkipped` (-32009) — the same condition, determined from
  long-term (Bigtable) storage.
- `BlockCleanedUp` (-32001) — the slot is below the node's first available
  block; `data`-free, but the message names that first available block.
- `TransactionHistoryNotAvailable` (-32011) — the node runs without
  transaction history enabled and cannot serve the method at all.

A `null` result is reserved for the residual case: the node's read of the
block failed without matching any of the classifications above. Clients MUST
handle both `null` and the error codes; treating only one as "no block" is a
common source of gaps.

## Transaction version gating

`maxSupportedTransactionVersion` is the highest version the caller can decode.
If the block contains a transaction whose version exceeds it, the **whole
request** fails with `UnsupportedTransactionVersion` (-32015) — there is no
partial block. Omitting the parameter entirely means only legacy transactions
are acceptable: any versioned (v0 or later) transaction in the block fails the
request. Send `maxSupportedTransactionVersion: 0` at minimum for mainnet
blocks. When the parameter is omitted, `version` is also omitted from every
returned transaction, for the benefit of clients predating the field.

## Config-object compatibility

The second parameter may also be a bare encoding string
(`"base64"`, `"json"`, …) instead of an object; the reference implementation
accepts it for backwards compatibility. New clients MUST send the object form.
The reference implementation ignores unknown members of the config object.

## Implementation notes

- **superbank**: serves the method from ClickHouse rather than a blockstore.
  - **Rejects unknown config fields** with -32602, where Agave ignores them.
    The accepted set is exactly `encoding`, `transactionDetails`, `rewards`,
    `commitment`, `maxSupportedTransactionVersion`.
  - Rejects `processed` with -32602 (and a `requestedCommitment` member in
    the error `data`, which Agave does not send). Builds compiled with the
    `grpc-head-cache` feature and running with the head cache enabled accept
    `processed` as a vendor extension beyond this spec.
  - Supports transaction v1 (SIMD-0385): a request must send
    `maxSupportedTransactionVersion: 1`, JSON encodings then report
    `version: 1` and expose the inline `message.transactionConfig`, and binary
    encodings preserve the signed v1 wire bytes.
  - Emits `Reward.commissionBps` when the ingested source supplied it; rows
    ingested before the basis-point columns were deployed omit the field and
    it is not inferred from the percentage `commission`.
  - Accepts both `DeactivatedStake` and the historical producer spelling
    `deactivated-stake` on ingest, and emits the typed `DeactivatedStake`
    value.
- **cloudbreak**: method not served (account-state RPC only).
