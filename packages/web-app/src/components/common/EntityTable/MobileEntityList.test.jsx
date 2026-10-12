import { act, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import MobileEntityList from './MobileEntityList';

const messages = { Name: 'Name', Preview: 'Preview', 'Load more': 'Load more' };

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
  it('retains selected cards while loading and appending the next page', () => {
    const onSelected = vi.fn();
    const onPageChange = vi.fn();
    const props = {
      ...defaultProps,
      totalRows: 2,
      onSelected,
      onPageChange,
      selectedIds: [1]
    };
    const { rerender } = renderList(props);

    fireEvent.click(screen.getByRole('button', { name: /Load more/ }));
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith(1, 20);

    rerender(
      <IntlProvider locale="en" messages={messages}>
        <MobileEntityList {...props} rows={[]} isLoading />
      </IntlProvider>
    );
    expect(screen.getByRole('checkbox')).toBeChecked();

    rerender(
      <IntlProvider locale="en" messages={messages}>
        <MobileEntityList {...props} rows={[{ id: 2, name: 'Cave B' }]} />
      </IntlProvider>
    );
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).toBeChecked();
    fireEvent.click(checkboxes[1]);
    expect(onSelected).toHaveBeenCalledExactlyOnceWith([1, 2]);
  });

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

describe('MobileEntityList preview gestures', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    act(() => vi.runOnlyPendingTimers());
    vi.useRealTimers();
  });

  const touch = { touches: [{ clientX: 10, clientY: 10 }] };

  it('keeps a checkbox long press separate from previewing', () => {
    const onSelected = vi.fn();
    const onRowClick = vi.fn();
    renderList({ onSelected, onRowClick, selectedIds: [] });
    const checkbox = screen.getByRole('checkbox');

    fireEvent.touchStart(checkbox, touch);
    act(() => vi.advanceTimersByTime(600));
    fireEvent.touchEnd(checkbox);
    fireEvent.click(checkbox);

    expect(onRowClick).not.toHaveBeenCalled();
    expect(onSelected).toHaveBeenCalledExactlyOnceWith([1]);
  });

  it('suppresses selection on the click following a card long press', () => {
    const onSelected = vi.fn();
    const onRowClick = vi.fn();
    renderList({ onSelected, onRowClick, selectedIds: [] });
    const card = screen.getByText('Cave A');

    fireEvent.touchStart(card, touch);
    act(() => vi.advanceTimersByTime(600));
    fireEvent.touchEnd(card);
    fireEvent.click(card);

    expect(onRowClick).toHaveBeenCalledExactlyOnceWith(defaultProps.rows[0]);
    expect(onSelected).not.toHaveBeenCalled();
  });

  it.each(['keyboard', 'mouse'])(
    'allows the first %s activation when a preview intercepts the touch click',
    input => {
      const onSelected = vi.fn();
      const onRowClick = vi.fn();
      renderList({ onSelected, onRowClick, selectedIds: [] });
      const card = screen.getByText('Cave A').closest('button');

      fireEvent.touchStart(card, touch);
      act(() => vi.advanceTimersByTime(600));
      fireEvent.touchEnd(card);
      // No click reaches the card: the newly opened dialog intercepted it.
      if (input === 'keyboard') {
        fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
        // Native buttons synthesize a click on Enter in the browser.
        fireEvent.click(card);
      } else {
        fireEvent.pointerDown(card, { pointerType: 'mouse' });
        fireEvent.click(card);
      }

      expect(onSelected).toHaveBeenCalledExactlyOnceWith([1]);
    }
  );
});
