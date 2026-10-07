import { AlignmentReport } from '../types.js'
import { escapeHtml } from './escape.js'

/**
 * Pure template renderer for the stacked reference alignment view and assembly metrics.
 */
export function renderDiffViewHtml(report: AlignmentReport | null): string {
  if (!report) {
    return '<div class="theatre-empty">Run assembly to generate reference comparison.</div>'
  }

  // 1. Stacked Alignment View
  const sourceCells = Array.from(report.source).map((char, i) => {
    const cls = report.coveredPositions[i] ? 'char-cell match' : 'char-cell gap'
    return `<div class="${cls}">${escapeHtml(char)}</div>`
  }).join('')

  const sourceRow = `
    <div class="alignment-row">
      <span class="align-label">Source:</span>
      <div class="seq-box">${sourceCells}</div>
    </div>
  `

  const contigRows = report.alignments.map((align, idx) => {
    const spacers = '<div class="char-cell gap"></div>'.repeat(align.sourceStart)
    const contigCells = Array.from(align.contig).map((char, i) => {
      const srcIdx = align.sourceStart + i
      const isMatch = srcIdx < report.source.length && report.source[srcIdx] === char
      const cls = isMatch ? 'char-cell match' : 'char-cell mismatch'
      return `<div class="${cls}">${escapeHtml(char)}</div>`
    }).join('')

    return `
      <div class="alignment-row">
        <span class="align-label">Contig ${idx + 1}:</span>
        <div class="seq-box">${spacers}${contigCells}</div>
      </div>
    `
  }).join('')

  const chimeraRows = report.unalignedContigs.map((contig, idx) => {
    const cells = Array.from(contig).map(char =>
      `<div class="char-cell mismatch">${escapeHtml(char)}</div>`
    ).join('')

    return `
      <div class="alignment-row">
        <span class="align-label">Chimera ${idx + 1}:</span>
        <div class="seq-box">${cells}</div>
      </div>
    `
  }).join('')

  const alignmentView = `
    <div class="stacked-alignment-view">
      ${sourceRow}
      ${contigRows}
      ${chimeraRows}
    </div>
  `

  // 2. Legend
  const legend = `
    <div class="legend">
      <div class="legend-item"><span class="legend-box match"></span> Exact Match</div>
      <div class="legend-item"><span class="legend-box mismatch"></span> Mismatch / Error</div>
      <div class="legend-item"><span class="legend-box gap"></span> Uncovered Gap</div>
    </div>
  `

  // 3. Metrics Row
  let statusClass = 'warning'
  let statusText = `${report.coveragePercent.toFixed(1)}% Coverage`
  if (report.perfectMatch) {
    statusClass = 'success'
    statusText = '100% Perfect Match'
  } else if (report.unalignedContigs.length > 0) {
    statusClass = 'danger'
    statusText = 'Misassembly'
  }

  const metricsRow = `
    <div class="metrics-row" style="margin-top: 1.5rem;">
      <div class="metric-card">
        <div class="metric-title">Assembly Status</div>
        <div class="metric-value ${statusClass}">${statusText}</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Sequence Coverage</div>
        <div class="metric-value">${report.coveragePercent.toFixed(1)}%</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Contigs Reconstructed</div>
        <div class="metric-value">${report.contigs.length}</div>
      </div>
    </div>
  `

  // 4. Summary message
  const summaryMsg = `<div class="status-explanation">${escapeHtml(report.summary)}</div>`

  return alignmentView + legend + metricsRow + summaryMsg
}

/**
 * Render the stacked reference alignment view and assembly metrics (backward-compatible adapter).
 */
export function renderDiffView(
  container: HTMLElement,
  report: AlignmentReport | null
): void {
  container.innerHTML = renderDiffViewHtml(report)
}
