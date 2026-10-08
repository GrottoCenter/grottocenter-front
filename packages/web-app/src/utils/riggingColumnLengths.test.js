import {
  getRiggingColumnLengths,
  hasOversizedRiggingColumn
} from './riggingColumnLengths';

describe('rigging column limits', () => {
  it('counts separators between rows, including empty cells', () => {
    const lengths = getRiggingColumnLengths([
      { obstacle: 'a'.repeat(999), rope: '' },
      { obstacle: 'b'.repeat(998), rope: '' }
    ]);

    expect(lengths.obstacle).toBe(2000);
    expect(lengths.rope).toBe(3);
    expect(hasOversizedRiggingColumn(lengths)).toBe(false);
    expect(
      getRiggingColumnLengths([
        { obstacle: 'a'.repeat(999) },
        { obstacle: 'b'.repeat(997) }
      ]).obstacle
    ).toBe(1999);
    expect(
      hasOversizedRiggingColumn(
        getRiggingColumnLengths([
          { obstacle: 'a'.repeat(999) },
          { obstacle: 'b'.repeat(999) }
        ])
      )
    ).toBe(true);
  });

  it('checks every column independently and allows zero rows', () => {
    expect(getRiggingColumnLengths([])).toEqual({
      obstacle: 0,
      rope: 0,
      anchor: 0,
      observation: 0
    });
    expect(
      hasOversizedRiggingColumn(
        getRiggingColumnLengths([{ observation: 'a'.repeat(2001) }])
      )
    ).toBe(true);
  });
});
