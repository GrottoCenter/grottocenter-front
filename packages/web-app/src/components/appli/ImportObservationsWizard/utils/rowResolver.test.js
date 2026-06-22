import { resolveRows } from './rowResolver';

describe('resolveRows', () => {
  it('merges decimal_part column into the preceding measurement column', () => {
    const rows = [['23', '5', 'other']];
    const mappings = [
      { columnIndex: 0, role: 'measurement' },
      { columnIndex: 1, role: 'decimal_part' },
      { columnIndex: 2, role: 'measurement' }
    ];
    const result = resolveRows(rows, mappings);
    expect(result[0][0]).toBe('23.5');
    expect(result[0][1]).toBeNull();
    expect(result[0][2]).toBe('other');
  });

  it('processes multiple decimal_part columns right-to-left', () => {
    // Columns: [measurement, decimal_part, measurement, decimal_part]
    // Right-to-left: index 3 first, then index 1
    const rows = [['12', '3', '45', '6']];
    const mappings = [
      { columnIndex: 0, role: 'measurement' },
      { columnIndex: 1, role: 'decimal_part' },
      { columnIndex: 2, role: 'measurement' },
      { columnIndex: 3, role: 'decimal_part' }
    ];
    const result = resolveRows(rows, mappings);
    expect(result[0][0]).toBe('12.3');
    expect(result[0][1]).toBeNull();
    expect(result[0][2]).toBe('45.6');
    expect(result[0][3]).toBeNull();
  });

  it('returns rows unchanged when no decimal_part columns exist', () => {
    const rows = [
      ['1', '2', '3'],
      ['4', '5', '6']
    ];
    const mappings = [
      { columnIndex: 0, role: 'measurement' },
      { columnIndex: 1, role: 'timestamp' },
      { columnIndex: 2, role: 'excluded' }
    ];
    const result = resolveRows(rows, mappings);
    expect(result).toEqual(rows);
  });

  it('does not mutate the input rows array', () => {
    const rows = [['10', '5']];
    const original = [['10', '5']];
    const mappings = [
      { columnIndex: 0, role: 'measurement' },
      { columnIndex: 1, role: 'decimal_part' }
    ];
    resolveRows(rows, mappings);
    expect(rows).toEqual(original);
  });

  it('applies merging to all rows', () => {
    const rows = [
      ['1', '2'],
      ['3', '4'],
      ['5', '6']
    ];
    const mappings = [
      { columnIndex: 0, role: 'measurement' },
      { columnIndex: 1, role: 'decimal_part' }
    ];
    const result = resolveRows(rows, mappings);
    expect(result[0]).toEqual(['1.2', null]);
    expect(result[1]).toEqual(['3.4', null]);
    expect(result[2]).toEqual(['5.6', null]);
  });

  it('returns an empty array when rows is empty', () => {
    const result = resolveRows([], [{ columnIndex: 1, role: 'decimal_part' }]);
    expect(result).toEqual([]);
  });

  it('returns rows unchanged when mappings is empty', () => {
    const rows = [['1', '2']];
    const result = resolveRows(rows, []);
    expect(result).toEqual(rows);
  });
});
