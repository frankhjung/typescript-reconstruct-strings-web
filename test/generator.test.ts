import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { generateFragments, validateGeneratorParams } from '../src/generator.js'

describe('Generator - Validation and Extraction', () => {
  it('validates valid parameters without error', () => {
    assert.doesNotThrow(() => {
      validateGeneratorParams({
        source: 'ATGGCGTGCA',
        minOverlap: 2,
        minLength: 3,
        maxLength: 5,
        fragmentCount: 6
      })
    })
  })

  it('rejects empty source', () => {
    assert.throws(
      () =>
        validateGeneratorParams({
          source: '',
          minOverlap: 2,
          minLength: 3,
          maxLength: 5,
          fragmentCount: 6
        }),
      /Source string must not be empty/
    )
  })

  it('rejects n < 2', () => {
    assert.throws(
      () =>
        validateGeneratorParams({
          source: 'ATGGC',
          minOverlap: 1,
          minLength: 3,
          maxLength: 4,
          fragmentCount: 5
        }),
      /Minimum overlap \(n\) must be an integer >= 2/
    )
  })

  it('rejects b < a', () => {
    assert.throws(
      () =>
        validateGeneratorParams({
          source: 'ATGGC',
          minOverlap: 2,
          minLength: 4,
          maxLength: 3,
          fragmentCount: 5
        }),
      /Maximum fragment length \(b\) must be >= minimum length/
    )
  })

  it('generates exact m fragments within length bounds [a, b]', () => {
    const params = {
      source: 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG',
      minOverlap: 3,
      minLength: 5,
      maxLength: 10,
      fragmentCount: 20
    }
    const fragments = generateFragments(params)
    assert.equal(fragments.length, 20)
    for (const f of fragments) {
      assert.ok(f.length >= 5 && f.length <= 10)
      assert.ok(
        params.source.includes(f),
        `Fragment "${f}" must be a substring of source`
      )
    }
  })

  it('rejects source length exceeding maximum limit', () => {
    assert.throws(
      () =>
        validateGeneratorParams({
          source: 'A'.repeat(10001),
          minOverlap: 2,
          minLength: 3,
          maxLength: 5,
          fragmentCount: 6
        }),
      /exceeds maximum limit/
    )
  })

  it('rejects fragment count exceeding maximum limit', () => {
    assert.throws(
      () =>
        validateGeneratorParams({
          source: 'ATGGCGTGCA',
          minOverlap: 2,
          minLength: 3,
          maxLength: 5,
          fragmentCount: 501
        }),
      /exceeds maximum limit/
    )
  })
})
