# Data-Oriented Assembly Reduction (REQ-002)

[← Back to Documentation Index](README.md)

## Context

The sequence assembler was previously structured around a monolithic function
(`assembleWithTrace`) that coupled greedy overlap reduction with presentation
concerns, generating human-readable English descriptions and UI step view models
directly inside the reduction loop. Additionally, nine auxiliary helper
functions were exported solely to enable white-box testing, diluting module
locality and leaking internal implementation details.

## Decision

Refactor the assembler into a pure data-oriented architecture (Design 3):

1. **Closed Algebraic Sum Types:** Express discrete reduction steps as an
   immutable discriminated union (`ReductionEvent`), containing pure domain data
   (`pool`, `candidate`, `removed`, `mergedFragment`, `contigs`) without
   presentation strings.
2. **Pure Session Unfold:** Model iterative reduction through an immutable
   session record (`ReductionSession`) advanced by referentially transparent
   transition functions (`startSession`, `stepSession`).
3. **Direct Reduction API:** Provide `assemble` for zero-overhead batch
   reconstruction alongside `traceAssembly` for event stream generation.
4. **Strangler Fig Delegation:** Retain `assembleWithTrace` as a
   backward-compatible delegation wrapper projecting `ReductionEvent` records
   into legacy `AssemblyStep` view models.

## Architectural Improvements

### 1. High Module Leverage

By replacing the procedural trace generator with `assemble` and `traceAssembly`,
callers exercise sequence reduction behaviour through a concise, deep contract.
Callers needing only final contigs avoid allocating intermediate animation
frames or narrative text strings.

### 2. Separation of Concerns & Presentation Decoupling

Domain reduction logic is strictly decoupled from presentation concerns. English
descriptions (`"Found best overlap..."`, `"Dynamic containment..."`) are moved
to view-layer adapters. This allows the assembly engine to run in headless
contexts, worker threads, or alternative front-ends without carrying UI
formatting dependencies.

### 3. Exhaustive Type Discrimination

The `ReductionEvent` sum type enforces compile-time discrimination across all
five reduction phases (`initial-filtered`, `candidate-selected`, `pair-merged`,
`dynamic-filtered`, and `assembly-completed`). Downstream consumers handle exact
event variants without guessing optional properties or defending against invalid
combinations.

### 4. Preserved Locality & Interface-Level Verification

All internal string operations (prefix-suffix slicing, candidate comparison, and
containment checks) are encapsulated within the module. Unit tests now verify
domain invariants (permutation invariance, reduction idempotence, and greedy
convergence) through the public capability interface rather than reaching into
private helper functions.

### 5. Backward Compatibility & Safe Migration

The Strangler Fig adapter preserves existing UI and view contracts without
breaking changes, allowing incremental migration across all call sites.
