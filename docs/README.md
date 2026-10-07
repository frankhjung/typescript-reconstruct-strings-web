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
