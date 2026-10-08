# REQ-003: Elm Reducer Architecture

[← Back to Documentation Index](README.md)

## Context

The previous architecture used a monolithic controller (`App` in `src/main.ts`)
that conflated application state, timer management, DOM mutations, and business
logic execution. Furthermore, `ControlsComponent` required an unwieldy
9-callback interface to notify the controller of user interactions, leading to
tight coupling between the UI components and the controller's internal state
machine.

This lack of separation made unit testing the controller logic practically
impossible without mounting the DOM and mocking timers.

## Decision

We adopted the Data-Oriented Elm Architecture pattern (also known as the Reducer
pattern) to strictly decouple state transitions from side effects.

1. **Pure State Reducer**: We introduced a purely functional
   `update(state, action) -> [newState, effects]` function in `src/store.ts`.
2. **Explicit Action & Effect Types**: User intents and system events are
   modeled as a sum type (`Action`). Side effects (e.g. rendering, managing
   timers, executing the assembler) are modeled as a sum type (`Effect`).
3. **Interpreter Shell**: The `App` class now acts solely as an effectful
   runtime shell. It maintains the current state reference, intercepts `Action`
   events, passes them through the pure `update` reducer, and interprets the
   resulting `Effect` instructions.
4. **Single Callback Interface**: The `ControlsComponent` now accepts a single
   generic `dispatch: (action: Action) => void` callback, vastly simplifying its
   contract.

## Consequences

### Benefits

* **Maximum Leverage in Testing**: The entirety of the application's state
  machine, playback logic, and edge cases (e.g., reaching the end of an assembly
  trace) can now be rigorously unit tested without any mocked timers or DOM
  dependencies.
* **Decoupling**: The view layer (`ControlsComponent`) is completely isolated
  from application state. It simply translates DOM events into pure `Action`
  payloads.
* **Predictability**: All side effects are explicit. Tracking down state bugs is
  trivial, as state can only change via a dispatched `Action`.

### Drawbacks

* **Indirection**: Executing an effectful operation (like generating fragments)
  requires a full round-trip through the runtime loop (dispatching `GENERATE`,
  interpreting `RUN_GENERATOR`, and subsequently dispatching
  `ASSEMBLY_SUCCESS`), which introduces boilerplate compared to direct
  imperative execution.

## Migration Plan

The transition to the reducer architecture should be incremental and
backward-compatible, with each stage validated against the assembly tests
before the next is introduced.

### 1. Isolate State from DOM Wiring

Move the current imperative controller state out of `src/main.ts` into a pure
state model that defines:

- `AppState`: active preset, current source, step cursor, playback status,
  and last error message;
- `Action`: user and system events such as `LOAD_PRESET`, `GENERATE`,
  `STEP_NEXT`, `PLAY_TOGGLE`, and `SEEK_TO`;
- `Effect`: runtime instructions such as `RUN_ASSEMBLY`, `START_PLAYBACK`, and
  `RENDER_VIEW`.

This keeps browser integration at the boundary while making state transitions
available to pure unit tests.

### 2. Make the Reducer the Single Source of Truth

Implement `update(state, action): [AppState, Effect[]]` in a dedicated store
module. The reducer must be total and deterministic: every action yields a
valid next state, and all invalid transitions are rejected before leaving the
pure layer.

Key invariants:

- `currentStepIndex` must remain within the length of the active step trace.
- `currentSource` and `steps` must always correspond to the same assembly run.
- Playback state must never outlive the renderer lifecycle.

### 3. Decompose the Trace Builder into Pure Transitions

Refactor `src/assembler.ts` so that the trace builder is expressed as a small
set of pure transition functions instead of a long imperative loop, for
example:

- `initialFilter(pool) -> { kept, removed }`
- `selectBestCandidate(pool, minOverlap) -> Candidate | null`
- `mergeStep(pool, candidate) -> { nextPool, merged }`
- `dynamicFilter(pool) -> { kept, removed }`
- `canonicalise(pool) -> Contig[]`

Then compose these into a `reduceAssembly` function that returns the complete
step trace as data. This preserves the algorithm while making state transitions
portable to tests and future refactors.

### 4. Keep Side Effects in a Thin Runtime Shell

The App runtime should only interpret effects:

- run the generator when asked,
- invoke the assembler when a run is requested,
- schedule or cancel timers for playback,
- render the DOM from the current state.

No business logic should remain inside the browser shell. All validation,
comparison, candidate selection, and reduction semantics must live in pure
functions.

### 5. Validate via TDD and Regression Safety

For each migration layer:

1. add a failing reducer test for the new state transition,
2. add a property or edge-case test for the pure assembly transitions,
3. adapt the renderer contract only after the state machine is green,
4. remove obsolete imperative tests once the pure contract meets the same
  coverage.

This keeps the migration incremental while ensuring that behaviour remains
stable across user actions and playback modes.

### 6. Scope Boundaries

Out of scope for this refactor:

- replacing the existing DOM rendering technology,
- changing the deterministic assembly heuristics,
- introducing backend persistence or network calls,
- redesigning the preset or source-generation domain model.

The objective is to improve functional alignment without altering the product's
observable behaviour.
