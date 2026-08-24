---
number: 0000
title: <short title>
authors: [<name or github handle>]
status: draft            # draft while the PR is open; accepted on merge
created: <YYYY-MM-DD>
reference-implementations: []   # links to PRs/code implementing this
---

# <Title>

## Summary

One paragraph: what changes in the spec.

## Motivation

Why the standard needs this. Who is affected. What breaks or stays broken
without it.

## Specification

The precise change, in normative language. This section must match the spec
diff in the same PR — the diff is the source of truth, this section is the
explanation.

## Return-type impact

New or changed result variants, explicitly enumerated. "None" if none.

## Compatibility

Effect on existing implementations (Agave, cloudbreak, superbank, others):
who already conforms, who must change, whether the change is additive or
breaking for clients.

## Reference implementation

Link(s) to at least one implementation of the proposed behavior.

## Security considerations

DoS surface, resource limits, data-exposure implications. "None identified"
requires a sentence of justification.
