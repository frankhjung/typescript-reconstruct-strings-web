# Reconstruct Strings Web

This project provides an interactive web-based animation for the
Overlap-Layout-Consensus (OLC) sequence assembler. It visually demonstrates how
string fragments are assembled into contiguous sequences (contigs).

## Quick Start

### Prerequisites

- Node.js (>= 18 recommended)
- npm (Node Package Manager)

### Installation

Install the project dependencies using `make` (or `npm`):

```bash
make install
# or
npm install
```

### Development Scripts

The project includes several scripts to facilitate development. You can run
these using `make` or the traditional `npm` commands:

- **Build**: Compiles the TypeScript source into a web-ready bundle.

  ```bash
  make build
  # or
  npm run build
  ```

- **Typecheck**: Validates TypeScript types without emitting compiled output.

  ```bash
  make typecheck
  # or
  npm run typecheck
  ```

- **Test**: Runs the test suite.

  ```bash
  make test
  # or
  npm run test
  ```

- **Clean**: Removes the compiled output.

  ```bash
  make clean
  ```

You can also run the default pipeline (checks, builds, and tests) by simply
running `make`. Run `make help` to see all available targets.

### Directory Structure

- `src/`: TypeScript source code and modules.
- `static/`: Static assets (HTML, CSS, images).
- `test/`: Unit and integration tests.
- `build.mjs`: Build script utilizing `esbuild`.

## License

This project is licensed under the BSD-3-Clause license. See the `LICENSE` file
for details.
