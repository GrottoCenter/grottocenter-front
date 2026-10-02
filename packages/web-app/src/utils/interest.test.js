import fc from 'fast-check';

import {
  getInterestLabelKeys,
  getInterestLevel,
  interestToStars,
  meetsMinimumInterest,
  starsToInterest
} from './interest';

describe('interest display', () => {
  it.each([
    [0.1, 0.5, ['No interest']],
    [2.9, 1.5, ['No interest', 'Limited interest']],
    [3, 1.5, ['No interest', 'Limited interest']],
    [4.9, 2.5, ['Limited interest', 'Interesting']],
    [5, 2.5, ['Limited interest', 'Interesting']],
    [6.9, 3.5, ['Interesting', 'Remarkable']],
    [7, 3.5, ['Interesting', 'Remarkable']],
    [8.9, 4.5, ['Remarkable', 'Exceptional']],
    [9, 4.5, ['Remarkable', 'Exceptional']],
    [12, 5, ['Exceptional']]
  ])('maps %s/10 to %s stars and its labels', (value, stars, labels) => {
    expect(getInterestLevel(value)).toBe(stars);
    expect(getInterestLabelKeys(value)).toEqual(labels);
  });

  it('treats missing and zero averages as unrated', () => {
    expect(getInterestLevel(null)).toBeNull();
    expect(getInterestLevel(0)).toBeNull();
    expect(getInterestLabelKeys(null)).toEqual([]);
    expect(meetsMinimumInterest(null, 1)).toBe(false);
    expect(meetsMinimumInterest(0, 1)).toBe(false);
  });

  it.each([1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5])(
    'changes the displayed half-star at the %s/10 boundary',
    boundary => {
      const minimum = Math.ceil(boundary);
      expect(meetsMinimumInterest(boundary - 0.01, minimum)).toBe(false);
      expect(meetsMinimumInterest(boundary, minimum)).toBe(true);
    }
  );

  it('round-trips each selectable filter star level', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10 }), halfStars => {
        expect(interestToStars(starsToInterest(halfStars / 2))).toBe(
          halfStars / 2
        );
      })
    );
  });
});

describe('meetsMinimumInterest', () => {
  it('includes every entrance when no minimum is selected', () => {
    expect(meetsMinimumInterest(null, 0)).toBe(true);
    expect(meetsMinimumInterest(0, 0)).toBe(true);
  });

  it('compares the rounded stars shown to the user', () => {
    expect(meetsMinimumInterest(4.9, 5)).toBe(true);
    expect(meetsMinimumInterest(5, 5)).toBe(true);
    expect(meetsMinimumInterest(4.9, 6)).toBe(false);
    expect(meetsMinimumInterest(null, 5)).toBe(false);
  });

  it('keeps the half-star floor for every positive rating', () => {
    expect(meetsMinimumInterest(0.1, 1)).toBe(true);
    expect(meetsMinimumInterest(0.1, 2)).toBe(false);
  });

  it('clamps an impossible stored minimum to five stars', () => {
    expect(interestToStars(12)).toBe(5);
    expect(meetsMinimumInterest(9.5, 12)).toBe(true);
    expect(meetsMinimumInterest(8.5, 12)).toBe(false);
  });

  it('never adds an entrance when the minimum rises', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 10, noNaN: true }),
        fc.integer({ min: 0, max: 10 }).map(halfStars => halfStars / 2),
        fc.integer({ min: 0, max: 10 }).map(halfStars => halfStars / 2),
        (value, first, second) => {
          const lower = Math.min(first, second);
          const higher = Math.max(first, second);
          if (meetsMinimumInterest(value, starsToInterest(higher))) {
            expect(meetsMinimumInterest(value, starsToInterest(lower))).toBe(
              true
            );
          }
        }
      )
    );
  });
});
