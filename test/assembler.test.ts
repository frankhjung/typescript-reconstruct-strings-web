import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  assembleWithTrace,
  calculateOverlap,
  filterContainedFragments,
  findBestOverlap,
  mergePair,
  sortCanonical
} from '../src/assembler.js'

describe('Assembler - Parity with Haskell Implementation', () => {
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
    assert.ok(removed.includes('CGT'))
  })
})

describe('sortCanonical', () => {
  it('orders by length descending, then alphabetical ascending', () => {
    const sorted = sortCanonical(['B', 'A', 'ZZZ', 'AAA'])
    assert.deepEqual(sorted, ['AAA', 'ZZZ', 'A', 'B'])
  })
})
