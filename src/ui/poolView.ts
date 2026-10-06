import { AssemblyStep } from '../types.js';

/**
 * Render the fragment pool cards in the workspace grid.
 */
export function renderPool(
  container: HTMLElement,
  step: AssemblyStep | null
): void {
  container.innerHTML = '';
  if (!step) {
    return;
  }

  const pool = step.pool;
  const candidate = step.candidate;
  const mergedFragment = step.mergedFragment;
  const removed = step.removedFragments ?? [];

  // Render active pool fragments
  for (const fragment of pool) {
    const card = document.createElement('div');
    card.className = 'fragment-card';

    const isPrefix = candidate?.prefix === fragment;
    const isSuffix = candidate?.suffix === fragment;
    const isNewMerged = mergedFragment === fragment;

    if (isPrefix) {
      card.classList.add('active-prefix');
    } else if (isSuffix) {
      card.classList.add('active-suffix');
    } else if (isNewMerged) {
      card.classList.add('merged-new');
    }

    const textSpan = document.createElement('span');
    textSpan.textContent = fragment;
    card.appendChild(textSpan);

    if (isPrefix) {
      const badge = document.createElement('span');
      badge.className = 'badge prefix';
      badge.textContent = 'Prefix';
      card.appendChild(badge);
    } else if (isSuffix) {
      const badge = document.createElement('span');
      badge.className = 'badge suffix';
      badge.textContent = 'Suffix';
      card.appendChild(badge);
    } else if (isNewMerged) {
      const badge = document.createElement('span');
      badge.className = 'badge merged';
      badge.textContent = 'Merged';
      card.appendChild(badge);
    }

    container.appendChild(card);
  }

  // Render any fragments that were eliminated in this step
  for (const rem of removed) {
    const card = document.createElement('div');
    card.className = 'fragment-card removed';

    const textSpan = document.createElement('span');
    textSpan.textContent = rem;
    card.appendChild(textSpan);

    const badge = document.createElement('span');
    badge.className = 'badge removed';
    badge.textContent = 'Contained';
    card.appendChild(badge);

    container.appendChild(card);
  }
}
