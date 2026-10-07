# getClusterNodes

Returns network contact records for peers visible to the RPC node.

## Semantics

The handler filters out peers whose gossip address is absent or outside the node configured socket address space. Endpoint and version fields are nullable because peers do not all advertise every service.

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3769-L3817).
