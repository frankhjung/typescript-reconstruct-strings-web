import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { ReductionEvent } from '../src/types.js'
import { projectStepView } from '../src/ui/stepView.js'

describe('projectStepView (Pure View Projection)', () => {
  it('projects initial-filtered event with removed fragments', () => {
    const event: ReductionEvent = {
      kind: 'initial-filtered',
      pool: ['ABC', 'DEF'],
      removed: [{ fragment: 'BC', reason: 'contained' }]
    }
    const view = projectStepView(event)
    assert.deepEqual(view.pool, ['ABC', 'DEF'])
    assert.deepEqual(view.removed, [{ fragment: 'BC', reason: 'contained' }])
    assert.equal(view.candidate, undefined)
    assert.equal(view.mergedFragment, undefined)
    assert.ok(view.description.includes('Filtered 1 redundant fragments'))
  })

  it('projects initial-filtered event with no removed fragments', () => {
    const event: ReductionEvent = {
      kind: 'initial-filtered',
      pool: ['ABC', 'DEF'],
      removed: []
    }
    const view = projectStepView(event)
    assert.equal(view.removed.length, 0)
    assert.ok(view.description.includes('All 2 fragments are unique'))
  })

  it('projects candidate-selected event', () => {
    const event: ReductionEvent = {
      kind: 'candidate-selected',
      pool: ['ABC', 'BCD'],
      candidate: { prefix: 'ABC', suffix: 'BCD', matchLength: 2 }
    }
    const view = projectStepView(event)
    assert.deepEqual(view.candidate, {
      prefix: 'ABC',
      suffix: 'BCD',
      matchLength: 2
    })
    assert.equal(view.mergedFragment, undefined)
    assert.ok(view.description.includes('Found best overlap of length 2'))
  })

  it('projects pair-merged event', () => {
    const event: ReductionEvent = {
      kind: 'pair-merged',
      pool: ['ABCD'],
      candidate: { prefix: 'ABC', suffix: 'BCD', matchLength: 2 },
      mergedFragment: 'ABCD'
    }
    const view = projectStepView(event)
    assert.equal(view.mergedFragment, 'ABCD')
    assert.ok(view.description.includes('Merged "ABC" and "BCD" into "ABCD"'))
  })

  it('projects dynamic-filtered event', () => {
    const event: ReductionEvent = {
      kind: 'dynamic-filtered',
      pool: ['ABCD'],
      removed: [{ fragment: 'BC', reason: 'contained' }],
      mergedFragment: 'ABCD'
    }
    const view = projectStepView(event)
    assert.equal(view.mergedFragment, 'ABCD')
    assert.deepEqual(view.removed, [{ fragment: 'BC', reason: 'contained' }])
    assert.ok(view.description.includes('Dynamic containment: eliminated BC'))
  })

  it('projects assembly-completed event', () => {
    const event: ReductionEvent = {
      kind: 'assembly-completed',
      pool: ['ABCDE'],
      contigs: ['ABCDE']
    }
    const view = projectStepView(event)
    assert.deepEqual(view.pool, ['ABCDE'])
    assert.ok(view.description.includes('Assembly complete: reconstructed 1'))
  })
})
