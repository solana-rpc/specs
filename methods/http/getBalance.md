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

- [**Agave**](../../implementations/agave.md): baseline implementation. See the pinned [request handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L2898-L2907).
- [**Cloudbreak**](../../implementations/cloudbreak.md): the optional `processed-accounts` module serves native `processed`; other deployments reject it or serve confirmed state according to policy. `minContextSlot` failures match Agave. On a filtered index, an account owned by an excluded program returns `0` because the row is absent.
