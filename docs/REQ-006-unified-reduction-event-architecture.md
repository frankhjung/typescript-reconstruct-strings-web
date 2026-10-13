# REQ-006: Unified Reduction Event Architecture

[← Back to Documentation Index](README.md)

## Status

Implemented

## Context

The sequence assembler previously maintained two parallel event models:

1. `ReductionEvent`: A closed algebraic sum type representing domain state
   transitions without UI formatting strings.
2. `AssemblyStep`: A legacy hierarchy of view model interfaces carrying
   embedded English descriptions and optional fields.

To bridge these models, `assembler.ts` retained `assembleWithTrace` as a
Strangler Fig delegation wrapper, hardcoding presentation narration inside
the mathematical domain core. Downstream, `store.ts`, `main.ts`, and UI views
consumed `AssemblyStep`, requiring an auxiliary `stepDetails.ts` module solely
to unpack and normalise diluted fields.

## Decision

We will unify the application architecture around `ReductionEvent` as the
single source of truth for sequence reduction history:

1. **Direct Domain Contract**: Eliminate `assembleWithTrace` and legacy
   `AssemblyStep` interfaces. `traceAssembly` becomes the sole generator of
   animation history, emitting pure `readonly ReductionEvent[]`.
2. **Pure View Projection**: Introduce `StepViewModel` and `projectStepView`
   in `src/ui/stepView.ts` to transform domain events into highlight data and
   narration descriptions strictly at the presentation boundary.
3. **Store State Model**: Update `AppState` and store actions to store and
   process pure `ReductionEvent[]`.
4. **Pass-Through Module Pruning**: Delete `src/ui/stepDetails.ts` and
   transition `poolView.ts` and `mergeView.ts` to consume the uniform
   `StepViewModel`.

## Scope

### In Scope

- Updating `src/types.ts` to retire `AssemblyStep` and its variants.
- Purging `assembleWithTrace` from `src/assembler.ts`.
- Creating `src/ui/stepView.ts` with pure `projectStepView` projection.
- Deleting `src/ui/stepDetails.ts`.
- Adapting `src/store.ts`, `src/main.ts`, `src/ui/poolView.ts`, and
  `src/ui/mergeView.ts`.
- Updating the test suite across domain and view tiers.

### Out of Scope

- Altering the mathematical overlap or containment reduction algorithms.
- Changing HTML styling, colours, or visual layout.
- Changing `AlignmentReport` or reference alignment calculations.

## Architectural Improvements

### 1. High Module Leverage

Domain sequence reduction is cleanly decoupled from presentation concerns.
`assembler.ts` sheds over 100 lines of UI text templates, leaving a pure
algorithmic core.

### 2. Elimination of Pass-Through Abstractions

Deleting `stepDetails.ts` and 8 obsolete step interfaces collapses redundant
indirection. Views receive pre-computed, strongly typed presentation data
from a single pure projection function.

### 3. Exhaustive Type Safety

Views and controllers interact with strongly typed domain variants without
defending against undefined optional fields.
