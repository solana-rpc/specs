# simulateTransaction

Simulates a transaction against the node's selected bank state without submitting it.

## Parameters

The first parameter is a signed transaction encoded as base58 or base64. Base58 is the legacy default and is limited by practical request size. New clients should use base64.

The optional configuration controls signature verification, recent-blockhash replacement, commitment, transaction encoding, returned account state, `minContextSlot`, and inner instructions. `sigVerify` and `replaceRecentBlockhash` cannot both be true. Returned account addresses must come from the transaction's account list. Account encoding defaults to base64 and does not support base58.

## Result

The result is an `RpcResponse`. `value.err` is null on success or contains the transaction execution error. Runtime failures are results, not JSON-RPC errors. Logs, requested accounts, compute units, loaded account data size, return data, inner instructions, replacement blockhash, fee, native balance arrays, token balance arrays, and loaded addresses are nullable because availability depends on configuration and where processing stopped.

When blockhash replacement is requested, `replacementBlockhash` contains the hash used for simulation and its last valid block height. Requested accounts preserve request order and use null for an unavailable account or a simulation that failed before account state could be returned.

## Errors

Invalid transaction encoding, malformed transaction bytes, invalid configuration, incompatible signature and blockhash options, signature verification failure, or invalid requested account addresses return `InvalidParams` (-32602). A lagging node returns `MinContextSlotNotReached` (-32016).

## Implementation notes

- [**Cloudbreak**](../../implementations/cloudbreak.md) exposes this method only on a full unfiltered account index. It reconstructs the runtime environment and bank inputs from indexed account and slot state. Standard conformance needs live comparison across successful execution, runtime errors, nonce transactions, address tables, returned accounts, feature gates, and replacement blockhashes.
