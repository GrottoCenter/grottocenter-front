import entitiesConfig from './entitiesConfig';
import {
  applyColumnOrder,
  applyColumnVisibility,
  renderCell,
  SORT_FIELD_MAP
} from './tableUtils';

describe('EntityTable field mappings', () => {
  it.each([
    ['authors', 'authorsSort', 'authors.nickname'],
    ['entrances', 'entrancesSort', 'entrances'],
    ['hasFiles', 'hasFiles', 'hasFiles']
  ])(
    'uses the document %s sort key without changing its export field',
    (field, sortField, exportField) => {
      const column = entitiesConfig.documents.columns.find(
        item => item.field === field
      );

      expect(column.sortable).toBe(true);
      expect(SORT_FIELD_MAP.documents[field]).toBe(sortField);
      expect(column.apiField ?? column.field).toBe(exportField);
    }
  );
});

describe('column preferences', () => {
  const columns = [
    { field: 'title', visible: true },
    { field: 'authors', visible: true },
    { field: 'hasFiles', visible: true }
  ];

  it('restores order, ignores obsolete/duplicate fields and keeps new columns', () => {
    const ordered = applyColumnOrder(
      columns,
      JSON.stringify(['authors', 'removed', 'authors', 'title'])
    );
    expect(ordered.map(column => column.field)).toEqual([
      'authors',
      'title',
      'hasFiles'
    ]);
    expect(columns.map(column => column.field)).toEqual([
      'title',
      'authors',
      'hasFiles'
    ]);
    expect(applyColumnVisibility(ordered, '["title"]')).toEqual([
      { field: 'authors', visible: false },
      { field: 'title', visible: true },
      { field: 'hasFiles', visible: false }
    ]);
  });

  it.each([null, 'invalid', '{}', 'null', '42'])(
    'ignores malformed stored preferences %s',
    stored => {
      expect(applyColumnOrder(columns, stored)).toEqual(columns);
      expect(applyColumnVisibility(columns, stored)).toEqual(columns);
    }
  );
});

describe('EntityTable numeric cells', () => {
  it.each([
    ['entrances', 'cave.depth'],
    ['entrances', 'cave.length'],
    ['entrances', 'cave.temperature'],
    ['massifs', 'nbEntrances']
  ])('preserves zero in the existing %s column %s', (type, field) => {
    const column = entitiesConfig[type].columns.find(
      item => item.field === field
    );
    const entity = {
      cave: { depth: 0, length: 0, temperature: 0 },
      nbEntrances: 0
    };

    expect(renderCell(entity, field, column.render)).toBe(0);
  });

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
