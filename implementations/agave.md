# Agave

[Agave](https://github.com/anza-xyz/agave) is the upstream Solana validator implementation and the baseline implementation for this specification.

This page records the reference at reviewed Agave revision [`6dd9d387`](https://github.com/anza-xyz/agave/tree/6dd9d38771e46103b9680357a855804165612602). The matching specs revision is [`5342447`](https://github.com/solana-rpc/specs/tree/534244734fc0a249396ac3ac8448a38fa07c29c9). It is a navigation and source-reference aid. The normative request, response, and error contracts remain in the method and schema pages.

## Compatibility

Each current method page declares `agave: { status: full }` in its paired YAML support matrix. `Full (baseline)` records that status. It does not replace conformance testing against the pinned Agave revision.

| Method | Compatibility | Agave implementation |
|---|---|---|
| [`getAccountInfo`](../methods/http/getAccountInfo.md) | Full (baseline) | [handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3340-L3351), [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L537-L563) |
| [`getBalance`](../methods/http/getBalance.md) | Full (baseline) | [handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L2898-L2907), [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L943-L950) |
| [`getBlock`](../methods/http/getBlock.md) | Full (baseline) | [handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L4234-L4241), [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L1321-L1442) |
| [`getBlockHeight`](../methods/http/getBlockHeight.md) | Full (baseline) | [handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L2950-L2957), [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L980-L983) |
| [`getHealth`](../methods/http/getHealth.md) | Full (baseline) | [handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L2924-L2936), [health logic](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc_health.rs#L70-L151) |
| [`getLatestBlockhash`](../methods/http/getLatestBlockhash.md) | Full (baseline) | [handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L4361-L4368), [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L2450-L2463) |
| [`getMultipleAccounts`](../methods/http/getMultipleAccounts.md) | Full (baseline) | [handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3354-L3379), [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L565-L595) |
| [`getProgramAccounts`](../methods/http/getProgramAccounts.md) | Full (baseline) | [handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3482-L3504), [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L606-L673) |
| [`getSignaturesForAddress`](../methods/http/getSignaturesForAddress.md) | Full (baseline) | [handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L4293-L4325), [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L1888-L2032) |
| [`getSlot`](../methods/http/getSlot.md) | Full (baseline) | [handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L2945-L2948), [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L975-L978) |
| [`getTokenAccountsByOwner`](../methods/http/getTokenAccountsByOwner.md) | Full (baseline) | [handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3540-L3554), [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L2173-L2225) |
| [`getTransaction`](../methods/http/getTransaction.md) | Full (baseline) | [handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L4279-L4291), [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L1790-L1886) |
| [`accountSubscribe`](../methods/websocket/accountSubscribe.md) | Full (baseline) | [RPC registration](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc_pubsub.rs#L59-L70), [handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc_pubsub.rs#L428-L446) |
| [`accountUnsubscribe`](../methods/websocket/accountUnsubscribe.md) | Full (baseline) | [RPC registration](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc_pubsub.rs#L72-L82), [handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc_pubsub.rs#L448-L450) |

## Scope

This repository specifies a representative and growing subset of Agave RPC. This page covers method pages published on the reviewed specs revision. A method absent from this repository is not an unsupported-method finding. Draft method pages and extension proposals remain outside this compatibility table until they merge.
