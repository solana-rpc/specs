# getAgGenesisCert

Returns the finalized Alpenglow genesis certificate, if present.

## Semantics

The method reads the finalized bank's Alpenglow genesis certificate. It returns null if no certificate exists. The certificate's block identifies the certified slot and block ID; the signature is a serialized BLS aggregate signature and validator bitmap.

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [request handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3184-L3190) and [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L931-L941).
