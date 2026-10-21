# Yellowstone Jet

[Yellowstone Jet](https://github.com/rpcpool/yellowstone-jet) is a transaction sender that accepts Solana JSON-RPC `sendTransaction` requests and forwards transactions directly to validator TPU endpoints over QUIC.

This page records compatibility at the reviewed Jet revision [`5f148f3`](https://github.com/rpcpool/yellowstone-jet/tree/5f148f3fa221e9b9d841c288feaefc450a2f2294). The `sendTransaction` method specification is pending in [PR #67](https://github.com/solana-rpc/specs/pull/67). `Partial` identifies a difference that a client can observe in a standard valid request, response, or error contract. This rating is based on source review and does not claim live conformance testing.

## Compatibility

| Method | Compatibility | Jet implementation |
|---|---|---|
| [`sendTransaction` (spec PR #67)](https://github.com/solana-rpc/specs/pull/67) | Partial | Jet accepts base58 and base64 transactions, with base58 as the default. It decodes, deserializes, sanitizes, checks the TPU packet-size limit, queues the transaction for forwarding, and returns its first signature. Jet does not perform preflight simulation. With the default `fail_on_preflight: true` setting, it rejects requests unless `skipPreflight` is `true` or the caller sets Jet's `simulation-performed` header. It ignores `preflightCommitment`, `maxRetries`, and `minContextSlot`. |

## Request handling

The JSON-RPC handler uses the upstream `RpcSendTransactionConfig` shape and adds an optional `forwardingPolicies` field. Invalid forwarding-policy pubkeys are ignored. The policy list restricts the validator leaders that can receive the transaction.

For a standard request, Jet defaults to base58 when `encoding` is absent. It rejects unsupported encodings and malformed or oversized encoded input as `-32602 Invalid params`. After decoding, it performs transaction sanitization and enforces the Solana TPU packet-size limit before it queues the transaction. A successful response contains the first transaction signature. It acknowledges queue admission, not delivery to a leader or transaction confirmation.

The implementation is in the pinned [JSON-RPC handler](https://github.com/rpcpool/yellowstone-jet/blob/5f148f3fa221e9b9d841c288feaefc450a2f2294/apps/jet/src/rpc.rs#L321-L404), [decoder](https://github.com/rpcpool/yellowstone-jet/blob/5f148f3fa221e9b9d841c288feaefc450a2f2294/apps/jet/src/solana.rs#L30-L96), and [transaction handler](https://github.com/rpcpool/yellowstone-jet/blob/5f148f3fa221e9b9d841c288feaefc450a2f2294/apps/jet/src/transaction_handler.rs#L90-L133).

## Limitations

- Jet does not simulate transactions. The standard default is `skipPreflight: false`, so a default Jet deployment rejects a request that omits this field with `-32603` and `preflight check is not supported`. An operator can disable this rejection, but Jet still does not perform preflight. A caller can instead assert that an upstream already simulated the transaction with Jet's non-standard `simulation-performed` HTTP header. Jet does not verify that assertion.
- Jet ignores `preflightCommitment`, `maxRetries`, and `minContextSlot` on the JSON-RPC path. Forwarding behavior comes from Jet service configuration rather than these per-request fields.
- Jet maps transaction-handler failures, including unsupported preflight and sanitization failures, to `-32603 Internal error`. It does not emit the standard `SendTransactionPreflightFailure`, `MinContextSlotNotReached`, or `NodeUnhealthy` errors.
- The `forwardingPolicies` config member and `simulation-performed` header are Jet extensions. They are outside the standard contract in PR #67.

The default preflight policy is defined in the pinned [server configuration](https://github.com/rpcpool/yellowstone-jet/blob/5f148f3fa221e9b9d841c288feaefc450a2f2294/apps/jet/src/config.rs#L273-L282). The non-standard header is read by the [HTTP middleware](https://github.com/rpcpool/yellowstone-jet/blob/5f148f3fa221e9b9d841c288feaefc450a2f2294/apps/jet/src/http_tx_handler.rs#L135-L140) and changes the request in the [JSON-RPC handler](https://github.com/rpcpool/yellowstone-jet/blob/5f148f3fa221e9b9d841c288feaefc450a2f2294/apps/jet/src/rpc.rs#L340-L346). The error mapping and ignored config fields are visible in the [transaction handler](https://github.com/rpcpool/yellowstone-jet/blob/5f148f3fa221e9b9d841c288feaefc450a2f2294/apps/jet/src/transaction_handler.rs#L21-L61) and [request path](https://github.com/rpcpool/yellowstone-jet/blob/5f148f3fa221e9b9d841c288feaefc450a2f2294/apps/jet/src/transaction_handler.rs#L90-L133).
