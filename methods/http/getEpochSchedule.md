# getEpochSchedule

Returns the epoch schedule parameters for the cluster. The method takes no parameters and returns a bare object, not an `RpcResponse` context envelope.

The [Solana RPC documentation](https://solana.com/docs/rpc/http/getepochschedule) and [Agave implementation](https://github.com/anza-xyz/agave/blob/master/rpc/src/rpc.rs#L924-L929) are the normative baseline for this method.

## Result

The result contains:

- `slotsPerEpoch`: the number of slots in a normal epoch.
- `leaderScheduleSlotOffset`: the slot offset used to calculate leader schedules.
- `warmup`: whether the cluster has warmup epochs.
- `firstNormalEpoch`: the first epoch with `slotsPerEpoch` slots.
- `firstNormalSlot`: the first slot in `firstNormalEpoch`.

All five fields are unsigned 64-bit integers except `warmup`, which is a boolean. Agave reads this schedule from the finalized bank's genesis configuration. Because the schedule is genesis metadata, the method has no commitment parameter.

## Implementation notes

- [**Superbank**](../../implementations/superbank.md): the shipped reference at [`0a77db6`](https://github.com/solana-rpc/superbank/tree/0a77db6fb01191c771994b71e1d7b6ed8500aeca) returns `slotsPerEpoch: 432000`, `leaderScheduleSlotOffset: 432000`, `warmup: false`, `firstNormalEpoch: 0`, and `firstNormalSlot: 0` from the handler. It does not use the configured `GENESIS_PATH` for this RPC response; that setting currently affects only internal `getInflationReward` epoch math.
- [**Superbank**](../../implementations/superbank.md): this is full for clusters with the modern production no-warmup schedule. It is partial for clusters with warmup epochs or different slot parameters because the response remains hard-coded.
