import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateFragments,
  validateGeneratorParams
} from '../src/generator.js';

describe('Generator - Validation and Extraction', () => {
  it('validates valid parameters without error', () => {
    assert.doesNotThrow(() => {
      validateGeneratorParams({
        source: 'ATGGCGTGCA',
        n: 2,
        a: 3,
        b: 5,
        m: 6
      });
    });
  });

  it('rejects empty source', () => {
    assert.throws(
      () =>
        validateGeneratorParams({
          source: '',
          n: 2,
          a: 3,
          b: 5,
          m: 6
        }),
      /Source string must not be empty/
    );
  });

  it('rejects n < 2', () => {
    assert.throws(
      () =>
        validateGeneratorParams({
          source: 'ATGGC',
          n: 1,
          a: 3,
          b: 4,
          m: 5
        }),
      /Minimum overlap \(n\) must be an integer >= 2/
    );
  });

  it('rejects b < a', () => {
    assert.throws(
      () =>
        validateGeneratorParams({
          source: 'ATGGC',
          n: 2,
          a: 4,
          b: 3,
          m: 5
        }),
      /Maximum fragment length \(b\) must be >= minimum length/
    );
  });

  it('generates exact m fragments within length bounds [a, b]', () => {
    const params = {
      source: 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG',
      n: 3,
      a: 5,
      b: 10,
      m: 20
    };
    const fragments = generateFragments(params);
    assert.equal(fragments.length, 20);
    for (const f of fragments) {
      assert.ok(f.length >= 5 && f.length <= 10);
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
          n: 2,
          a: 3,
          b: 5,
          m: 6
        }),
      /exceeds maximum limit/
    )
  })

  it('rejects fragment count exceeding maximum limit', () => {
    assert.throws(
      () =>
        validateGeneratorParams({
          source: 'ATGGCGTGCA',
          n: 2,
          a: 3,
          b: 5,
          m: 501
        }),
      /exceeds maximum limit/
    )
  })
})
