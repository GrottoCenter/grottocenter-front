import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';

import messages from '@/../public/lang/en.json';
import EntityTable from './EntityTable';
import entitiesConfig from './entitiesConfig';

const renderTable = modifier =>
  render(
    <MemoryRouter>
      <IntlProvider locale="en" messages={messages}>
        <EntityTable
          entityType="documents"
          entityColumnsModifier={modifier}
          isLoading={false}
          pageRows={[{ id: 1, title: 'Document' }]}
          nbTotalRows={1}
        />
      </IntlProvider>
    </MemoryRouter>
  );

beforeEach(() => localStorage.clear());

it('uses returned columns in both views without changing the shared config', () => {
  const originalColumns = entitiesConfig.documents.columns.map(column => ({
    ...column
  }));
  const modifier = columns =>
    columns.map(column =>
      column.field === 'dateInscription'
        ? { ...column, visible: true, render: () => 'Modified date' }
        : column
    );

  const { unmount } = renderTable(modifier);
  expect(screen.getByRole('columnheader', { name: 'Added at' })).toBeVisible();
  expect(screen.getByText('Modified date')).toBeVisible();

  fireEvent.click(screen.getByRole('button', { name: 'Card view' }));
  expect(screen.getByText('Modified date')).toBeVisible();
  expect(entitiesConfig.documents.columns).toEqual(originalColumns);

  unmount();
  renderTable();
  expect(
    screen.queryByRole('columnheader', { name: 'Added at' })
  ).not.toBeInTheDocument();
  expect(screen.queryByText('Modified date')).not.toBeInTheDocument();
});
