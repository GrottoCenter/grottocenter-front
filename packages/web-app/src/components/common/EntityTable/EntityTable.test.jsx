import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';

import messages from '@/../public/lang/en.json';
import EntityTable from './EntityTable';
import entitiesConfig from './entitiesConfig';

const renderTable = (modifier, { onPageChange, nbTotalRows = 1 } = {}) =>
  render(
    <MemoryRouter>
      <IntlProvider locale="en" messages={messages}>
        <EntityTable
          entityType="documents"
          entityColumnsModifier={modifier}
          isLoading={false}
          pageRows={[{ id: 1, title: 'Document' }]}
          nbTotalRows={nbTotalRows}
          onPageChange={onPageChange}
        />
      </IntlProvider>
    </MemoryRouter>
  );

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

it.each(['getItem', 'storage access', 'full storage'])(
  'uses default columns and keeps controls working when %s is blocked',
  blocked => {
    const fail = () => {
      throw new DOMException('Storage is blocked', 'SecurityError');
    };
    if (blocked === 'getItem') {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(fail);
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(fail);
    } else if (blocked === 'storage access') {
      vi.spyOn(window, 'localStorage', 'get').mockImplementation(fail);
    } else {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('Storage is full', 'QuotaExceededError');
      });
    }

    const onPageChange = vi.fn();
    renderTable(undefined, { onPageChange, nbTotalRows: 1000 });
    expect(screen.getByRole('columnheader', { name: 'Title' })).toBeVisible();
    expect(
      screen.getByRole('columnheader', { name: 'File available' })
    ).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(1, 20);
    const pageSize = screen.getByRole('combobox', {
      name: 'Results per page:'
    });
    fireEvent.mouseDown(pageSize);
    fireEvent.click(screen.getByRole('option', { name: '100' }));
    expect(pageSize).toHaveTextContent('100');
    expect(screen.getByRole('textbox', { name: 'Go to page' })).toHaveValue(
      '1'
    );
    expect(onPageChange).toHaveBeenLastCalledWith(0, 100);
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(1, 100);

    fireEvent.click(screen.getByRole('button', { name: 'Change columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move Id down' }));
    expect(
      screen.getByRole('button', { name: 'Move Creator up' })
    ).toBeDisabled();
    const fileVisibility = screen.getByRole('checkbox', {
      name: 'File available'
    });
    fireEvent.click(fileVisibility);
    expect(fileVisibility).not.toBeChecked();
  }
);

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

it.each([
  ['File available', 'up', 'down', '{Enter}'],
  ['Title', 'down', 'up', ' ']
])(
  'focuses the reverse action after moving %s to the %s boundary',
  async (label, direction, reverseDirection, key) => {
    const user = userEvent.setup();
    renderTable(columns =>
      columns.filter(column => ['title', 'hasFiles'].includes(column.field))
    );
    await user.click(screen.getByRole('button', { name: 'Change columns' }));
    const move = screen.getByRole('button', {
      name: `Move ${label} ${direction}`
    });
    const reverse = screen.getByRole('button', {
      name: `Move ${label} ${reverseDirection}`
    });
    expect(reverse).toBeDisabled();
    move.focus();
    await user.keyboard(key);
    expect(move).toBeDisabled();
    expect(reverse).toHaveFocus();
    expect(
      JSON.parse(localStorage.getItem('entityTable_documents_columnOrder'))
    ).toEqual(['hasFiles', 'title']);

    await user.keyboard(key);
    expect(reverse).toBeDisabled();
    expect(move).toHaveFocus();
    expect(
      JSON.parse(localStorage.getItem('entityTable_documents_columnOrder'))
    ).toEqual(['title', 'hasFiles']);
  }
);
