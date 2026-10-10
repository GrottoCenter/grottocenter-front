import fc from 'fast-check';

import {
  CAVE_SIZE,
  CAVE_QUALITY,
  DEFAULT_ENTRANCE_FILTERS,
  DEFAULT_QUALITY_FILTERS,
  getCaveSize,
  hasEntranceCoordinateCriteria,
  matchesEntranceCoordinate,
  matchesEntranceMarker
} from './entranceMapFilters';

const defaultFilters = {
  sizes: DEFAULT_ENTRANCE_FILTERS,
  qualities: DEFAULT_QUALITY_FILTERS,
  minInterest: 0
};

describe('entrance map filters', () => {
  it.each([
    [29, 199, CAVE_SIZE.SMALL],
    [30, 0, CAVE_SIZE.MEDIUM],
    [0, 200, CAVE_SIZE.MEDIUM],
    [99, 999, CAVE_SIZE.MEDIUM],
    [100, 0, CAVE_SIZE.LARGE],
    [0, 1000, CAVE_SIZE.LARGE],
    [null, null, CAVE_SIZE.SMALL]
  ])('classifies depth %s and length %s as %s', (depth, length, size) => {
    expect(getCaveSize({ depth, length })).toBe(size);
  });

  it('combines all criteria and compares the displayed half stars', () => {
    const filters = {
      sizes: { small: false, medium: false, large: true },
      qualities: { insufficient: false, satisfactory: false, good: true },
      minInterest: 8
    };
    expect(matchesEntranceCoordinate([0, 0, 3, 70, 7.5], filters)).toBe(true);
    expect(matchesEntranceCoordinate([0, 0, 2, 70, 7.5], filters)).toBe(false);
    expect(matchesEntranceCoordinate([0, 0, 3, 69, 7.5], filters)).toBe(false);
    expect(matchesEntranceCoordinate([0, 0, 3, 70, 7.4], filters)).toBe(false);
    expect(matchesEntranceCoordinate([0, 0, 3, 70, null], filters)).toBe(false);
  });

  it.each([
    [0, CAVE_QUALITY.INSUFFICIENT],
    [39, CAVE_QUALITY.INSUFFICIENT],
    [40, CAVE_QUALITY.SATISFACTORY],
    [69, CAVE_QUALITY.SATISFACTORY],
    [70, CAVE_QUALITY.GOOD],
    [100, CAVE_QUALITY.GOOD]
  ])('filters quality %s as %s, including zero', (quality, category) => {
    const filters = {
      ...defaultFilters,
      qualities: { insufficient: false, satisfactory: false, good: false }
    };
    expect(matchesEntranceCoordinate([0, 0, 1, quality, null], filters)).toBe(
      false
    );
    filters.qualities[category] = true;
    expect(matchesEntranceCoordinate([0, 0, 1, quality, null], filters)).toBe(
      true
    );
  });

  it('preserves missing quality for detailed markers', () => {
    const filters = {
      ...defaultFilters,
      qualities: { insufficient: false, satisfactory: false, good: false }
    };
    expect(matchesEntranceMarker({ dataQuality: null }, filters)).toBe(true);
  });

  it('distinguishes legacy pairs from enriched criteria before filtering', () => {
    expect(hasEntranceCoordinateCriteria([0, 0])).toBe(false);
    expect(hasEntranceCoordinateCriteria([0, 0, 1, 0, null])).toBe(true);
    expect(hasEntranceCoordinateCriteria([0, 0, 4, 0, null])).toBe(true);
    expect(hasEntranceCoordinateCriteria([0, 0, 1, null, null])).toBe(true);
  });

  it('preserves missing quality for tuples just like detailed markers', () => {
    const filters = {
      ...defaultFilters,
      qualities: { insufficient: false, satisfactory: false, good: false }
    };
    expect(matchesEntranceCoordinate([0, 0, 1, null, null], filters)).toBe(
      true
    );
    expect(
      matchesEntranceCoordinate([0, 0, 1, null, null], {
        ...filters,
        minInterest: 8
      })
    ).toBe(false);
  });

  it.each([
    [0, 0],
    [0, 0, 4, 0, null],
    [0, 0, 1, 'unknown', null],
    [0, 0, 1, 0, 'unknown']
  ])(
    'keeps an entrance with incomplete or malformed criteria visible: %j',
    (...tuple) => {
      expect(
        matchesEntranceCoordinate(tuple, {
          sizes: { small: false, medium: false, large: false },
          qualities: { insufficient: false, satisfactory: false, good: false },
          minInterest: 10
        })
      ).toBe(true);
    }
  );

  it('gives tuples and corresponding markers the same result', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 0, max: 100 }),
        fc.option(
          fc.integer({ min: 1, max: 100 }).map(n => n / 10),
          { nil: null }
        ),
        fc.record({
          small: fc.boolean(),
          medium: fc.boolean(),
          large: fc.boolean()
        }),
        fc.record({
          insufficient: fc.boolean(),
          satisfactory: fc.boolean(),
          good: fc.boolean()
        }),
        fc.integer({ min: 0, max: 10 }),
        (size, quality, interest, sizes, qualities, minInterest) => {
          const filters = { sizes, qualities, minInterest };
          const marker = {
            depth: [0, 30, 100][size - 1],
            length: 0,
            dataQuality: quality,
            aestheticism: interest
          };
          expect(
            matchesEntranceCoordinate([0, 0, size, quality, interest], filters)
          ).toBe(matchesEntranceMarker(marker, filters));
        }
      )
    );
  });
});
