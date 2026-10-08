# Documentation Directory

[← Back to Project README](../README.md)

This directory contains specifications, theoretical background, and domain
guides for the **reconstruct-strings-web** project.

## Document Index

### Specifications and Architecture

- [Domain Glossary][glossary]: Domain terminology and definitions covering
  fragments, contigs, overlaps, coverage depth, and reference alignment.
- [Interactive OLC Assembler Animation Specification (REQ-001)][req-001]:
  Functional requirements, generation parameters, deterministic greedy overlap
  reduction semantics, animation state machine, visual layout, and single-file
  standalone architecture.
- [Data-Oriented Assembly Reduction (REQ-002)][req-002]:
  Pure algebraic data events and session transitions decoupling reduction
  from trace narration.
- [Elm Reducer Architecture (REQ-003)][req-003]:
  Pure reducer/state-machine design isolating browser events, app state,
  and side effects behind a small effect interpreter.
- [Main Controller and Assembly Reducer Refactor (REQ-004)][req-004]:
  Incremental migration plan to move the imperative controller and trace
  builder towards a fully reducer-driven architecture.

### Domain Theory and Parameter Analysis

- [Assembly Dynamics and Parameter Heuristics][heuristics]: Mathematical
  models for collision probabilities, minimum overlap lower and upper bounds,
  Lander–Waterman coverage depth, and calibrated parameter configurations.
- [Reconstructing DNA from Short Fragments][dna-doc]: Biological background
  on *de novo* genome assembly, contrasting Overlap-Layout-Consensus (OLC)
  with de Bruijn graph (DBG) paradigms.

[dna-doc]: reconstructing-complete-dna-strand-from-short-fragments.md
[glossary]: GLOSSARY.md
[heuristics]: heuristics.md
[req-001]: REQ-001-interactive-olc-assembler-animation.md
[req-002]: REQ-002-data-oriented-assembly-reduction.md
[req-003]: REQ-003-elm-reducer-architecture.md
[req-004]: REQ-004-main-controller-and-assembly-reducer-refactor.md
