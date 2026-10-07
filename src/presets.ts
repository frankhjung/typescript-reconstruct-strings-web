import type { Preset } from './types.js'

export const PRESETS: readonly Preset[] = [
  {
    name: 'DNA Sequence (Toy Genome)',
    description: 'Classic 10 bp nucleotide strand (ATGGCGTGCA)',
    params: {
      source: 'ATGGCGTGCA',
      minOverlap: 2,
      minLength: 4,
      maxLength: 6,
      fragmentCount: 6
    },
    defaultFragments: ['ATGGC', 'GGCGT', 'CGTGCA']
  },
  {
    name: 'Alphabet Sequence (Deterministic)',
    description: '11 character alphabet progression (ABCDEFGHIJK)',
    params: {
      source: 'ABCDEFGHIJK',
      minOverlap: 2,
      minLength: 3,
      maxLength: 5,
      fragmentCount: 6
    },
    defaultFragments: ['ABCDE', 'CDEFG', 'EFGHI', 'GHIJK']
  },
  {
    name: 'English Pangram (Sentence)',
    description: 'Full sentence with repeats (THE QUICK BROWN FOX ...)',
    params: {
      source: 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG',
      minOverlap: 3,
      minLength: 8,
      maxLength: 15,
      fragmentCount: 12
    }
  },
  {
    name: 'Simple Test (Example)',
    description: 'Simple test case (ABC, BCD, CDE)',
    params: {
      source: 'ABCDE',
      minOverlap: 2,
      minLength: 3,
      maxLength: 3,
      fragmentCount: 3
    },
    defaultFragments: ['ABC', 'BCD', 'CDE']
  }
]
