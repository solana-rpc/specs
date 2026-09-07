# getVoteAccounts

Returns validator vote accounts divided into current and delinquent sets.

## Parameters

The optional configuration selects commitment, filters to one vote-account pubkey, controls whether unstaked delinquent accounts are retained, and changes the delinquent slot distance. The default delinquent distance is 128 slots.

## Result

The result contains `current` and `delinquent` arrays. Each entry reports the vote and node pubkeys, active stake, commission, current-epoch membership, up to five recent epoch-credit tuples, last voted slot, and root slot. `inflationRewardsCommissionBps` is optional for compatibility with nodes that predate basis-point commission reporting.

Each epoch-credit tuple is `[epoch, credits, previousCredits]`. A vote account is delinquent when its last vote is at least the configured distance behind the reference slot. Unstaked delinquent accounts are omitted unless requested.

## Implementation notes

- [**Cloudbreak**](../../implementations/cloudbreak.md) requires both Vote and Stake programs in its index. It returns -32602 when the method is disabled and NodeUnhealthy (-32005) while the first stake snapshot is not ready. It derives the reference slot from finalized indexed state.
