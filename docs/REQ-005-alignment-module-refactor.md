# REQ-005: Alignment Module Refactor

[← Back to Documentation Index](README.md)

## Status

Implemented

## Context

The `src/alignment.ts` module currently hosts a single monolithic function
(`alignContigsToSource`) that is responsible for three distinct concerns:

1. **String Searching:** Performing exact substring and sliding-window local
   alignment matches.
2. **Interval Arithmetic:** Calculating overlapping covered and uncovered
   sequence spans based on match indices.
3. **UI Text Generation:** Constructing user-facing summary strings (e.g.
   `"PERFECT RECONSTRUCTION..."` or `"MISASSEMBLY DETECTED..."`).

This design is low-leverage. It leaks UI presentation logic directly into the
mathematical domain core, preventing the interval logic or sequence matching
from being tested or reused in isolation.

## Decision

We will refactor `src/alignment.ts` by splitting its responsibilities into
focused, data-oriented domain functions and extracting all text generation to
the view layer.

## Scope

### In Scope

* Extracting interval arithmetic (span calculation and boolean coverage arrays)
  into pure generic functions.
* Extracting sequence alignment searching (exact occurrences and sliding
  windows) into pure query functions.
* Moving the summary string generation into `src/ui/diffView.ts` (or a dedicated
  narration module), ensuring `alignment.ts` returns purely algebraic
  `AlignmentReport` data.
* Updating existing tests and views to consume the decoupled functions.

### Out of Scope

* Introducing complex bioinformatics alignment algorithms (like Smith-Waterman
  or Needleman-Wunsch). The existing sliding-window approach is sufficient for
  our simulated fragments.
* Changing the definition of what constitutes a "perfect match" or a "coverage
  gap".

## Functional Requirements

### 1. Pure Interval/Span Mathematics

The interval tracking (e.g. converting a boolean array of covered positions into
continuous `Span` objects) must be extracted into an isolated function that
operates on plain arrays, independent of sequence logic.

### 2. Pure Sequence Search

The substring match and sliding window logic must be extracted into functions
that simply return match indices and match lengths, devoid of assembly domain
context.

### 3. Data-Only Reporting

The `alignContigsToSource` function must be redefined as an orchestration
boundary that composes the search and interval functions. It must return a
purely data-driven `AlignmentReport` (e.g. containing boolean flags for
`perfectMatch` and arrays of `unalignedContigs`), completely omitting the string
`summary` field.

### 4. View-Layer Narration

The `src/ui/diffView.ts` module must consume the plain data from the updated
`AlignmentReport` and generate the human-readable summary strings directly
inside the presentation tier.

## Non-Functional Requirements

### Testability

The mathematical interval functions and substring search functions must be
thoroughly unit-testable as isolated pure functions, allowing for property-based
or combinatorial edge-case testing without setting up full assembly traces.

### Backward Compatibility

The resulting HTML output in the `diff-container` workspace must remain exactly
identical to the pre-refactor rendering for all presets and inputs.

## Migration Plan

1. **Red Phase (TDD):** Define the new signatures for the generic interval and
   search functions in `test/alignment.test.ts`.
2. **Extraction:** Pull the span-calculation loop and the sliding-window loops
   out of the monolith into these new focused functions.
3. **UI Delegation:** Move the string generation `if/else` block from the bottom
   of `alignContigsToSource` into `renderDiffViewHtml`.
4. **Integration:** Refactor `alignContigsToSource` to compose the new pure
   functions.
5. **Verification:** Run the comprehensive test suite (`make test`) to ensure
   the views format correctly and the domain logic holds.

## Consequences

### Benefits

* **Separation of Concerns:** UI text logic no longer contaminates the pure
  mathematical domain.
* **Locality & Leverage:** Interval math and sequence searching become reusable,
  high-leverage utility functions.
* **Testability:** Mathematical edge cases can be tested natively without
  parsing long UI strings.

### Costs

* Mild churn in `src/types.ts` as the `AlignmentReport` interface sheds its
  `summary` string field.

## Acceptance Criteria

* [x] `alignContigsToSource` returns only typed algebraic data and no
  human-readable summary text.
* [x] UI summary string generation is localized entirely within
  `src/ui/diffView.ts` (or similar view tier).
* [x] Span and interval arithmetic is extracted into a standalone pure function.
* [x] All view and domain tests pass, confirming no visible change in
  application behavior.
