import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  assemble,
  assembleWithTrace,
  calculateOverlap,
  filterContainedFragments,
  mergePair,
  sortCanonical,
  startSession,
  stepSession,
  traceAssembly
} from '../src/assembler.js'

describe('Assembler - Deterministic Greedy Reduction', () => {
  it('assembles single valid overlap (Example A)', () => {
    const input = ['ABC', 'BCD', 'CDE']
    const { contigs } = assembleWithTrace(input, 2)
    assert.deepEqual(contigs, ['ABCDE'])
  })

  it('handles no valid overlap (Example B)', () => {
    const input = ['ABC', 'DEF']
    const { contigs } = assembleWithTrace(input, 2)
    assert.deepEqual(contigs, ['ABC', 'DEF'])
  })

  it('removes contained fragment in pre-processing (Example C)', () => {
    const input = ['ACGT', 'CGT']
    const { contigs } = assembleWithTrace(input, 2)
    assert.deepEqual(contigs, ['ACGT'])
  })

  it('eliminates dynamic containment after merge (Example D)', () => {
    const input = ['AAATTT', 'TTTGGG', 'ATT']
    const { contigs } = assembleWithTrace(input, 3)
    assert.deepEqual(contigs, ['AAATTTGGG'])
  })

  it('guarantees canonical permutation invariance (Example E)', () => {
    const r1 = assembleWithTrace(['DEF', 'ABC'], 2).contigs
    const r2 = assembleWithTrace(['ABC', 'DEF'], 2).contigs
    assert.deepEqual(r1, ['ABC', 'DEF'])
    assert.deepEqual(r1, r2)
  })

  it('deduplicates identical fragments', () => {
    const input = ['ACGT', 'ACGT']
    const { contigs } = assembleWithTrace(input, 2)
    assert.deepEqual(contigs, ['ACGT'])
  })

  it('handles singleton input', () => {
    const input = ['ACGT']
    const { contigs } = assembleWithTrace(input, 2)
    assert.deepEqual(contigs, ['ACGT'])
  })

  it('throws on invalid min overlap (< 1)', () => {
    assert.throws(() => assembleWithTrace(['ACGT'], 0), {
      message: /Invalid minimum overlap/
    })
  })

  it('throws on empty fragment', () => {
    assert.throws(() => assembleWithTrace(['ACGT', ''], 2), {
      message: /Empty fragment/
    })
  })

  it('assembles toy DNA example (ATGGC, GGCGT, CGTGCA)', () => {
    const input = ['ATGGC', 'GGCGT', 'CGTGCA']
    const { contigs } = assembleWithTrace(input, 2)
    assert.deepEqual(contigs, ['ATGGCGTGCA'])
  })
})

describe('calculateOverlap', () => {
  it('finds suffix-prefix match', () => {
    assert.equal(calculateOverlap('ATGGC', 'GGCGT', 2), 3)
  })

  it('returns 0 when overlap is below minOverlap', () => {
    assert.equal(calculateOverlap('ATGGC', 'CGTGCA', 2), 0)
  })

  it('returns 0 when fragments are identical', () => {
    assert.equal(calculateOverlap('ACGT', 'ACGT', 2), 0)
  })
})

describe('mergePair', () => {
  it('merges overlapping suffix and prefix', () => {
    assert.equal(mergePair('ATGGC', 'GGCGT', 3), 'ATGGCGT')
  })
})

describe('filterContainedFragments', () => {
  it('filters proper substrings', () => {
    const { kept, removed } = filterContainedFragments(['ACGT', 'CGT'])
    assert.deepEqual(kept, ['ACGT'])
    assert.ok(
      removed.some((r) => r.fragment === 'CGT' && r.reason === 'contained')
    )
  })
})

describe('sortCanonical', () => {
  it('orders by length descending, then alphabetical ascending', () => {
    const sorted = sortCanonical(['B', 'A', 'ZZZ', 'AAA'])
    assert.deepEqual(sorted, ['AAA', 'ZZZ', 'A', 'B'])
  })
})

describe('assemble (Pure Functional Reduction)', () => {
  it('assembles valid overlapping fragments into canonical contigs', () => {
    const input = ['ABC', 'BCD', 'CDE']
    const contigs = assemble(input, 2)
    assert.deepEqual(contigs, ['ABCDE'])
  })

  it('guarantees permutation invariance (property test)', () => {
    const permutations = [
      ['DEF', 'ABC'],
      ['ABC', 'DEF']
    ]
    const results = permutations.map((p) => assemble(p, 2))
    assert.deepEqual(results[0], ['ABC', 'DEF'])
    assert.deepEqual(results[0], results[1])
  })

  it('guarantees idempotence of assembled contigs', () => {
    const input = ['ATGGC', 'GGCGT', 'CGTGCA']
    const once = assemble(input, 2)
    const twice = assemble(once, 2)
    assert.deepEqual(once, ['ATGGCGTGCA'])
    assert.deepEqual(twice, once)
  })

  it('eliminates duplicates and proper substrings purely', () => {
    const input = ['ACGT', 'ACGT', 'CGT']
    const contigs = assemble(input, 2)
    assert.deepEqual(contigs, ['ACGT'])
  })

  it('throws on invalid overlap or empty fragments', () => {
    assert.throws(() => assemble(['ACGT'], 0), {
      message: /Invalid minimum overlap/
    })
    assert.throws(() => assemble(['ACGT', ''], 2), {
      message: /Empty fragment/
    })
  })
})

describe('traceAssembly & Session Unfold', () => {
  it('emits a typed sequence of domain reduction events', () => {
    const input = ['ABC', 'BCD']
    const events = traceAssembly(input, 2)
    assert.ok(events.length >= 3)
    assert.equal(events[0]?.kind, 'initial-filtered')
    assert.equal(events[1]?.kind, 'candidate-selected')
    assert.equal(events[2]?.kind, 'pair-merged')
    const last = events[events.length - 1]
    assert.ok(last)
    assert.equal(last.kind, 'assembly-completed')
    if ('contigs' in last) {
      assert.deepEqual(last.contigs, ['ABCD'])
    }
  })

  it('steps through reduction session iteratively until complete', () => {
    let session = startSession(['ABC', 'BCD'], 2)
    assert.equal(session.isComplete, false)

    const events: string[] = []
    while (!session.isComplete) {
      const step = stepSession(session)
      session = step.session
      events.push(step.event.kind)
    }

    assert.equal(session.isComplete, true)
    assert.ok(events.includes('assembly-completed'))
    assert.deepEqual(session.pool, ['ABCD'])
  })
})

