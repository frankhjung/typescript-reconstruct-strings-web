import { AssemblyStep } from '../types.js'

/**
 * Pure template renderer for the fragment pool workspace.
 */
export function renderPoolHtml(step: AssemblyStep | null): string {
  if (!step) {
    return ''
  }

  const pool = step.pool
  const candidate = step.candidate
  const mergedFragment = step.mergedFragment
  const removed = step.removedFragments ?? []

  const activeCards = pool.map(fragment => {
    const isPrefix = candidate?.prefix === fragment
    const isSuffix = candidate?.suffix === fragment
    const isNewMerged = mergedFragment === fragment

    let activeClass = ''
    let badgeHtml = ''

    if (isPrefix) {
      activeClass = ' active-prefix'
      badgeHtml = '<span class="badge prefix">Prefix</span>'
    } else if (isSuffix) {
      activeClass = ' active-suffix'
      badgeHtml = '<span class="badge suffix">Suffix</span>'
    } else if (isNewMerged) {
      activeClass = ' merged-new'
      badgeHtml = '<span class="badge merged">Merged</span>'
    }

    return `<div class="fragment-card${activeClass}"><span>${fragment}</span>${badgeHtml}</div>`
  }).join('')

  const removedCards = removed.map(rem =>
    `<div class="fragment-card removed"><span>${rem}</span><span class="badge removed">Contained</span></div>`
  ).join('')

  return activeCards + removedCards
}

/**
 * Render the fragment pool cards in the workspace grid (backward-compatible adapter).
 */
export function renderPool(
  container: HTMLElement,
  step: AssemblyStep | null
): void {
  container.innerHTML = renderPoolHtml(step)
}
