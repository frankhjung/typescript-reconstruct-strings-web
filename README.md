# Reconstruct Strings Web

This project provides an interactive web-based animation for the
Overlap-Layout-Consensus (OLC) sequence assembler. It visually demonstrates how
string fragments assemble into contiguous sequences (contigs) and dynamically
verifies reconstruction against a reference sequence.

## Features

- **Stepwise OLC Animation:** Step through pairwise suffix-prefix overlaps,
  merges, and dynamic containment filtering.
- **Dynamic Reference Verification:** Real-time alignment against ground-truth
  sequences with coverage percentage and chimera detection.
- **Configurable Generator & Presets:** Built-in biological sequence presets
  with custom fragment pool inputs.
- **Zero Runtime Dependencies:** Compiles into a self-contained, single-file
  HTML bundle using vanilla TypeScript and CSS.

## Architecture & Workflow

The reconstruction animation pipeline coordinates fragment generation,
iterative reduction assembly, and real-time reference verification:

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant UI as Controls UI
  participant App as App Runtime
  participant Store as Pure Reducer
  participant Gen as Generator
  participant Asm as Assembler Engine
  participant Align as Alignment
  participant View as View Renderers

  User->>UI: Click Generate / Select Preset
  UI->>App: dispatch(Action: GENERATE)
  App->>Store: update(state, GENERATE)
  Store-->>App: [newState, Effect: RUN_GENERATOR]
  
  App->>Gen: generateFragments(params)
  Gen-->>App: fragments
  App->>App: handleEffect(RUN_ASSEMBLY)
  
  App->>Asm: assembleWithTrace(fragments, minOverlap)
  Note over Asm: Pure trace of ReductionEvents
  Asm-->>App: AssemblyResult (steps)
  
  App->>Store: dispatch(Action: ASSEMBLY_SUCCESS)
  Store-->>App: [newState, Effect: RENDER]
  
  loop Playback / Rendering
    App->>Align: alignContigsToSource(source, currentStep.pool)
    Align-->>App: AlignmentReport
    App->>View: renderPoolHtml / renderMergeTheatreHtml / renderDiffViewHtml
    View-->>App: Rendered HTML strings
    App-->>User: Update DOM elements
  end
```

## Quick Start

### Prerequisites

- Node.js (>= 18.19.0 recommended, or 20+)
- npm (Node Package Manager)

### Installation

Install the project dependencies using `make` (or `npm`):

```bash
make install
# or
npm install
```

### Upgrading Packages

To update the project dependencies to their newest versions allowed by the
current semver ranges in `package.json`, use:

```bash
make upgrade
```

This runs `npm-check-updates` to refresh the dependency versions in
`package.json` and then reinstalls the updated packages with `npm install`.

### Build & Run

Build the self-contained HTML bundle:

```bash
make build
```

Open the generated application in your web browser:

```bash
xdg-open dist/index.html
# or
open dist/index.html
```

Alternatively, serve the built application locally using the bundled Node
server:

```bash
npm run serve
# or
make serve
```

By default, this serves `dist/` on port 8080 (configurable via the `PORT`
environment variable).

### URL Parameters

The application supports URL query parameters for deep linking:

- `?preset=<index>`: Load a specific preset configuration on startup
  (0-indexed).
- `?step=<index>`: Jump to a specific animation step.

## Assembly Mechanics

### Generator Parameters

The fragment generator supports the following bounds:

- `minOverlap` (n): Minimum suffix-prefix overlap to qualify for merging (>= 2).
- `minLength` (a): Minimum length of generated fragments (>= 2).
- `maxLength` (b): Maximum length of generated fragments (>= a).
- `fragmentCount` (m): Total number of fragments to sample from the source.

The application enforces limits to prevent denial-of-service in the O(k²·L²)
assembly step:

- Maximum source length: 10,000 characters.
- Maximum fragment count: 500 fragments.

### Deterministic Overlap Ordering

This implementation ensures deterministic reduction by relying on strict
three-tier tie-breaking rules:

1. **Longest Overlap Match:** Prefers candidates with the highest `matchLength`
   (descending).
2. **Code Unit Order (Prefix):** Tie-breaks on the prefix fragment
   lexicographically using UTF-16 code unit order (ascending).
3. **Code Unit Order (Suffix):** Tie-breaks on the suffix fragment
   lexicographically using UTF-16 code unit order (ascending).

## Documentation

Detailed domain documentation and architectural specifications are located in
the [`docs/`](docs/README.md) directory:

- [Documentation Index][docs-index]: Comprehensive navigation guide for all
  project documentation.
- [Domain Glossary][docs-glossary]: Definitions for domain concepts
  including fragments, contigs, overlaps, coverage, and chimeric joins.
- [Interactive OLC Assembler Specification (REQ-001)][req-001]:
  Functional requirements, generation parameters, state machine transitions,
  and standalone delivery model.
- [Data-Oriented Assembly Reduction (REQ-002)][req-002]:
  Pure algebraic data events and session transitions decoupling reduction
  from trace narration.
- [Elm Reducer Architecture (REQ-003)][req-003]:
  A pure reducer/state-machine architecture that isolates UI events,
  application state, and side effects in the browser runtime.
- [Assembly Dynamics and Parameter Heuristics][docs-heuristics]:
  Mathematical collision models, overlap lower and upper bounds,
  Lander–Waterman coverage depth, and calibrated parameter configurations.
- [Reconstructing DNA from Short Fragments][dna-doc]:
  Biological background on *de novo* genome assembly, contrasting OLC and
  de Bruijn graph paradigms.

[dna-doc]: docs/reconstructing-complete-dna-strand-from-short-fragments.md
[docs-glossary]: docs/GLOSSARY.md
[docs-heuristics]: docs/heuristics.md
[docs-index]: docs/README.md
[req-001]: docs/REQ-001-interactive-olc-assembler-animation.md
[req-002]: docs/REQ-002-data-oriented-assembly-reduction.md
[req-003]: docs/REQ-003-elm-reducer-architecture.md

## Development Pipeline

Run the default pipeline (static checks, build bundle, and test suite):

```bash
make
```

Available development targets:

- **`make all`:** Runs `install`, `check`, `build`, and `test` sequentially.
- **`make check`:** Alias for running static type checks and linting.
- **`make upgrade`:** Refreshes dependency versions in `package.json` and
  reinstalls them.
- **`make typecheck`:** Validates TypeScript types without emitting output.
- **`make test`:** Executes the full unit and view test suite.
- **`make build`:** Generates the standalone HTML bundle using esbuild.
- **`make clean`:** Removes compiled distribution artefacts (`dist/`).
- **`make cleanall`:** Purges `dist/` and `node_modules/`.

## Project Structure

- `src/`: TypeScript source code.
  - `alignment.ts`: Real-time contig alignment verification.
  - `assembler.ts`: The core OLC iterative reduction assembler.
  - `generator.ts`: Fragment sampling logic and parameter validation.
  - `input.ts`: Input parsing and validation utilities.
  - `main.ts`: Application controller wiring UI to domain logic.
  - `presets.ts`: Built-in sequence presets.
  - `types.ts`: Core domain interfaces.
  - `ui/`: Pure HTML template renderers for DOM views.
- `static/index.html`: Base HTML template.
- `docs/`: Technical specifications, parameter heuristics, and domain guides.
- `dist/`: Generated standalone distribution bundle.
- `test/`: Automated test suite (assembler, generator, alignment, views).
- `build.mjs`: Standalone esbuild script.
- `serve.mjs`: Local development HTTP server.
- `.github/workflows/pages.yml`: Automated deployment to GitHub Pages.

## License

This project is licensed under the BSD-3-Clause licence. See the
[LICENSE](LICENSE) file for details.
