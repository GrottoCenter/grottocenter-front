import entitiesConfig from './entitiesConfig';

it('links guideline rows to their detail page without a description column', () => {
  expect(entitiesConfig.guidelines.link({ id: 42 })).toBe('/ui/guidelines/42');
  expect(
    entitiesConfig.guidelines.columns.some(
      column => column.field === 'description'
    )
  ).toBe(false);
});

it('renders a guideline author as plain text', () => {
  const authorColumn = entitiesConfig.guidelines.columns.find(
    column => column.field === 'author'
  );

  expect(authorColumn.render({ id: 7, nickname: 'Paul' })).toBe('Paul');
});
