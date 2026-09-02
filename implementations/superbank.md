# Superbank

[Superbank](https://github.com/solana-rpc/superbank) is a Solana ledger-history store and JSON-RPC server backed by ClickHouse. It serves standard Solana RPC methods from indexed history and can use optional memory and disk caches for recent data.

This page records compatibility at the reviewed Superbank revision [`0a77db6`](https://github.com/solana-rpc/superbank/tree/0a77db6fb01191c771994b71e1d7b6ed8500aeca). `Full` means Superbank supports the standard request and response contract. Stricter validation and additive extensions do not reduce that rating when standard requests remain compatible. `Partial` identifies a wire-visible or semantic difference that a client can observe.

## Supported methods

- `getSignaturesForAddress`
- `getSignatureStatuses`
- `getTransaction`
- `getBlock`
- `getBlockHeight`
- `getSlot`
- `getTransactionCount`
- `getLatestBlockhash`
- `isBlockhashValid`
- `getBlockTime`
- `getBlocks`
- `getBlocksWithLimit`
- `getHealth`
- `getFirstAvailableBlock`
- `minimumLedgerSlot`
- `getInflationReward`
- `getEpochSchedule`
- `getTransactionsForAddress` (Superbank extension)

## Compatibility

The specs status shown below is the status in this repository at the reviewed revision. A pending status means that a method page does not exist yet.

| Method | Superbank implementation | Compatibility notes |
|---|---|---|
| [`getSignaturesForAddress`](../methods/http/getSignaturesForAddress.md) | Full (spec says full) | Standard calls are compatible. Superbank intentionally rejects deprecated commitment aliases, clamps an excessive limit, and supports optional `beforeSlot` and `untilSlot` cursors. An enabled head cache also supports `processed`. These changes are stricter validation or additive behavior. |
| [`getSignatureStatuses`](../methods/http/getSignatureStatuses.md) | Full (spec pending) | Standard recent-status lookup is supported. `searchTransactionHistory: true` enables ClickHouse history; otherwise the result reflects the configured recent cache tiers. |
| [`getTransaction`](../methods/http/getTransaction.md) | Full (spec says partial) | Standard calls are compatible. Superbank intentionally rejects unknown config fields, adds an optional `slot` lookup hint, and adds detail to some errors. An enabled head cache can serve `processed`. The all-ones signature rejection remains an open edge-case review. |
| [`getBlock`](../methods/http/getBlock.md) | Full (spec says partial) | Standard calls are compatible. `processed` is invalid for this method in both Agave and Superbank. Superbank intentionally rejects unknown config fields and can expose additive transaction-v1 and reward fields. The current method prose incorrectly says that the head cache enables `processed` for `getBlock`. |
| [`getBlockHeight`](../methods/http/getBlockHeight.md) | Full (spec says partial) | Standard calls are compatible. The optional head cache enables `processed`; confirmed and finalized calls fall back to indexed storage. The storage tier is an implementation detail. |
| [`getSlot`](../methods/http/getSlot.md) | Full (spec says partial) | Standard calls are compatible. The optional head cache enables `processed`; other commitments use an eligible cached or stored slot. The data source is an implementation detail. |
| [`getTransactionCount`](../methods/http/getTransactionCount.md) | Full (spec pending) | The standard commitment and `minContextSlot` contract is supported. `processed` requires the optional head cache. |
| [`getLatestBlockhash`](../methods/http/getLatestBlockhash.md) | Full (spec says partial) | Standard calls are compatible. The optional head cache enables `processed` and can supply the newest blockhash before indexed storage. The data source is an implementation detail. |
| [`isBlockhashValid`](../methods/http/isBlockhashValid.md) | Full (spec pending) | The standard blockhash validity response and commitment config are supported against Superbank's indexed or cached chain state. |
| [`getBlockTime`](../methods/http/getBlockTime.md) | Full (spec pending) | The standard block-time lookup is supported from indexed block metadata. |
| [`getBlocks`](../methods/http/getBlocks.md) | Full (spec pending) | The standard inclusive slot-range lookup and commitment rules are supported from indexed block metadata. |
| [`getBlocksWithLimit`](../methods/http/getBlocksWithLimit.md) | Full (spec pending) | The standard start-slot and limit lookup is supported from indexed block metadata. |
| [`getHealth`](../methods/http/getHealth.md) | Partial (spec says partial) | This is a service-local health check. Superbank reports healthy when it can resolve a latest finalized stored slot. It does not implement Agave's validator-local cluster-tip distance, and unhealthy responses always set `numSlotsBehind` to `null`. Agave parity is not intended for this internal method. |
| [`getFirstAvailableBlock`](../methods/http/getFirstAvailableBlock.md) | Partial (spec pending) | Superbank reports the first retained block in indexed storage. It returns `null` when storage is empty, which differs from the standard numeric result contract. |
| [`minimumLedgerSlot`](../methods/http/minimumLedgerSlot.md) | Partial (spec pending) | Superbank reports the lowest slot retained in ClickHouse. This is a practical retention-floor approximation, not validator blockstore metadata. |
| [`getInflationReward`](../methods/http/getInflationReward.md) | Partial (spec pending) | Standard reward objects are supported. Availability follows partition ingestion: Superbank can serve an address as soon as its partition lands and returns explicit errors while the boundary or required partition is unavailable. |
| [`getEpochSchedule`](../methods/http/getEpochSchedule.md) | Partial (spec pending) | The current handler returns the modern mainnet no-warmup schedule as fixed values. It is compatible on clusters with that schedule but does not derive a cluster-specific schedule. |
| [`getTransactionsForAddress`](https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/README.md#L83-L89) | Extension (not in spec) | This is a Superbank method with pagination, sort order, transaction detail selection, and additional filters. Repository policy excludes vendor methods until the RFC process standardizes them. |

## Cross-cutting behavior

Superbank supports JSON-RPC batches with configured size and concurrency limits. Requests without an `id` receive a response with `id: null`; this is compatibility behavior and not strict JSON-RPC notification handling.

`processed` is rejected by default. Builds with the optional gRPC head cache can enable it for `getSignaturesForAddress`, `getSignatureStatuses`, `getTransaction`, `getTransactionsForAddress`, `getBlockHeight`, `getSlot`, `getTransactionCount`, `getLatestBlockhash`, `isBlockhashValid`, `getBlocks`, and `getBlocksWithLimit`. `getBlock` does not support `processed`.
