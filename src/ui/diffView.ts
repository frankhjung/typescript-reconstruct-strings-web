import type { AlignmentReport } from '../types.js'
import { escapeHtml } from './escape.js'

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

function legendItem(cls: string, label: string): string {
  return (
    `<div class="legend-item">` +
    `<span class="legend-box ${cls}"></span> ${label}</div>`
  )
}

function metricCard(title: string, value: string, valueClass = ''): string {
  return `
      <div class="metric-card">
        <div class="metric-title">${title}</div>
        <div class="metric-value ${valueClass}">${value}</div>
      </div>`
}

/**
 * Pure template renderer for the stacked reference alignment view and
 * assembly metrics.
 */
export function renderDiffViewHtml(report: AlignmentReport | null): string {
  if (!report) {
    return (
      '<div class="theatre-empty">' +
      'Run assembly to generate reference comparison.</div>'
    )
  }

  // 1. Stacked Alignment View
  const sourceCells = Array.from(report.source)
    .map((char, i) =>
      cell(
        report.coveredPositions[i] ? 'char-cell match' : 'char-cell gap',
        char
      )
    )
    .join('')

  const contigRows = report.alignments
    .map((align, idx) => {
      const contigCells = Array.from(align.contig)
        .map((char, i) => {
          const isMatch = report.source[align.sourceStart + i] === char
          return cell(isMatch ? 'char-cell match' : 'char-cell mismatch', char)
        })
        .join('')
      return row(
        `Contig ${idx + 1}`,
        GAP_CELL.repeat(align.sourceStart) + contigCells
      )
    })
    .join('')

  const chimeraRows = report.unalignedContigs
    .map((contig, idx) =>
      row(
        `Chimera ${idx + 1}`,
        Array.from(contig)
          .map((char) => cell('char-cell mismatch', char))
          .join('')
      )
    )
    .join('')

  const alignmentView = `
    <div class="stacked-alignment-view">
      ${row('Source', sourceCells)}
      ${contigRows}
      ${chimeraRows}
    </div>
  `

  // 2. Legend
  const legend = `
    <div class="legend">
      ${legendItem('match', 'Exact Match')}
      ${legendItem('mismatch', 'Mismatch / Error')}
      ${legendItem('gap', 'Uncovered Gap')}
    </div>
  `

  // 3. Metrics Row
  const coverage = `${report.coveragePercent.toFixed(1)}%`
  let statusClass = 'warning'
  let statusText = `${coverage} Coverage`
  if (report.perfectMatch) {
    statusClass = 'success'
    statusText = '100% Perfect Match'
  } else if (report.unalignedContigs.length > 0) {
    statusClass = 'danger'
    statusText = 'Misassembly'
  }

  const metricsRow = `
    <div class="metrics-row spaced">
      ${metricCard('Assembly Status', statusText, statusClass)}
      ${metricCard('Sequence Coverage', coverage)}
      ${metricCard('Contigs Reconstructed', String(report.contigs.length))}
    </div>
  `

  // 4. Summary message
  const summaryMsg =
    `<div class="status-explanation">` + `${escapeHtml(report.summary)}</div>`

  return alignmentView + legend + metricsRow + summaryMsg
}
