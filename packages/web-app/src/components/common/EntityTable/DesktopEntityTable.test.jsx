import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import DesktopEntityTable from './DesktopEntityTable';

// Mock sub-components that are not under test
vi.mock('./VisibleColumnsMenu', () => {
  const MockVisibleColumnsMenu = () => (
    <div data-testid="visible-columns-menu" />
  );
  return { default: MockVisibleColumnsMenu };
});

vi.mock('../../../hooks/useOpenLink', () => ({ default: () => vi.fn() }));

const messages = {
  Name: 'Name',
  Export: 'Export',
  'Export to CSV': 'Export to CSV',
  'Export unavailable above 10000 results':
    'Export unavailable above 10 000 results',
  results_count: '{count, plural, one {# result} other {# results}}',
  'Results per page:': 'Results per page:',
  'No results': 'No results',
  'Try adjusting your search or filters':
    'Try adjusting your search or filters',
  'Go to page': 'Go to page',
  'Card view': 'Card view',
  'Table view': 'Table view',
  Pagination: 'Pagination',
  'First page': 'First page',
  'Previous page': 'Previous page',
  'Next page': 'Next page',
  'Last page': 'Last page',
  page_position: 'Page {page} of {total}',
  rows_per_page_short: '{count} / page'
};

const baseColumns = [
  { field: 'name', label: 'Name', visible: true, sortable: true }
];

const defaultProps = {
  entityColumns: baseColumns,
  setEntityColumns: vi.fn(),
  pageRows: [{ id: 1, name: 'Cave A' }],
  nbTotalRows: 1,
  pageSizeOptions: [20, 100],
  isLoading: false,
  isNewQuery: false,
  shouldHideFooter: false,
  compact: false,
  onViewToggle: vi.fn(),
  viewMode: 'table'
};

const renderTable = (props = {}) =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <DesktopEntityTable {...defaultProps} {...props} />
    </IntlProvider>
  );

// 500 rows over the default page size of 20 -> 25 pages. Kept small enough that
// the plural message renders without locale digit grouping, so the count stays
// matchable as plain text.
const paginated = { nbTotalRows: 500, pageSizeOptions: [20, 100] };

describe('DesktopEntityTable - Pagination', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stays usable after submitting the page already displayed', () => {
    const onPageChange = vi.fn();
    renderTable({ ...paginated, onPageChange });

    const input = screen.getByLabelText('Go to page');
    fireEvent.change(input, { target: { value: '1' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Committing the current page is a no-op, but it used to latch the field
    // into a disabled state that nothing could ever clear.
    expect(input).not.toBeDisabled();
    expect(onPageChange).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '3' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onPageChange).toHaveBeenCalledWith(2, 20);
  });

  it('clamps an out-of-range page to the last one', () => {
    const onPageChange = vi.fn();
    renderTable({ ...paginated, onPageChange });

    const input = screen.getByLabelText('Go to page');
    fireEvent.change(input, { target: { value: '999' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onPageChange).toHaveBeenCalledWith(24, 20);
    expect(input).toHaveValue('25');
  });

  it('restores the current page when the input is not a number', () => {
    const onPageChange = vi.fn();
    renderTable({ ...paginated, onPageChange });

    const input = screen.getByLabelText('Go to page');
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onPageChange).not.toHaveBeenCalled();
    expect(input).toHaveValue('1');
  });

  it('keeps the results count mounted while loading', () => {
    // Unmounting it shifted the whole pagination cluster sideways mid-click.
    renderTable({ ...paginated, onPageChange: vi.fn(), isLoading: true });
    expect(screen.getByText(/500 results/)).toBeInTheDocument();
  });

  it('translates the arrow labels', () => {
    renderTable({ ...paginated, onPageChange: vi.fn() });

    ['First page', 'Previous page', 'Next page', 'Last page'].forEach(label => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    });
  });

  it('drops the navigation but keeps the page size selector on a single page', () => {
    // 50 rows at 100 per page: nothing to navigate, yet the selector is the
    // only way back down to 20 per page.
    localStorage.setItem('entityTable_rowsPerPage', '100');
    renderTable({
      nbTotalRows: 50,
      pageSizeOptions: [20, 100],
      onPageChange: vi.fn()
    });

    expect(screen.queryByLabelText('Go to page')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Next page' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('100 / page')).toBeInTheDocument();
  });
});

describe('DesktopEntityTable - Export controls', () => {
  it('renders ExportFormatDropdown for entrances when onExport is provided', () => {
    renderTable({
      entityType: 'entrances',
      onExport: vi.fn()
    });

    // The dropdown renders a button with "Export" text
    const exportButton = screen.getByRole('button', { name: /Export/i });
    expect(exportButton).toBeInTheDocument();

    // Should NOT render "Export to CSV" button
    expect(screen.queryByText('Export to CSV')).not.toBeInTheDocument();
  });

  it('renders CSV button for non-entrance entity types', () => {
    renderTable({
      entityType: 'documents',
      onExport: vi.fn()
    });

    expect(screen.getByText('Export to CSV')).toBeInTheDocument();
  });

  it('passes format in onExport callback when a format is selected', () => {
    const onExport = vi.fn();
    renderTable({
      entityType: 'entrances',
      onExport
    });

    const exportButton = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(exportButton);

    const gpxOption = screen.getByRole('menuitem', { name: 'GPX' });
    fireEvent.click(gpxOption);

    expect(onExport).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Array),
      'gpx'
    );
  });

  it('renders ExportFormatDropdown as disabled when nbTotalRows exceeds limit', () => {
    renderTable({
      entityType: 'entrances',
      onExport: vi.fn(),
      nbTotalRows: 10001
    });
    expect(screen.getByRole('button', { name: /Export/i })).toBeDisabled();
  });

  it('does not render any export control when onExport is not provided', () => {
    renderTable({
      entityType: 'entrances',
      onExport: undefined
    });

    expect(
      screen.queryByRole('button', { name: /Export/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Export to CSV')).not.toBeInTheDocument();
  });
});

describe('DesktopEntityTable - Controlled selection', () => {
  it('starts a new selection after the parent clears selected ids', () => {
    const onSelected = vi.fn();
    const { rerender } = renderTable({
      onSelected,
      selectedIds: []
    });

    let checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[checkboxes.length - 1]);
    expect(onSelected).toHaveBeenLastCalledWith([1]);

    rerender(
      <IntlProvider locale="en" messages={messages}>
        <DesktopEntityTable
          {...defaultProps}
          onSelected={onSelected}
          selectedIds={[1]}
        />
      </IntlProvider>
    );

    checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[checkboxes.length - 1]).toBeChecked();

    rerender(
      <IntlProvider locale="en" messages={messages}>
        <DesktopEntityTable
          {...defaultProps}
          pageRows={[{ id: 2, name: 'Cave B' }]}
          onSelected={onSelected}
          selectedIds={[]}
        />
      </IntlProvider>
    );

    checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[checkboxes.length - 1]);

    expect(onSelected).toHaveBeenLastCalledWith([2]);
  });

  it('requests a controlled selection reset for a new query', () => {
    const onSelected = vi.fn();

    renderTable({ isNewQuery: true, onSelected, selectedIds: [1] });

    expect(onSelected).toHaveBeenCalledWith([]);
  });
});
