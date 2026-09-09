# getLargestAccounts

Returns the 20 accounts with the greatest lamport balances.

## Parameters

The optional configuration selects commitment and can limit results to circulating or non-circulating accounts. `sortResults` defaults to true. When false, the implementation may return the selected entries without a stable order.

## Result

The result is an `RpcResponse` containing at most 20 objects. Each object has an account address and its lamport balance. Sorted results use descending lamport order.

## Errors

A state scan that fails or exceeds the node's limits returns `ScanError` (-32012).

## Implementation notes

- [**Cloudbreak**](../../implementations/cloudbreak.md) serves this method only when the largest-accounts feature is enabled and has a populated record. It returns -32602 when disabled and InternalError (-32603) when the enabled record is absent. It rejects `processed` with -32003 or serves confirmed state when configured to downgrade. It accepts but ignores `sortResults`; the maintained record remains sorted by descending balance.
