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
