# HTTP RPC method overview

This table covers the 53 methods in the Solana Foundation's [HTTP RPC documentation](https://github.com/solana-foundation/solana-com/tree/fa76516c1bac9a70e177a401c82179257c0bf78c/apps/docs/content/docs/en/rpc/http). The upstream inventory was last checked at commit [`fa76516c`](https://github.com/solana-foundation/solana-com/commit/fa76516c1bac9a70e177a401c82179257c0bf78c) from 2026-10-06.

A check means that the implementation exposes the method. It does not claim full compatibility. Availability comes from each method's YAML support matrix and the implementation profiles; the profiles supply the five pending method pages and Cloudbreak's unrated `getSupply`. See the [Agave](../implementations/agave.md), [Cloudbreak](../implementations/cloudbreak.md), and [Superbank](../implementations/superbank.md) profiles for compatibility levels, conditions, and known differences.

| Method | Agave | Cloudbreak | Superbank |
|---|:---:|:---:|:---:|
| [`getAccountInfo`](http/getAccountInfo.md) | ✅ | ✅ | — |
| [`getAgGenesisCert`](https://github.com/solana-foundation/solana-com/blob/fa76516c1bac9a70e177a401c82179257c0bf78c/apps/docs/content/docs/en/rpc/http/getaggenesiscert.mdx) † | ✅ | — | — |
| [`getBalance`](http/getBalance.md) | ✅ | ✅ | — |
| [`getBlock`](http/getBlock.md) | ✅ | — | ✅ |
| [`getBlockCommitment`](http/getBlockCommitment.md) | ✅ | — | — |
| [`getBlockHeight`](http/getBlockHeight.md) | ✅ | — | ✅ |
| [`getBlockProduction`](http/getBlockProduction.md) | ✅ | — | — |
| [`getBlocks`](http/getBlocks.md) | ✅ | — | ✅ |
| [`getBlocksWithLimit`](http/getBlocksWithLimit.md) | ✅ | — | ✅ |
| [`getBlockTime`](http/getBlockTime.md) | ✅ | — | ✅ |
| [`getClusterNodes`](http/getClusterNodes.md) | ✅ | — | — |
| [`getEpochInfo`](http/getEpochInfo.md) | ✅ | — | — |
| [`getEpochSchedule`](http/getEpochSchedule.md) | ✅ | — | ✅ |
| [`getFeeForMessage`](http/getFeeForMessage.md) | ✅ | — | — |
| [`getFirstAvailableBlock`](http/getFirstAvailableBlock.md) | ✅ | — | ✅ |
| [`getGenesisHash`](http/getGenesisHash.md) | ✅ | ✅ | — |
| [`getHealth`](http/getHealth.md) | ✅ | ✅ | ✅ |
| [`getHighestSnapshotSlot`](http/getHighestSnapshotSlot.md) | ✅ | — | — |
| [`getIdentity`](http/getIdentity.md) | ✅ | — | — |
| [`getInflationGovernor`](http/getInflationGovernor.md) | ✅ | — | — |
| [`getInflationRate`](http/getInflationRate.md) | ✅ | — | — |
| [`getInflationReward`](https://github.com/solana-foundation/solana-com/blob/fa76516c1bac9a70e177a401c82179257c0bf78c/apps/docs/content/docs/en/rpc/http/getinflationreward.mdx) † | ✅ | — | ✅ |
| [`getLargestAccounts`](http/getLargestAccounts.md) | ✅ | ✅ | — |
| [`getLatestBlockhash`](http/getLatestBlockhash.md) | ✅ | — | ✅ |
| [`getLeaderSchedule`](http/getLeaderSchedule.md) | ✅ | — | — |
| [`getMaxRetransmitSlot`](http/getMaxRetransmitSlot.md) | ✅ | — | — |
| [`getMaxShredInsertSlot`](http/getMaxShredInsertSlot.md) | ✅ | — | — |
| [`getMinimumBalanceForRentExemption`](http/getMinimumBalanceForRentExemption.md) | ✅ | — | — |
| [`getMultipleAccounts`](http/getMultipleAccounts.md) | ✅ | ✅ | — |
| [`getProgramAccounts`](http/getProgramAccounts.md) | ✅ | ✅ | — |
| [`getRecentPerformanceSamples`](http/getRecentPerformanceSamples.md) | ✅ | — | — |
| [`getRecentPrioritizationFees`](http/getRecentPrioritizationFees.md) | ✅ | — | — |
| [`getSignaturesForAddress`](http/getSignaturesForAddress.md) | ✅ | — | ✅ |
| [`getSignatureStatuses`](https://github.com/solana-foundation/solana-com/blob/fa76516c1bac9a70e177a401c82179257c0bf78c/apps/docs/content/docs/en/rpc/http/getsignaturestatuses.mdx) † | ✅ | — | ✅ |
| [`getSlot`](http/getSlot.md) | ✅ | ✅ | ✅ |
| [`getSlotLeader`](http/getSlotLeader.md) | ✅ | — | — |
| [`getSlotLeaders`](http/getSlotLeaders.md) | ✅ | — | — |
| [`getStakeMinimumDelegation`](http/getStakeMinimumDelegation.md) | ✅ | — | — |
| [`getSupply`](http/getSupply.md) | ✅ | ✅ | — |
| [`getTokenAccountBalance`](http/getTokenAccountBalance.md) | ✅ | ✅ | — |
| [`getTokenAccountsByDelegate`](http/getTokenAccountsByDelegate.md) | ✅ | ✅ | — |
| [`getTokenAccountsByOwner`](http/getTokenAccountsByOwner.md) | ✅ | ✅ | — |
| [`getTokenLargestAccounts`](http/getTokenLargestAccounts.md) | ✅ | ✅ | — |
| [`getTokenSupply`](http/getTokenSupply.md) | ✅ | ✅ | — |
| [`getTransaction`](http/getTransaction.md) | ✅ | — | ✅ |
| [`getTransactionCount`](http/getTransactionCount.md) | ✅ | — | ✅ |
| [`getVersion`](http/getVersion.md) | ✅ | ✅ | — |
| [`getVoteAccounts`](http/getVoteAccounts.md) | ✅ | ✅ | — |
| [`isBlockhashValid`](http/isBlockhashValid.md) | ✅ | — | ✅ |
| [`minimumLedgerSlot`](http/minimumLedgerSlot.md) | ✅ | — | ✅ |
| [`requestAirdrop`](http/requestAirdrop.md) | ✅ | — | — |
| [`sendTransaction`](https://github.com/solana-foundation/solana-com/blob/fa76516c1bac9a70e177a401c82179257c0bf78c/apps/docs/content/docs/en/rpc/http/sendtransaction.mdx) † | ✅ | — | — |
| [`simulateTransaction`](https://github.com/solana-foundation/solana-com/blob/fa76516c1bac9a70e177a401c82179257c0bf78c/apps/docs/content/docs/en/rpc/http/simulatetransaction.mdx) † | ✅ | ✅ | — |
| **Implemented methods** | **53** | **17** | **17** |

## Specification coverage

This repository has a paired YAML schema and normative Markdown page for 48 of the 53 upstream methods. The five rows marked with † are not yet on this branch:

- `getAgGenesisCert`: [draft spec PR #42](https://github.com/solana-rpc/specs/pull/42)
- `getInflationReward`: [draft spec PR #10](https://github.com/solana-rpc/specs/pull/10)
- `getSignatureStatuses`: [draft spec PR #2](https://github.com/solana-rpc/specs/pull/2)
- `sendTransaction`: [draft spec PR #67](https://github.com/solana-rpc/specs/pull/67)
- `simulateTransaction`: [draft spec PR #20](https://github.com/solana-rpc/specs/pull/20)

The inventory therefore covers the full upstream HTTP RPC gamut in this overview, while normative method coverage is 48 of 53 methods. Vendor extensions are outside this comparison.
