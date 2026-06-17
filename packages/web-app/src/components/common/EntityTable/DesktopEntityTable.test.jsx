import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import DesktopEntityTable from './DesktopEntityTable';

// Mock sub-components that are not under test
jest.mock('./VisibleColumnsMenu', () => {
  const MockVisibleColumnsMenu = () => (
    <div data-testid="visible-columns-menu" />
  );
  return MockVisibleColumnsMenu;
});

jest.mock('../../../hooks/useOpenLink', () => () => jest.fn());

const messages = {
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
  'Table view': 'Table view'
};

const baseColumns = [
  { field: 'name', label: 'Name', visible: true, sortable: true }
];

const defaultProps = {
  entityColumns: baseColumns,
  setEntityColumns: jest.fn(),
  pageRows: [{ id: 1, name: 'Cave A' }],
  nbTotalRows: 1,
  pageSizeOptions: [20, 100],
  isLoading: false,
  isNewQuery: false,
  shouldHideFooter: false,
  compact: false,
  onViewToggle: jest.fn(),
  viewMode: 'table'
};

const renderTable = (props = {}) =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <DesktopEntityTable {...defaultProps} {...props} />
    </IntlProvider>
  );

describe('DesktopEntityTable - Export controls', () => {
  it('renders ExportFormatDropdown for entrances when onExport is provided', () => {
    renderTable({
      entityType: 'entrances',
      onExport: jest.fn()
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
      onExport: jest.fn()
    });

    expect(screen.getByText('Export to CSV')).toBeInTheDocument();
  });

  it('passes format in onExport callback when a format is selected', () => {
    const onExport = jest.fn();
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
      onExport: jest.fn(),
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
