import type { AssemblyStep, RemovedFragment } from '../types.js'
import { escapeHtml } from './escape.js'
import { stepDetails } from './stepDetails.js'

function removalBadge(removed: RemovedFragment): string {
  if (removed.reason === 'duplicate') {
    return `Duplicate &times;${removed.copies ?? 1}`
  }
  return 'Contained'
}

/**
 * Pure template renderer for the fragment pool workspace.
 */
export function renderPoolHtml(step: AssemblyStep | null): string {
  if (!step) {
    return ''
  }

  const { candidate, mergedFragment, removed } = stepDetails(step)

  const activeCards = step.pool
    .map((fragment) => {
      let activeClass = ''
      let badgeHtml = ''

      if (candidate?.prefix === fragment) {
        activeClass = ' active-prefix'
        badgeHtml = '<span class="badge prefix">Prefix</span>'
      } else if (candidate?.suffix === fragment) {
        activeClass = ' active-suffix'
        badgeHtml = '<span class="badge suffix">Suffix</span>'
      } else if (mergedFragment === fragment) {
        activeClass = ' merged-new'
        badgeHtml = '<span class="badge merged">Merged</span>'
      }

      return (
        `<div class="fragment-card${activeClass}">` +
        `<span>${escapeHtml(fragment)}</span>${badgeHtml}</div>`
      )
    })
    .join('')

  const removedCards = removed
    .map(
      (r) =>
        `<div class="fragment-card removed">` +
        `<span>${escapeHtml(r.fragment)}</span>` +
        `<span class="badge removed">${removalBadge(r)}</span></div>`
    )
    .join('')

  return activeCards + removedCards
}
