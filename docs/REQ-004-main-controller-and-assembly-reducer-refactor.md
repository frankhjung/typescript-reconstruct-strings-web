# REQ-004: Main Controller and Assembly Reducer Refactor

[← Back to Documentation Index](README.md)

## Context

The current application has a clear domain model and a deterministic assembly
engine, but the browser controller in `src/main.ts` still owns state mutation,
playback timers, error handling, and render dispatch in one imperative object.
The same issue partially persists in `src/assembler.ts`, where trace generation is
built via a mutable loop over an evolving pool.

This architecture creates friction for testability, makes state transitions hard
to reason about, and keeps the application logic less aligned with the pure,
functional semantics already present in the assembly algorithms.

## Decision

We will refactor the application to an Elm-style reducer architecture without
changing the user-visible behaviour or algorithmic contract.

The refactor will follow four layers:

1. **Pure state model**: define the application state, user actions, and runtime
   effects as data.
2. **Pure reducer**: encode all state transitions as a function of
   `state + action -> nextState + effects`.
3. **Thin runtime shell**: keep the DOM and browser APIs at the boundary only,
   interpreting effects and rendering the current state.
4. **Pure assembly transitions**: split the trace-building loop in
   `src/assembler.ts` into smaller, deterministic transition functions.

## Scope

### In Scope

- Extracting imperative state from `src/main.ts` into a pure state model.
- Converting playback, generate, preset-load, and seek flows to reducer-driven
  transitions.
- Migrating step generation logic in `src/assembler.ts` to small composable,
  pure transformations.
- Adding focused unit tests for reducer state transitions and pure assembly
  helpers.
- Preserving all existing rendering output, preset behaviour, and assembly
  semantics.

### Out of Scope

- Changing the deterministic overlap strategy or the public assembly
  algorithm.
- Replacing the DOM rendering approach or UI toolkit.
- Re-introducing any backend, server-side persistence, or networked state.
- Redesigning the preset data model or source-generation rules.

## Functional Requirements

### 1. Pure Application State

The application must expose a state shape that can be reasoned about without the
browser. It will represent:

- current source and parameters,
- active assembly steps and current step index,
- playback state and delay setting,
- last user-visible explanation or error message,
- active preset selection.

This state must be serialisable as plain data and independent from DOM nodes or
browser timers.

### 2. Reducer-Driven Actions

User and system events must be modeled as explicit actions, including at least:

- `LOAD_PRESET`
- `GENERATE`
- `CUSTOM_FRAGMENTS`
- `PLAY_TOGGLE`
- `STEP_NEXT`
- `STEP_PREV`
- `SEEK_TO`
- `SET_SPEED`
- `RESET`
- `ASSEMBLY_SUCCESS`
- `ASSEMBLY_FAILURE`

The reducer must handle each action deterministically, with no hidden mutation.

### 3. Explicit Effects

The runtime shell will interpret a small set of effect instructions, including:

- `RUN_ASSEMBLY`
- `START_PLAYBACK`
- `STOP_PLAYBACK`
- `RENDER_STATE`
- `REPORT_ERROR`

This makes the side effects visible and testable rather than implicit inside the
controller body.

### 4. Pure Assembly Transitions

The assembler must expose a transition pipeline for the trace builder, for
example:

- `initialFilter(pool)`
- `findBestCandidate(pool, minOverlap)`
- `mergeCandidate(candidate, pool)`
- `filterDynamic(pool)`
- `canonicalise(pool)`

These operations must be pure and deterministic, and must preserve the algorithm's
current tie-breaking and containment semantics.

### 5. Runtime Boundary

The browser runtime remains responsible only for:

- reading input events from the DOM,
- dispatching actions,
- executing the effect interpreter,
- updating the view from the current state.

No domain logic should remain in the runtime shell.

## Non-Functional Requirements

### Determinism

All state transitions must be independent of execution order beyond the action
sequence being processed. The application must behave identically for the same
sequence of input actions.

### Testability

Reducer logic and pure assembly helpers must be unit-testable without mounting a
browser or stubbing timers. Tests must cover both the happy path and edge cases,
including invalid step indices, empty pools, and failed generation requests.

### Backward Compatibility

The refactor must not alter the rendered output or the assembly semantics. The
same preset sets, source inputs, and overlap rules must produce the same results
before and after the refactor.

## Migration Plan

### Phase 1 — State Model Extraction

Create a pure state representation and action types that cover the current
controller responsibilities. Add tests first for state transitions such as
playback toggling, seeking, and reset behaviour.

### Phase 2 — Reducer Integration

Replace imperative controller mutation with reducer-driven updates. Keep the
existing browser code path as a shim while the reducer handles state changes.

### Phase 3 — Effect Interpreter

Move timer scheduling, rendering, and error reporting into a thin runtime shell
that interprets the effects emitted by the reducer. Ensure each effect has a
single, explicit purpose.

### Phase 4 — Assembler Transition Splits

Extract the loop in `src/assembler.ts` into reusable pure steps and add tests for
candidate selection, merge semantics, and canonical ordering.

### Phase 5 — Regression Verification

Run the project test suite and render-focused checks after each phase to ensure
that the observable behaviour remains unchanged.

## Consequences

### Benefits

- clearer ownership of state,
- easier pure-function testing,
- better alignment with FP idioms,
- smaller, composable state transitions,
- reduced coupling between the UI shell and application logic.

### Costs

- more explicit boilerplate for actions and effects,
- a short-term increase in indirection during the migration,
- the need to preserve the existing user-facing behaviour while the new model is
  introduced.

## Acceptance Criteria

The refactor is complete when all of the following are true:

- [x] the core application state is represented as plain data,
- [x] all state changes flow through a pure reducer,
- [x] DOM and timer logic are confined to a thin runtime shell,
- [x] `src/assembler.ts` exposes pure transitions for assembly steps,
- [x] the existing test suite remains green,
- [x] the rendered behaviour remains consistent with the pre-refactor app.

## Settled Decisions from Review

Following an interactive requirements review, the following edge cases and boundaries have been formally agreed upon:

1. **Failure Modes & Degradation**: If an `ASSEMBLY_FAILURE` occurs (e.g., due to invalid custom fragments), the reducer will immediately halt playback, clear the active assembly sequence, and display the error. This strict degradation prevents users from confusing a failed generation request with the previous successful output.
2. **Concurrency & Threading**: The `RUN_ASSEMBLY` effect will execute synchronously on the main thread. Given the strict domain limits (max 500 fragments, max 10k length), the O(k²·L²) reduction remains fast enough to avoid severe UI freezing, removing the need for complex Web Worker `ASSEMBLY_PENDING` async messaging in the pure reducer.
3. **Data Ownership (Narration)**: The pure assembly transition pipeline will exclusively emit typed algebraic data (`ReductionEvent` objects). All human-readable trace explanations will be generated by a separate view/narration layer, preserving the strict mathematical purity of the assembler.
