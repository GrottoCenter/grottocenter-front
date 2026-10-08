import { act, fireEvent, render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import MapMarkerSelector from './MapMarkerSelector';

const { map, mapHandlers } = vi.hoisted(() => ({
  map: {
    setView: vi.fn(),
    getCenter: vi.fn(),
    getZoom: vi.fn(() => 18)
  },
  mapHandlers: {}
}));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
  Circle: ({ center, radius, pathOptions }) => (
    <div
      data-testid="accuracy-circle"
      data-center={JSON.stringify(center)}
      data-radius={radius}
      style={{ color: pathOptions.color }}
    />
  ),
  ScaleControl: () => null,
  useMap: () => map,
  useMapEvent: (type, handler) => {
    mapHandlers[type] = handler;
  }
}));

vi.mock('@/components/common/Maps/common/Markers/useMarkers', () => ({
  default: () => vi.fn()
}));
vi.mock('@/components/common/Maps/common/Markers/Components', () => ({
  EntrancePopup: () => null
}));
vi.mock('@/components/common/Maps/common/LayersControl', () => ({
  default: () => null
}));
vi.mock('@/components/common/Maps/common/LocateMeControl', () => ({
  default: () => null
}));
vi.mock('@/components/common/Maps/common/GeocodingControl', () => ({
  default: () => null
}));
vi.mock('@/components/common/Maps/common/FullscreenControl', () => ({
  default: () => null
}));
vi.mock('@/components/common/Maps/common/TileReloader', () => ({
  default: () => null
}));

const MapHarness = ({ latitude = 45, longitude = 5 }) => {
  const { control, register } = useForm({
    defaultValues: { entrance: { latitude, longitude, precision: 12 } }
  });
  return (
    <IntlProvider locale="en" messages={{ Accuracy: 'Accuracy' }}>
      <input aria-label="Accuracy" {...register('entrance.precision')} />
      <MapMarkerSelector
        control={control}
        formLatitudeKey="entrance.latitude"
        formLongitudeKey="entrance.longitude"
        formAccuracyKey="entrance.precision"
      />
    </IntlProvider>
  );
};

describe('MapMarkerSelector entrance accuracy', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    map.getCenter.mockReturnValue({ lat: 45.2, lng: 5.3 });
  });

  afterEach(() => vi.useRealTimers());

  it('previews saved and manually edited accuracy, then removes it when cleared', () => {
    render(<MapHarness />);
    expect(screen.getByTestId('accuracy-circle')).toHaveAttribute(
      'data-radius',
      '12'
    );
    expect(screen.getByTestId('entrance-precision-legend')).toHaveTextContent(
      'Accuracy'
    );
    expect(screen.getByTestId('accuracy-circle')).toHaveStyle({
      color: '#f57c00'
    });
    expect(screen.getByTestId('entrance-precision-legend')).not.toHaveStyle({
      color: '#f57c00'
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Accuracy' }), {
      target: { value: '250' }
    });
    expect(screen.getByTestId('accuracy-circle')).toHaveAttribute(
      'data-radius',
      '250'
    );
    expect(screen.getByTestId('entrance-precision-legend')).toHaveTextContent(
      'Accuracy'
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Accuracy' }), {
      target: { value: '' }
    });
    expect(screen.queryByTestId('accuracy-circle')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('entrance-precision-legend')
    ).not.toBeInTheDocument();
  });

  it('keeps the circle around the entrance when the map moves, preserving its radius', () => {
    render(<MapHarness />);
    act(() => {
      vi.advanceTimersByTime(501);
      mapHandlers.moveend();
    });
    expect(screen.getByTestId('accuracy-circle')).toHaveAttribute(
      'data-center',
      JSON.stringify({ lat: 45.2, lng: 5.3 })
    );
    expect(screen.getByTestId('accuracy-circle')).toHaveAttribute(
      'data-radius',
      '12'
    );
  });

  it('waits for valid coordinates before showing a circle or legend', () => {
    render(<MapHarness latitude="" longitude="" />);
    expect(screen.queryByTestId('accuracy-circle')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('entrance-precision-legend')
    ).not.toBeInTheDocument();
  });
});
