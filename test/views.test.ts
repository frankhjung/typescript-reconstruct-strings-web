import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { renderPoolHtml } from '../src/ui/poolView.js'
import { renderMergeTheatreHtml } from '../src/ui/mergeView.js'
import { renderDiffViewHtml } from '../src/ui/diffView.js'
import { AlignmentReport, AssemblyStep } from '../src/types.js'

describe('Declarative Views - Pool View', () => {
  it('renders empty string when step is null', () => {
    assert.equal(renderPoolHtml(null), '')
  })

  it('renders fragment cards for active pool', () => {
    const step: AssemblyStep = {
      stepIndex: 0,
      type: 'init',
      pool: ['ABC', 'BCD'],
      description: 'Initial pool'
    }
    const html = renderPoolHtml(step)
    assert.ok(html.includes('fragment-card'))
    assert.ok(html.includes('ABC'))
    assert.ok(html.includes('BCD'))
  })

  it('highlights prefix and suffix candidates with badges', () => {
    const step: AssemblyStep = {
      stepIndex: 1,
      type: 'find-overlap',
      pool: ['ABC', 'BCD'],
      candidate: {
        prefix: 'ABC',
        suffix: 'BCD',
        matchLength: 2
      },
      description: 'Found overlap'
    }
    const html = renderPoolHtml(step)
    assert.ok(html.includes('active-prefix'))
    assert.ok(html.includes('active-suffix'))
    assert.ok(html.includes('badge prefix'))
    assert.ok(html.includes('badge suffix'))
  })

  it('renders removed and merged fragments', () => {
    const step: AssemblyStep = {
      stepIndex: 2,
      type: 'filter-dynamic',
      pool: ['ABCD'],
      mergedFragment: 'ABCD',
      removedFragments: ['BC'],
      description: 'Filtered contained'
    }
    const html = renderPoolHtml(step)
    assert.ok(html.includes('merged-new'))
    assert.ok(html.includes('badge merged'))
    assert.ok(html.includes('fragment-card removed'))
    assert.ok(html.includes('Contained'))
  })
})

describe('Declarative Views - Merge Theatre', () => {
  it('renders empty state when step or candidate is null', () => {
    const emptyHtml = renderMergeTheatreHtml(null)
    assert.ok(emptyHtml.includes('theatre-empty'))

    const completedStep: AssemblyStep = {
      stepIndex: 5,
      type: 'completed',
      pool: ['ABCDE'],
      description: 'Done'
    }
    const completedHtml = renderMergeTheatreHtml(completedStep)
    assert.ok(completedHtml.includes('Assembly complete'))
  })

  it('renders aligned prefix, suffix, and overlap cells', () => {
    const step: AssemblyStep = {
      stepIndex: 1,
      type: 'find-overlap',
      pool: ['ABC', 'BCD'],
      candidate: {
        prefix: 'ABC',
        suffix: 'BCD',
        matchLength: 2
      },
      description: 'Overlap found'
    }
    const html = renderMergeTheatreHtml(step)
    assert.ok(html.includes('Prefix:'))
    assert.ok(html.includes('Suffix:'))
    assert.ok(html.includes('char-cell'))
    assert.ok(html.includes('overlap'))
    assert.ok(!html.includes('Merged:'))
  })

  it('renders merged row on merge-pair step', () => {
    const step: AssemblyStep = {
      stepIndex: 2,
      type: 'merge-pair',
      pool: ['ABCD'],
      candidate: {
        prefix: 'ABC',
        suffix: 'BCD',
        matchLength: 2
      },
      mergedFragment: 'ABCD',
      description: 'Merged pair'
    }
    const html = renderMergeTheatreHtml(step)
    assert.ok(html.includes('Merged:'))
    assert.ok(html.includes('>A<'))
    assert.ok(html.includes('>B<'))
    assert.ok(html.includes('>C<'))
    assert.ok(html.includes('>D<'))
  })
})

describe('Declarative Views - Diff / Alignment View', () => {
  it('renders empty state when report is null', () => {
    const html = renderDiffViewHtml(null)
    assert.ok(html.includes('theatre-empty'))
    assert.ok(html.includes('Run assembly'))
  })

  it('renders metrics cards, stacked alignment, and legend', () => {
    const report: AlignmentReport = {
      source: 'ABCDE',
      contigs: ['ABCDE'],
      perfectMatch: true,
      coveredPositions: [true, true, true, true, true],
      coveragePercent: 100,
      coveredSpans: [{ start: 0, end: 5 }],
      uncoveredSpans: [],
      alignments: [{ contig: 'ABCDE', sourceStart: 0, length: 5, isExact: true }],
      unalignedContigs: [],
      summary: 'PERFECT RECONSTRUCTION'
    }
    const html = renderDiffViewHtml(report)
    assert.ok(html.includes('100% Perfect Match'))
    assert.ok(html.includes('100.0%'))
    assert.ok(html.includes('Contig 1:'))
    assert.ok(html.includes('Exact Match'))
    assert.ok(html.includes('PERFECT RECONSTRUCTION'))
  })

  it('renders gaps and misassembly warnings when present', () => {
    const report: AlignmentReport = {
      source: 'ABCDEF',
      contigs: ['ABC', 'ZZZ'],
      perfectMatch: false,
      coveredPositions: [true, true, true, false, false, false],
      coveragePercent: 50,
      coveredSpans: [{ start: 0, end: 3 }],
      uncoveredSpans: [{ start: 3, end: 6 }],
      alignments: [{ contig: 'ABC', sourceStart: 0, length: 3, isExact: true }],
      unalignedContigs: ['ZZZ'],
      summary: 'MISASSEMBLY DETECTED'
    }
    const html = renderDiffViewHtml(report)
    assert.ok(html.includes('Misassembly'))
    assert.ok(html.includes('Chimera 1:'))
    assert.ok(html.includes('>Z<'))
  })
})

describe('Security - HTML Sanitisation', () => {
  it('escapes special HTML characters in pool view', () => {
    const maliciousStep: AssemblyStep = {
      stepIndex: 0,
      type: 'init',
      pool: ['<script>alert(1)</script>'],
      description: 'Test XSS'
    }
    const html = renderPoolHtml(maliciousStep)
    assert.ok(!html.includes('<script>'))
    assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'))
  })

  it('escapes special HTML characters in merge theatre', () => {
    const maliciousStep: AssemblyStep = {
      stepIndex: 1,
      type: 'find-overlap',
      pool: ['<A>', 'A>B'],
      candidate: {
        prefix: '<A>',
        suffix: 'A>B',
        matchLength: 1
      },
      description: 'Test overlap'
    }
    const html = renderMergeTheatreHtml(maliciousStep)
    assert.ok(!html.includes('<div><</div>'))
    assert.ok(html.includes('&lt;'))
    assert.ok(html.includes('&gt;'))
  })

  it('escapes special characters in diff view summary', () => {
    const report: AlignmentReport = {
      source: '<SRC>',
      contigs: ['<SRC>'],
      perfectMatch: true,
      coveredPositions: [true, true, true, true, true],
      coveragePercent: 100,
      coveredSpans: [{ start: 0, end: 5 }],
      uncoveredSpans: [],
      alignments: [{ contig: '<SRC>', sourceStart: 0, length: 5, isExact: true }],
      unalignedContigs: [],
      summary: '<b onmouseover=alert(1)>Summary</b>'
    }
    const html = renderDiffViewHtml(report)
    assert.ok(!html.includes('<b onmouseover'))
    assert.ok(html.includes('&lt;b onmouseover'))
  })
})
