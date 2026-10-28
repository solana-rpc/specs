# getSignatureStatuses

Returns one status entry for each requested signature, in the same order as the request. A `null` entry means that the node cannot find a status within the selected search scope; it is not an RPC error.

The pinned [Agave request handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3831-L3856), [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L1686-L1787), and [configuration type](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc-client-types/src/config.rs#L12-L20) are the normative baseline for this method.

## Semantics

- `signatures` may contain up to 256 base58 transaction signatures. An empty array returns an empty result array.
- The response always has the same number of entries as `signatures`. Duplicate input signatures produce duplicate result entries.
- A non-null entry reports the transaction's slot, execution result, and commitment state. `confirmations` is `null` when the status is finalized; otherwise it is the number of confirmations observed by the node.
- `status` duplicates `err` in `Result` form: `{ "Ok": null }` on success or `{ "Err": <TransactionError> }` on failure.
- `commitment` selects the bank used for the recent-status lookup and the response context. It defaults to `processed`.
- `minContextSlot` requires the selected bank to have reached the given slot. A failed check returns `MinContextSlotNotReached` (-32016).

## Historical search

By default the method searches only the selected bank's recent-status cache. Set `searchTransactionHistory: true` to also search finalized transaction history. Nodes that do not keep transaction history return `TransactionHistoryNotAvailable` (-32011) for a historical search.

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [request handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3831-L3856) and [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L1686-L1751).
- [**Superbank**](../../implementations/superbank.md): the pinned v0.6.0-rc1 [handler](https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/signatures.rs#L49-L379) searches its enabled recent cache tiers first. With `searchTransactionHistory: true`, it searches ClickHouse-backed history. It does not honor `commitment` or `minContextSlot`. Without the optional gRPC head cache, its context and non-null results are finalized rather than Agave's processed-bank view. It rejects an empty signature array, while Agave returns an empty result. It returns `null` for a malformed signature, while Agave rejects the whole request with `InvalidParams`.
