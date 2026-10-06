import { Preset } from './types.js';

export const PRESETS: readonly Preset[] = [
  {
    name: 'DNA Sequence (Toy Genome)',
    description: 'Classic 10 bp nucleotide strand (ATGGCGTGCA)',
    params: {
      source: 'ATGGCGTGCA',
      n: 2,
      a: 4,
      b: 6,
      m: 6
    },
    defaultFragments: ['ATGGC', 'GGCGT', 'CGTGCA']
  },
  {
    name: 'Alphabet Sequence (Deterministic)',
    description: '11 character alphabet progression (ABCDEFGHIJK)',
    params: {
      source: 'ABCDEFGHIJK',
      n: 2,
      a: 3,
      b: 5,
      m: 6
    },
    defaultFragments: ['ABCDE', 'CDEFG', 'EFGHI', 'GHIJK']
  },
  {
    name: 'English Pangram (Sentence)',
    description: 'Full sentence with repeats (THE QUICK BROWN FOX ...)',
    params: {
      source: 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG',
      n: 3,
      a: 8,
      b: 15,
      m: 12
    }
  },
  {
    name: 'REQ-001 Reference (Example A)',
    description: 'Exact test case from specification (ABC, BCD, CDE)',
    params: {
      source: 'ABCDE',
      n: 2,
      a: 3,
      b: 3,
      m: 3
    },
    defaultFragments: ['ABC', 'BCD', 'CDE']
  }
];
