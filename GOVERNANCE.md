# Governance: the RFC process

This repository is the standard. Changes to it follow one of two tracks.

## Editorial changes

Typos, formatting, prose clarifications, added examples — anything with no
wire-visible meaning change. Open a plain PR. One maintainer approval merges.

## Substantive changes

A new method, a new parameter, a changed or newly-constrained return type, a
new error code, a new shared schema, or any change to documented semantics.

A substantive PR MUST contain both:

1. **A proposal document** — `proposals/NNNN-kebab-case-title.md`, following
   `proposals/0000-template.md`. `NNNN` is the next unclaimed number at the
   time the PR is opened (renumber if you race another PR).
2. **The spec change itself** — the edits to `methods/`, `schemas/`, and/or
   `errors/codes.yaml` that the proposal describes.

Merging the PR **is** acceptance. The proposal document remains in the repo
permanently as the rationale record. Rejected proposals are closed unmerged.

### Requirements for acceptance

- At least one linked reference implementation (a PR or shipped code in a
  real RPC implementation). Speculative additions with no implementation
  are held open until one exists.
- CI green (`npm run validate` in `tooling/`).
- Review approval from at least two [maintainers](MAINTAINERS.md) representing
  different implementations.

### Promoting vendor extensions

Implementation-specific methods or params (e.g. a vendor pagination param)
are not documented in this repo until standardised. To standardise one, open
a substantive PR whose proposal cites the shipped vendor behavior as the
reference implementation.

## Error codes

New error codes are always substantive. Codes must not collide with existing
assignments in `errors/codes.yaml` (CI enforces uniqueness). The registry is
the single source of truth for Solana's error codes: the implementation-defined
`-32000..-32099` allocations, plus the JSON-RPC 2.0 standard codes it documents
for completeness (which it records rather than owns).

## Versioning

`spec-info.yaml` holds the spec version (semver). Substantive PRs bump minor
(additive) or major (breaking); editorial PRs bump patch. Releases are
tagged from `main`.
