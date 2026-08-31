import entitiesConfig from './entitiesConfig';
import { SORT_FIELD_MAP } from './tableUtils';

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
