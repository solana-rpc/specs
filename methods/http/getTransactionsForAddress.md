# getTransactionsForAddress

Returns a cursor-paginated history of transactions that involve `address`. The default page contains transaction summaries. Set `transactionDetails` to `full` to receive encoded transactions and status metadata.

## Semantics

- A normal lookup returns transactions whose account-key list contains `address`. `filters.tokenAccounts: all` also includes transactions for token accounts owned by `address`; `balanceChanged` includes only those with a token-balance change.
- Results are ordered by `(slot, transactionIndex, signature)`. The default order is descending. `sortOrder: asc` reverses all three keys.
- `paginationToken` is an exclusive cursor for that order. It is either a transaction signature or a `slot:transactionIndex` position. The response returns the cursor for its last item, or `null` for an empty page. Clients must retain every filter and ordering option when they request the next page.
- `limit` defaults to 1,000 for summary pages and 100 for full pages. Implementations may apply a lower configured cap and return fewer records than requested. A limit of zero is invalid.
- `filters.slot` accepts `gte`, `gt`, `lte`, and `lt`. `beforeSlot` is the exclusive alias for `filters.slot.lt`; `untilSlot` is the exclusive alias for `filters.slot.gt`. `beforeSlot` cannot be combined with `lt` or `lte`, and `untilSlot` cannot be combined with `gt` or `gte`.
- `filters.blockTime` accepts all five comparison operators, including `eq`. `filters.signature` accepts `gte`, `gt`, `lte`, and `lt`; its bounds resolve to transaction positions rather than lexicographic signature order. `filters.status` selects any/all, succeeded, or failed records.
- `encoding` and `maxSupportedTransactionVersion` affect only full pages. A request whose page includes a transaction version above `maxSupportedTransactionVersion` fails with `UnsupportedTransactionVersion` (-32015).
- `commitment` defaults to `finalized`. `minContextSlot` rejects a request with `MinContextSlotNotReached` (-32016) when the node cannot meet the requested context floor.

## Implementation notes

- [**Superbank**](../../implementations/superbank.md): is the reference implementation. `tokenAccounts` requires its optional token-owner activity data; requests for a non-`none` token filter fail with `InvalidParams` when that data is unavailable.
- [**Superbank**](../../implementations/superbank.md): accepts only `json`, `jsonParsed`, `base58`, and `base64` for full pages. It accepts option values case-insensitively and ignores unknown option and filter members. `processed` requires the optional gRPC head cache; otherwise it fails with `InvalidParams`.
