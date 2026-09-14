# sendTransaction

Submits a signed transaction and returns its first signature.

## Semantics

Agave accepts base58 by default and base64 when requested. It decodes, sanitizes, and optionally simulates the transaction before queuing it for send. skipPreflight disables simulation and health checking. A returned signature is an acknowledgement of acceptance by the RPC send path, not confirmation that the transaction landed.

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [handler and preflight path](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3925-L4068).
