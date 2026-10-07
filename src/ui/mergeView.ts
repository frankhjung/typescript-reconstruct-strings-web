import { AssemblyStep } from '../types.js'

/**
 * Pure template renderer for the merge theatre demonstrating suffix-prefix
 * sliding alignment and fused contig output.
 */
export function renderMergeTheatreHtml(step: AssemblyStep | null): string {
  if (!step || !step.candidate) {
    const msg = step?.type === 'completed'
      ? 'Assembly complete. See reference comparison below.'
      : 'No active merge in this step. Step forward to observe pairwise overlap.'
    return `<div class="theatre-empty">${msg}</div>`
  }

  const { prefix, suffix, matchLength } = step.candidate
  const prefixNonOverlapLen = prefix.length - matchLength

  // Prefix row
  const prefixCells = Array.from(prefix).map((char, i) => {
    const cls = i >= prefixNonOverlapLen ? 'char-cell overlap' : 'char-cell prefix-char'
    return `<div class="${cls}">${char}</div>`
  }).join('')

  const prefixRow = `
    <div class="alignment-row">
      <span class="align-label">Prefix:</span>
      <div class="seq-box">${prefixCells}</div>
    </div>
  `

  // Suffix row (shifted to align overlap columns)
  const spacerCells = '<div class="char-cell gap"></div>'.repeat(prefixNonOverlapLen)
  const suffixCells = Array.from(suffix).map((char, i) => {
    const cls = i < matchLength ? 'char-cell overlap' : 'char-cell suffix-char'
    return `<div class="${cls}">${char}</div>`
  }).join('')

  const suffixRow = `
    <div class="alignment-row">
      <span class="align-label">Suffix:</span>
      <div class="seq-box">${spacerCells}${suffixCells}</div>
    </div>
  `

  // Merged Contig (if in merge-pair or later)
  let mergedRow = ''
  if (step.type === 'merge-pair' || step.type === 'filter-dynamic') {
    const mergedStr = prefix + suffix.slice(matchLength)
    const mergedCells = Array.from(mergedStr).map((char, i) => {
      let cls = 'char-cell suffix-char'
      if (i < prefixNonOverlapLen) {
        cls = 'char-cell prefix-char'
      } else if (i < prefix.length) {
        cls = 'char-cell overlap'
      }
      return `<div class="${cls}">${char}</div>`
    }).join('')

    mergedRow = `
      <div class="alignment-row">
        <span class="align-label">Merged:</span>
        <div class="seq-box">${mergedCells}</div>
      </div>
    `
  }

  return prefixRow + suffixRow + mergedRow
}

/**
 * Render the merge theatre (backward-compatible adapter).
 */
export function renderMergeTheatre(
  container: HTMLElement,
  step: AssemblyStep | null
): void {
  container.innerHTML = renderMergeTheatreHtml(step)
}
