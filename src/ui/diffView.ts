import { AlignmentReport } from '../types.js';

/**
 * Render the stacked reference alignment view and assembly metrics.
 */
export function renderDiffView(
  container: HTMLElement,
  report: AlignmentReport | null
): void {
  container.innerHTML = '';
  if (!report) {
    const empty = document.createElement('div');
    empty.className = 'theatre-empty';
    empty.textContent = 'Run assembly to generate reference comparison.';
    container.appendChild(empty);
    return;
  }

  // 1. Metrics Row
  const metricsRow = document.createElement('div');
  metricsRow.className = 'metrics-row';

  // Status Card
  const statusCard = document.createElement('div');
  statusCard.className = 'metric-card';
  const statusTitle = document.createElement('div');
  statusTitle.className = 'metric-title';
  statusTitle.textContent = 'Assembly Status';
  statusCard.appendChild(statusTitle);

  const statusVal = document.createElement('div');
  statusVal.className = 'metric-value';
  if (report.perfectMatch) {
    statusVal.classList.add('success');
    statusVal.textContent = '100% Perfect Match';
  } else if (report.unalignedContigs.length > 0) {
    statusVal.classList.add('danger');
    statusVal.textContent = 'Misassembly';
  } else {
    statusVal.classList.add('warning');
    statusVal.textContent = `${report.coveragePercent.toFixed(1)}% Coverage`;
  }
  statusCard.appendChild(statusVal);
  metricsRow.appendChild(statusCard);

  // Coverage Card
  const covCard = document.createElement('div');
  covCard.className = 'metric-card';
  const covTitle = document.createElement('div');
  covTitle.className = 'metric-title';
  covTitle.textContent = 'Sequence Coverage';
  covCard.appendChild(covTitle);

  const covVal = document.createElement('div');
  covVal.className = 'metric-value';
  covVal.textContent = `${report.coveragePercent.toFixed(1)}%`;
  covCard.appendChild(covVal);
  metricsRow.appendChild(covCard);

  // Contig Count Card
  const contigCard = document.createElement('div');
  contigCard.className = 'metric-card';
  const contigTitle = document.createElement('div');
  contigTitle.className = 'metric-title';
  contigTitle.textContent = 'Contigs Reconstructed';
  contigCard.appendChild(contigTitle);

  const contigVal = document.createElement('div');
  contigVal.className = 'metric-value';
  contigVal.textContent = `${report.contigs.length}`;
  contigCard.appendChild(contigVal);
  metricsRow.appendChild(contigCard);

  // Summary message
  const summaryMsg = document.createElement('div');
  summaryMsg.className = 'status-explanation';
  summaryMsg.textContent = report.summary;


  // 2. Stacked Alignment View
  const alignView = document.createElement('div');
  alignView.className = 'stacked-alignment-view';

  // Source Row
  const srcRow = document.createElement('div');
  srcRow.className = 'alignment-row';

  const srcLabel = document.createElement('span');
  srcLabel.className = 'align-label';
  srcLabel.textContent = 'Source:';
  srcRow.appendChild(srcLabel);

  const srcBox = document.createElement('div');
  srcBox.className = 'seq-box';

  const source = report.source;
  for (let i = 0; i < source.length; i++) {
    const cell = document.createElement('div');
    cell.className = 'char-cell';
    cell.textContent = source[i];
    if (report.coveredPositions[i]) {
      cell.classList.add('match');
    } else {
      cell.classList.add('gap');
    }
    srcBox.appendChild(cell);
  }
  srcRow.appendChild(srcBox);
  alignView.appendChild(srcRow);

  // Contig Rows
  report.alignments.forEach((align, idx) => {
    const contigRow = document.createElement('div');
    contigRow.className = 'alignment-row';

    const contigLabel = document.createElement('span');
    contigLabel.className = 'align-label';
    contigLabel.textContent = `Contig ${idx + 1}:`;
    contigRow.appendChild(contigLabel);

    const contigBox = document.createElement('div');
    contigBox.className = 'seq-box';

    // Spacer cells up to start
    for (let i = 0; i < align.sourceStart; i++) {
      const spacer = document.createElement('div');
      spacer.className = 'char-cell gap';
      spacer.textContent = '';
      contigBox.appendChild(spacer);
    }

    // Contig characters
    for (let i = 0; i < align.contig.length; i++) {
      const cell = document.createElement('div');
      cell.className = 'char-cell';
      cell.textContent = align.contig[i];

      const srcIdx = align.sourceStart + i;
      if (srcIdx < source.length && source[srcIdx] === align.contig[i]) {
        cell.classList.add('match');
      } else {
        cell.classList.add('mismatch');
      }
      contigBox.appendChild(cell);
    }
    contigRow.appendChild(contigBox);
    alignView.appendChild(contigRow);
  });

  // Render unaligned or chimeric contigs
  report.unalignedContigs.forEach((contig, idx) => {
    const contigRow = document.createElement('div');
    contigRow.className = 'alignment-row';

    const contigLabel = document.createElement('span');
    contigLabel.className = 'align-label';
    contigLabel.textContent = `Chimera ${idx + 1}:`;
    contigRow.appendChild(contigLabel);

    const contigBox = document.createElement('div');
    contigBox.className = 'seq-box';

    for (let i = 0; i < contig.length; i++) {
      const cell = document.createElement('div');
      cell.className = 'char-cell mismatch';
      cell.textContent = contig[i];
      contigBox.appendChild(cell);
    }
    contigRow.appendChild(contigBox);
    alignView.appendChild(contigRow);
  });

  container.appendChild(alignView);

  // 3. Legend
  const legend = document.createElement('div');
  legend.className = 'legend';

  const l1 = document.createElement('div');
  l1.className = 'legend-item';
  l1.innerHTML = '<span class="legend-box match"></span> Exact Match';
  legend.appendChild(l1);

  const l2 = document.createElement('div');
  l2.className = 'legend-item';
  l2.innerHTML = '<span class="legend-box mismatch"></span> Mismatch / Error';
  legend.appendChild(l2);

  const l3 = document.createElement('div');
  l3.className = 'legend-item';
  l3.innerHTML = '<span class="legend-box gap"></span> Uncovered Gap';
  legend.appendChild(l3);

  container.appendChild(legend);

  // Add metrics and summary underneath
  metricsRow.style.marginTop = '1.5rem';
  container.appendChild(metricsRow);
  container.appendChild(summaryMsg);
}
