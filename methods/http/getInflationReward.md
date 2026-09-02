# getInflationReward

Returns the inflation or staking reward credited to each supplied address for an epoch. The result preserves the input order and contains `null` for an address with no reward data.

The [Solana RPC documentation](https://solana.com/docs/rpc/http/getinflationreward) and [Agave implementation](https://github.com/anza-xyz/agave/blob/v3.1.8/rpc/src/rpc.rs#L696-L889) are the normative baseline for this method.

## Parameters

The first parameter is a required array of base-58 public keys. The optional second parameter is an object with these fields:

- `commitment`: `processed`, `confirmed`, or `finalized`. The default is the implementation's default commitment.
- `epoch`: the epoch to query. When omitted, the implementation uses the epoch immediately before the epoch at the selected commitment.
- `minContextSlot`: require the selected context to have reached this slot.

The array may be empty. Implementations may enforce a maximum address count and must report an invalid-params error when a request exceeds that limit.

## Result

The result is an array with one element per input address, in the same order. Each element is either an object with these fields or `null`:

- `epoch`: the queried epoch.
- `effectiveSlot`: the slot at which the reward became effective.
- `amount`: the reward amount in lamports.
- `postBalance`: the address balance after applying the reward.
- `commission`: the vote-account commission as a whole percent, or `null` when it does not apply.
- `commissionBps`: optional vote-account commission in basis points when the implementation and ingested data provide it.

The returned reward object is not a context envelope. A missing reward is represented by `null`, not by an omitted array element.

## Reward availability

Agave locates rewards at the first confirmed block of the following epoch. If the required boundary block is unavailable, it reports `BlockNotAvailable` (-32004). A gap that prevents the boundary from being identified reports `SlotNotEpochBoundary` (-32018). For partitioned epoch rewards, a request made before the required partitions are complete reports `EpochRewardsPeriodActive` (-32017), with the current slot and block-height details in the error data. Historical data below the node's retention floor may report `BlockCleanedUp` (-32001). A failed `minContextSlot` check reports `MinContextSlotNotReached` (-32016) with the resolved context slot.

## Implementation notes

- **superbank**: the shipped reference at [`0a77db6`](https://github.com/solana-rpc/superbank/tree/0a77db6fb01191c771994b71e1d7b6ed8500aeca) serves this method from ClickHouse. It rejects `processed` with `InvalidParams` (-32602), rejects unknown config fields, and applies a default maximum of 100 addresses.
- **superbank**: the payout boundary may be unavailable (`-32004`), or a requested partition may still be active (`-32017` with `slot`, `currentBlockHeight`, and `rewardsCompleteBlockHeight`). It returns `null` for missing addresses only after the address's required partition is available. Vote rewards at the boundary can be available before all stake-reward partitions complete.
- **superbank**: when `epoch` is omitted, epoch math uses the configured cluster genesis schedule. Without `GENESIS_PATH`, it uses a production no-warmup schedule. The fallback is suitable for modern mainnet and devnet data, but the method is partial for clusters with a different epoch schedule.
- **superbank**: `minContextSlot` is checked against the resolved commitment slot and failures use `-32016` with `contextSlot` in error data. Reward rows may include `commissionBps`; legacy rows without that source field omit it.
- **cloudbreak**: method not served.
