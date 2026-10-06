import { AssemblyStep } from '../types.js';

/**
 * Render the merge theatre demonstrating suffix-prefix sliding alignment
 * and fused contig output.
 */
export function renderMergeTheatre(
  container: HTMLElement,
  step: AssemblyStep | null
): void {
  container.innerHTML = '';

  if (!step || !step.candidate) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'theatre-empty';
    if (step?.type === 'completed') {
      emptyMsg.textContent =
        'Assembly complete. See reference comparison below.';
    } else {
      emptyMsg.textContent =
        'No active merge in this step. Step forward to observe pairwise ' +
        'overlap.';
    }
    container.appendChild(emptyMsg);
    return;
  }

  const { prefix, suffix, matchLength } = step.candidate;
  const prefixNonOverlapLen = prefix.length - matchLength;

  // Row 1: Prefix fragment
  const prefixRow = document.createElement('div');
  prefixRow.className = 'alignment-row';

  const prefixLabel = document.createElement('span');
  prefixLabel.className = 'align-label';
  prefixLabel.textContent = 'Prefix:';
  prefixRow.appendChild(prefixLabel);

  const prefixBox = document.createElement('div');
  prefixBox.className = 'seq-box';

  for (let i = 0; i < prefix.length; i++) {
    const cell = document.createElement('div');
    cell.className = 'char-cell';
    cell.textContent = prefix[i];
    if (i >= prefixNonOverlapLen) {
      cell.classList.add('overlap');
    } else {
      cell.classList.add('prefix-char');
    }
    prefixBox.appendChild(cell);
  }
  prefixRow.appendChild(prefixBox);
  container.appendChild(prefixRow);

  // Row 2: Suffix fragment (shifted to align overlap columns)
  const suffixRow = document.createElement('div');
  suffixRow.className = 'alignment-row';

  const suffixLabel = document.createElement('span');
  suffixLabel.className = 'align-label';
  suffixLabel.textContent = 'Suffix:';
  suffixRow.appendChild(suffixLabel);

  const suffixBox = document.createElement('div');
  suffixBox.className = 'seq-box';

  // Spacer cells to align suffix under prefix overlap
  for (let i = 0; i < prefixNonOverlapLen; i++) {
    const spacer = document.createElement('div');
    spacer.className = 'char-cell gap';
    spacer.textContent = '';
    suffixBox.appendChild(spacer);
  }

  for (let i = 0; i < suffix.length; i++) {
    const cell = document.createElement('div');
    cell.className = 'char-cell';
    cell.textContent = suffix[i];
    if (i < matchLength) {
      cell.classList.add('overlap');
    } else {
      cell.classList.add('suffix-char');
    }
    suffixBox.appendChild(cell);
  }
  suffixRow.appendChild(suffixBox);
  container.appendChild(suffixRow);

  // Row 3: Merged Contig (if in merge-pair or later)
  if (step.type === 'merge-pair' || step.type === 'filter-dynamic') {
    const mergedRow = document.createElement('div');
    mergedRow.className = 'alignment-row';

    const mergedLabel = document.createElement('span');
    mergedLabel.className = 'align-label';
    mergedLabel.textContent = 'Merged:';
    mergedRow.appendChild(mergedLabel);

    const mergedBox = document.createElement('div');
    mergedBox.className = 'seq-box';

    const mergedStr = prefix + suffix.slice(matchLength);
    for (let i = 0; i < mergedStr.length; i++) {
      const cell = document.createElement('div');
      cell.className = 'char-cell';
      cell.textContent = mergedStr[i];
      if (i < prefixNonOverlapLen) {
        cell.classList.add('prefix-char');
      } else if (i < prefix.length) {
        cell.classList.add('overlap');
      } else {
        cell.classList.add('suffix-char');
      }
      mergedBox.appendChild(cell);
    }
    mergedRow.appendChild(mergedBox);
    container.appendChild(mergedRow);
  }
}
