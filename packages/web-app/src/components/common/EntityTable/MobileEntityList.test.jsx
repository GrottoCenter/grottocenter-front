import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import MobileEntityList from './MobileEntityList';

const messages = { Name: 'Name' };

const columns = [
  { field: 'name', label: 'Name', visible: true, isTitle: true }
];

const defaultProps = {
  rows: [{ id: 1, name: 'Cave A' }],
  columns,
  totalRows: 1,
  isLoading: false,
  isNewQuery: false,
  rowsPerPage: 20,
  link: doc => `/caves/${doc.id}`,
  renderCellFn: (doc, field) => doc[field]
};

const renderList = props =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <MobileEntityList {...defaultProps} {...props} />
    </IntlProvider>
  );

describe('MobileEntityList - Controlled selection', () => {
  it('starts a new selection after the parent clears selected ids', () => {
    const onSelected = vi.fn();
    const { rerender } = renderList({ onSelected, selectedIds: [] });

    fireEvent.click(screen.getByRole('checkbox'));
    expect(onSelected).toHaveBeenLastCalledWith([1]);

    rerender(
      <IntlProvider locale="en" messages={messages}>
        <MobileEntityList
          {...defaultProps}
          onSelected={onSelected}
          selectedIds={[1]}
        />
      </IntlProvider>
    );

    expect(screen.getByRole('checkbox')).toBeChecked();

    rerender(
      <IntlProvider locale="en" messages={messages}>
        <MobileEntityList
          {...defaultProps}
          rows={[{ id: 2, name: 'Cave B' }]}
          onSelected={onSelected}
          selectedIds={[]}
        />
      </IntlProvider>
    );

    fireEvent.click(screen.getByRole('checkbox'));

    expect(onSelected).toHaveBeenLastCalledWith([2]);
  });

  it('requests a controlled selection reset for a new query', () => {
    const onSelected = vi.fn();

    renderList({ isNewQuery: true, onSelected, selectedIds: [1] });

    expect(onSelected).toHaveBeenCalledWith([]);
  });
});
