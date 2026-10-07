# getFeeForMessage

Returns the transaction fee that the selected bank assigns to a serialized message.

## Semantics

The first parameter is always base64 encoded and represents a VersionedMessage, not a complete signed transaction. Agave sanitizes it against the selected bank before calculating the fee. A null value means that bank has no fee for the message.

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L4381-L4405).
