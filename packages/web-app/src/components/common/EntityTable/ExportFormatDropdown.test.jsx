import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import fc from 'fast-check';

import ExportFormatDropdown from './ExportFormatDropdown';

const messages = {
  Export: 'Export',
  'Export unavailable above 10000 results':
    'Export unavailable above 10 000 results'
};

const renderDropdown = (props = {}) =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <ExportFormatDropdown
        disabled={false}
        onExport={vi.fn()}
        {...props}
      />
    </IntlProvider>
  );

describe('ExportFormatDropdown', () => {
  it('renders 4 menu items when opened', () => {
    renderDropdown();
    const button = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(button);

    const options = screen.getAllByRole('menuitem');
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent('CSV');
    expect(options[1]).toHaveTextContent('GeoJSON');
    expect(options[2]).toHaveTextContent('GPX');
    expect(options[3]).toHaveTextContent('KML');
  });

  it('calls onExport with the selected format value', () => {
    const onExport = vi.fn();
    renderDropdown({ onExport });

    const button = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(button);

    const geojsonOption = screen.getByRole('menuitem', { name: 'GeoJSON' });
    fireEvent.click(geojsonOption);

    expect(onExport).toHaveBeenCalledWith('geojson');
  });

  it('renders tooltip when disabled', () => {
    renderDropdown({ disabled: true });
    const tooltip = screen.getByLabelText(
      'Export unavailable above 10 000 results'
    );
    expect(tooltip).toBeInTheDocument();
  });

  it('menu closes after selection', () => {
    const onExport = vi.fn();
    renderDropdown({ onExport });

    const button = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(button);

    const csvOption = screen.getByRole('menuitem', { name: 'CSV' });
    fireEvent.click(csvOption);

    // Menu should be closed — no menu items visible
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });

  /**
   * Property: For any of the 4 supported formats, selecting it always calls
   * onExport with exactly that format string.
   * Encodes: onExport is called with the exact format value, no transformation.
   */
  it('should call onExport with the exact format value for any format', () => {
    const formatArb = fc.constantFrom('csv', 'geojson', 'gpx', 'kml');
    const labelMap = {
      csv: 'CSV',
      geojson: 'GeoJSON',
      gpx: 'GPX',
      kml: 'KML'
    };

    fc.assert(
      fc.property(formatArb, format => {
        const onExport = vi.fn();
        const { unmount } = renderDropdown({ onExport });

        const button = screen.getByRole('button', { name: /Export/i });
        fireEvent.click(button);

        const option = screen.getByRole('menuitem', {
          name: labelMap[format]
        });
        fireEvent.click(option);

        expect(onExport).toHaveBeenCalledTimes(1);
        expect(onExport).toHaveBeenCalledWith(format);
        unmount();
      }),
      { numRuns: 20 }
    );
  });
});
