# getBalance

Returns the lamport balance of the account at the given address, read at the
requested commitment level.

## Semantics

- A nonexistent account returns `value: 0` with a normal context — it is
  **not** an error and **not** `null`.
- `minContextSlot` sets the minimum slot the request may be evaluated at; if
  the node's state at the requested commitment is behind it, the node returns
  `MinContextSlotNotReached` (-32016) with `data.contextSlot`.
- A `pubkey` that is not valid base58 or not 32 bytes is rejected with
  `InvalidParams` (-32602).
- `commitment` defaults to `finalized` when the config object is omitted or
  does not set it.

## Implementation notes

- **cloudbreak**: rejects `processed` commitment with -32003
  `PROCESSED_COMMITMENT_NOT_SUPPORTED` (or silently downgrades to `confirmed`
  when configured). Returns a non-standard error (-32010
  `ACCOUNT_OWNER_EXCLUDED`) when the account exists but its owner program is
  not indexed.
- **superbank**: method not served (history-only RPC).
