# sendTransaction

Submits a signed transaction and returns its first signature.

## Semantics

Agave accepts base58 by default and base64 when requested. It decodes, sanitizes, and optionally simulates the transaction before queuing it for send. skipPreflight disables simulation and health checking. A returned signature is an acknowledgement of acceptance by the RPC send path, not confirmation that the transaction landed.

`forwardingPolicies`, when present, is an ordered list of Yellowstone Shield policy account addresses. The sender evaluates each scheduled leader identity against the policies in order. The first policy that lists the identity decides eligibility: an allow policy permits it and a deny policy rejects it. If no policy lists the identity, the identity is ineligible when the list contains an allow policy and eligible otherwise. An absent or empty list does not restrict scheduled leader forwarding.

The field affects transaction forwarding only. It does not change the transaction, returned signature, or acknowledgement semantics. A successful response does not guarantee that the policy set permits any scheduled leader or that Jet forwarded the transaction.

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [handler and preflight path](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3925-L4068).
- [**Yellowstone Jet**](https://github.com/rpcpool/yellowstone-jet/tree/5f148f3fa221e9b9d841c288feaefc450a2f2294): shipped reference implementation for `forwardingPolicies`. Jet silently removes invalid policy pubkeys while parsing the request. It applies policies to scheduled leaders, but its configured `extra_fanout` destinations bypass the policy check.
