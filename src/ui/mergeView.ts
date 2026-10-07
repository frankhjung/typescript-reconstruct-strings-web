import type { AssemblyStep } from '../types.js'
import { escapeHtml } from './escape.js'
import { stepDetails } from './stepDetails.js'

const GAP_CELL = '<div class="char-cell gap"></div>'

function cell(cls: string, char: string): string {
  return `<div class="${cls}">${escapeHtml(char)}</div>`
}

function row(label: string, cells: string): string {
  return `
    <div class="alignment-row">
      <span class="align-label">${label}:</span>
      <div class="seq-box">${cells}</div>
    </div>
  `
}

/**
 * Pure template renderer for the merge theatre demonstrating suffix-prefix
 * sliding alignment and fused contig output.
 */
export function renderMergeTheatreHtml(step: AssemblyStep | null): string {
  const candidate = step ? stepDetails(step).candidate : undefined
  if (!step || !candidate) {
    const msg =
      step?.type === 'completed'
        ? 'Assembly complete. See reference comparison below.'
        : 'No active merge in this step. ' +
          'Step forward to observe pairwise overlap.'
    return `<div class="theatre-empty">${msg}</div>`
  }

  const { prefix, suffix, matchLength } = candidate
  const prefixNonOverlapLen = prefix.length - matchLength

  const prefixCells = Array.from(prefix)
    .map((char, i) =>
      cell(
        i >= prefixNonOverlapLen
          ? 'char-cell overlap'
          : 'char-cell prefix-char',
        char
      )
    )
    .join('')

  // Suffix row is shifted to align the overlap columns
  const suffixCells = Array.from(suffix)
    .map((char, i) =>
      cell(
        i < matchLength ? 'char-cell overlap' : 'char-cell suffix-char',
        char
      )
    )
    .join('')

  let mergedRow = ''
  if (step.type === 'merge-pair' || step.type === 'filter-dynamic') {
    const mergedStr = prefix + suffix.slice(matchLength)
    const mergedCells = Array.from(mergedStr)
      .map((char, i) => {
        let cls = 'char-cell suffix-char'
        if (i < prefixNonOverlapLen) {
          cls = 'char-cell prefix-char'
        } else if (i < prefix.length) {
          cls = 'char-cell overlap'
        }
        return cell(cls, char)
      })
      .join('')
    mergedRow = row('Merged', mergedCells)
  }

  return (
    row('Prefix', prefixCells) +
    row('Suffix', GAP_CELL.repeat(prefixNonOverlapLen) + suffixCells) +
    mergedRow
  )
}
