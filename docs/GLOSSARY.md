# Glossary

[← Back to Documentation Index](README.md)

## Assembly Error

An explicit failure condition raised when input preconditions are violated,
such as specifying a non-positive fragment length or a minimum overlap
threshold less than one.

## Candidate

An ordered pair of distinct fragments that shares a valid suffix-prefix match
exceeding or meeting the minimum overlap threshold. Not the same as an
arbitrary pair of fragments.

_Avoid_: Match

## Chimeric Join

An erroneous assembly artefact produced when fragments from distinct,
non-adjacent regions of the source sequence are improperly merged due to
repetitive sequences or coincidental overlaps.

_Avoid_: Chimera, Misassembly

## Containment

The condition where a fragment is a proper substring of another sequence,
rendering the shorter fragment redundant as it contributes no novel
information.

## Contig

A contiguous sequence produced by iteratively merging overlapping fragments,
or an isolated singleton fragment that could not be merged. Distinct from a
raw Fragment.

_Avoid_: Scaffold

## Coverage

The degree to which the target sequence is represented by the sampled
fragments, commonly expressed as nominal physical depth or effective
Lander–Waterman coverage.

## Fragment

A finite, immutable sequence of characters representing a single string
segment of sequenced genetic material, distinct from an assembled Contig.

_Avoid_: Read, K-mer

## Overlap

An exact match where a suffix of a prefix fragment is identical to a prefix
of a suffix fragment, strictly shorter than the longer fragment and meeting
the threshold.

_Avoid_: Alignment

## Overlap Length

A non-negative integer representing the number of characters shared in an
exact suffix-prefix match between two fragments. A value of zero indicates
no qualifying overlap was found.

## Reference Alignment

The character-by-character comparison of an assembled contig against the
original source sequence to identify matches, coverage gaps, and
misassembly errors. Distinct from a suffix-prefix Overlap between fragments.

_Avoid_: Overlap

## Strand

An independent random substring sampled from a contiguous block of text.
Within the context of this project, a "Strand" is synonymous with a simulated
"Fragment".

_Avoid_: Partition
