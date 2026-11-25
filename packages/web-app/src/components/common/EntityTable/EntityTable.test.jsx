import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

it('persists column order independently of visibility and restores it on remount', () => {
  localStorage.setItem('entityTable_documents_columns', '["title","hasFiles"]');
  localStorage.setItem(
    'entityTable_documents_columnOrder',
    '["title","hasFiles"]'
  );
  const { unmount } = renderTable();
  fireEvent.click(screen.getByRole('button', { name: 'Change columns' }));
  fireEvent.click(screen.getByRole('button', { name: 'Move Title down' }));
  expect(
    screen.getByRole('button', { name: 'Move File available up' })
  ).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox', { name: 'File available' }));
  expect(
    JSON.parse(localStorage.getItem('entityTable_documents_columns'))
  ).toEqual(['title']);
  expect(
    JSON.parse(localStorage.getItem('entityTable_documents_columnOrder')).slice(
      0,
      2
    )
  ).toEqual(['hasFiles', 'title']);
  fireEvent.click(screen.getByRole('checkbox', { name: 'File available' }));
  fireEvent.keyDown(document.activeElement, { key: 'Escape' });
  unmount();
  renderTable();
  const header = screen.getAllByRole('row')[0];
  expect(
    within(header)
      .getAllByRole('columnheader')
      .map(cell => cell.textContent)
  ).toEqual(['File available', 'Title']);
});

it('moves a column with keyboard activation and retains focus on that control', async () => {
  const user = userEvent.setup();
  localStorage.setItem(
    'entityTable_documents_columnOrder',
    '["title","hasFiles"]'
  );
  renderTable();
  await user.click(screen.getByRole('button', { name: 'Change columns' }));
  const moveDown = screen.getByRole('button', { name: 'Move Title down' });
  moveDown.focus();
  await user.keyboard('{Enter}');
  expect(
    JSON.parse(localStorage.getItem('entityTable_documents_columnOrder')).slice(
      0,
      2
    )
  ).toEqual(['hasFiles', 'title']);
  expect(moveDown).toHaveFocus();
});
