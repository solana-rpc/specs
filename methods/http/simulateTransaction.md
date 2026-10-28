# simulateTransaction

Simulates a transaction against the node's selected bank state without submitting it.

## Parameters

The first parameter is a serialized transaction encoded as base58 or base64. Base58 is the legacy default and is limited by practical request size. New clients should use base64.

The optional configuration controls signature verification, recent-blockhash replacement, commitment, transaction encoding, returned account state, `minContextSlot`, and inner instructions. `sigVerify` and `replaceRecentBlockhash` cannot both be true. The number of returned account addresses cannot exceed the transaction's account count. Account encoding defaults to base64 and does not support base58.

## Result

The result is an `RpcResponse`. `value.err` is null on success or contains the transaction execution error. Runtime failures are results, not JSON-RPC errors. Logs, requested accounts, compute units, loaded account data size, return data, inner instructions, replacement blockhash, fee, native balance arrays, token balance arrays, and loaded addresses are nullable because availability depends on configuration and where processing stopped.

When blockhash replacement is requested, `replacementBlockhash` contains the hash used for simulation and its last valid block height. Requested accounts preserve request order and use null for an unavailable account or a simulation that failed before account state could be returned.

## Errors

Invalid transaction encoding, malformed transaction bytes, invalid configuration, incompatible signature and blockhash options, or invalid requested account addresses return `InvalidParams` (-32602). Signature verification failure appears in `value.err`. A lagging node returns `MinContextSlotNotReached` (-32016).

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [request handler and processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L4070-L4227).
- [**Cloudbreak**](../../implementations/cloudbreak.md) exposes this method only on a full unfiltered account index. It rejects `processed` with -32602 or serves confirmed state when configured to downgrade. A `minContextSlot` failure uses the standard -32016 payload with `data.contextSlot`. It reconstructs the runtime environment and bank inputs from indexed account and slot state. A 16-case live corpus matched Agave byte for byte in 14 cases; malformed base64 and truncated transaction inputs use the correct -32602 code with different message text.
