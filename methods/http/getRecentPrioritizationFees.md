# getRecentPrioritizationFees

Returns recent prioritization fees, optionally for transactions locking the supplied accounts.

## Semantics

Omit accounts to request the node general recent fees. When present, each key must be a valid public key and the list may contain at most MAX_TX_ACCOUNT_LOCKS, currently 128, keys. Each record reports a slot and its fee in micro-lamports.

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [handler and input bound](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L4416-L4436).
