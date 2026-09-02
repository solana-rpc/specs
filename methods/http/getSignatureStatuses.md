# getSignatureStatuses

Returns one status entry for each requested signature, in the same order as the request. A `null` entry means that the node cannot find a status within the selected search scope; it is not an RPC error.

## Semantics

- `signatures` must contain from one to 256 base58 transaction signatures.
- The response always has the same number of entries as `signatures`. Duplicate input signatures produce duplicate result entries.
- A non-null entry reports the transaction's slot, execution result, and commitment state. `confirmations` is `null` when the status is finalized; otherwise it is the number of confirmations observed by the node.
- `status` duplicates `err` in `Result` form: `{ "Ok": null }` on success or `{ "Err": <TransactionError> }` on failure.
- The context slot is the processed bank used for the lookup. It is not a commitment argument because this method has no `commitment` configuration.

## Historical search

By default the method searches only the node's recent-status cache. Set `searchTransactionHistory: true` to also search finalized transaction history. Nodes that do not keep transaction history return `TransactionHistoryNotAvailable` (-32011) for a historical search.

## Implementation notes

- **superbank**: searches its enabled recent cache tiers first. With `searchTransactionHistory: true`, it searches ClickHouse-backed history. Without the optional gRPC head cache, its context and non-null results are finalized rather than Agave's processed-bank view. It accepts a malformed signature in the input array and returns `null` at that position; Agave rejects the whole request with `InvalidParams`.
- **cloudbreak**: method not served.
