import entitiesConfig from './entitiesConfig';
import { renderCell, SORT_FIELD_MAP } from './tableUtils';

describe('EntityTable field mappings', () => {
  it('uses the document author sort key without changing its export field', () => {
    const authorsColumn = entitiesConfig.documents.columns.find(
      column => column.field === 'authors'
    );

    expect(authorsColumn.sortable).toBe(true);
    expect(SORT_FIELD_MAP.documents.authors).toBe('authorsSort');
    expect(authorsColumn.apiField).toBe('authors.nickname');
  });
});

describe('EntityTable numeric cells', () => {
  it.each([0, -0.123456789, 45.123456789, -120, 1800])(
    'preserves the numeric value %s without rounding',
    value => {
      expect(renderCell({ value }, 'value')).toBe(value);
    }
  );

  it.each([null, undefined, '', NaN, Infinity, -Infinity])(
    'renders a placeholder for %s',
    value => {
      expect(renderCell({ value }, 'value')).toBe('-');
    }
  );
});
