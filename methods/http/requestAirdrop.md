# requestAirdrop

Requests a transfer from the RPC node configured faucet and returns its submitted transaction signature.

## Semantics

The RPC node must have a faucet configured; otherwise Agave returns JSON-RPC InvalidRequest. The optional recentBlockhash is verified when supplied. If omitted, Agave selects the confirmed bank last blockhash. The returned signature only acknowledges submission; clients must confirm it separately.

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3868-L3922).
