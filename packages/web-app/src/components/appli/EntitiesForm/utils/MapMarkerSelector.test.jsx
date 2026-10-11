import { act, fireEvent, render, screen } from '@testing-library/react';
import { useController, useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import messages from '@/../public/lang/en.json';
import MapMarkerSelector from './MapMarkerSelector';

const { map, mapHandlers, browser } = vi.hoisted(() => ({
  map: {
    setView: vi.fn(),
    getCenter: vi.fn(),
    getSize: vi.fn(() => ({ x: 400, y: 300 })),
    getZoom: vi.fn(() => 18)
  },
  mapHandlers: {},
  browser: { isMobile: false, isAndroid: false, isFirefox: false }
}));

vi.mock('react-device-detect', () => browser);

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, className }) => (
    <div className={className} data-testid="selector-map">
      {children}
    </div>
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
  useMapEvents: handlers => {
    Object.assign(mapHandlers, handlers);
    return map;
  },
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
  LOCATE_ERRORS: { 1: 'location.error.denied' },
  default: ({ onClick, loading, error, retry }) => {
    let label = 'Use my location';
    if (loading) label = 'Stop searching';
    else if (retry) label = 'Try again';
    return (
      <button
        type="button"
        data-testid="locate-me"
        data-error={error}
        aria-label={label}
        onClick={onClick}>
        Locate
      </button>
    );
  }
}));
vi.mock('@/components/common/Maps/common/GeocodingControl', () => ({
  default: ({ onLocationSelect }) => (
    <button type="button" onClick={() => onLocationSelect({ lat: 46, lng: 6 })}>
      Select place
    </button>
  )
}));
vi.mock('@/components/common/Maps/common/FullscreenControl', () => ({
  default: () => null
}));
vi.mock('@/components/common/Maps/common/TileReloader', () => ({
  default: () => null
}));

const MapHarness = ({
  latitude = 45,
  longitude = 5,
  hasAccuracyField = true
}) => {
  const { control, register, setValue, watch } = useForm({
    defaultValues: { entrance: { latitude, longitude, precision: 12 } }
  });
  // The entrance form subscribes at the parent as well as in the map.
  watch(['entrance.latitude', 'entrance.longitude']);
  const { field: latitudeField } = useController({
    control,
    name: 'entrance.latitude'
  });
  const { field: longitudeField } = useController({
    control,
    name: 'entrance.longitude'
  });
  return (
    <IntlProvider locale="en" messages={messages}>
      <input aria-label="Accuracy" {...register('entrance.precision')} />
      <input
        aria-label="Latitude"
        value={latitudeField.value}
        onChange={latitudeField.onChange}
      />
      <input
        aria-label="Longitude"
        value={longitudeField.value}
        onChange={longitudeField.onChange}
      />
      <MapMarkerSelector
        control={control}
        formLatitudeKey="entrance.latitude"
        formLongitudeKey="entrance.longitude"
        onLatitudeChange={latitudeField.onChange}
        onLongitudeChange={longitudeField.onChange}
        formAccuracyKey={hasAccuracyField ? 'entrance.precision' : undefined}
        onLocationAccuracyChange={
          hasAccuracyField
            ? accuracy =>
                setValue('entrance.precision', accuracy, {
                  shouldDirty: true,
                  shouldValidate: true
                })
            : undefined
        }
      />
    </IntlProvider>
  );
};

describe('MapMarkerSelector entrance accuracy', () => {
  let geolocation;

  beforeEach(() => {
    vi.useFakeTimers();
    browser.isAndroid = false;
    browser.isFirefox = false;
    geolocation = {
      watchPosition: vi.fn().mockReturnValue(42),
      clearWatch: vi.fn()
    };
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: geolocation
    });
    map.getCenter.mockReturnValue({ lat: 45.2, lng: 5.3 });
    map.getSize.mockReturnValue({ x: 400, y: 300 });
  });

  afterEach(() => vi.useRealTimers());

  it.each([
    [true, true, 100, true],
    [true, false, 100, false],
    [false, true, 100, false],
    [true, true, 99.9, false],
    [true, true, 100.1, false]
  ])(
    'reports limited accuracy for Android=%s, Firefox=%s and accuracy=%s',
    (isAndroid, isFirefox, accuracy, shouldWarn) => {
      browser.isAndroid = isAndroid;
      browser.isFirefox = isFirefox;
      render(<MapHarness />);
      fireEvent.click(screen.getByTestId('locate-me'));
      const [onFix] = geolocation.watchPosition.mock.calls[0];
      act(() =>
        onFix({ coords: { latitude: 45.1, longitude: 5.1, accuracy } })
      );
      const message = 'Approximate position — limited accuracy on Firefox.';
      if (shouldWarn) {
        expect(screen.getByRole('status')).toHaveTextContent(message);
      } else {
        expect(screen.getByRole('status')).not.toHaveTextContent(message);
      }
      expect(screen.getByTestId('locate-me')).toHaveAccessibleName(
        'Stop searching'
      );
      expect(geolocation.clearWatch).not.toHaveBeenCalled();
    }
  );

  it('restores normal status as Firefox Android receives a better fix', () => {
    browser.isAndroid = true;
    browser.isFirefox = true;
    render(<MapHarness />);
    fireEvent.click(screen.getByTestId('locate-me'));
    const [onFix] = geolocation.watchPosition.mock.calls[0];
    act(() =>
      onFix({ coords: { latitude: 45.1, longitude: 5.1, accuracy: 100 } })
    );
    act(() => mapHandlers.enterFullscreen());
    expect(screen.getByTestId('entrance-precision-legend')).toHaveTextContent(
      'Approximate position — limited accuracy on Firefox.'
    );
    act(() =>
      onFix({ coords: { latitude: 45.2, longitude: 5.2, accuracy: 6.4 } })
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Estimated accuracy: ±7 m — improving'
    );
    expect(geolocation.clearWatch).not.toHaveBeenCalled();
  });

  it('does not attribute manually declared accuracy to Firefox', () => {
    browser.isAndroid = true;
    browser.isFirefox = true;
    render(<MapHarness />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Accuracy' }), {
      target: { value: '100' }
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

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

  it('clears saved accuracy when the entrance is moved', () => {
    render(<MapHarness />);
    act(() => {
      vi.advanceTimersByTime(501);
      mapHandlers.moveend();
    });
    expect(screen.queryByTestId('accuracy-circle')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Accuracy' })).toHaveValue('');
    expect(screen.getByTestId('location-status')).toHaveTextContent(
      'Position changed. Enter its estimated accuracy if known.'
    );
  });

  it('preserves saved coordinates and accuracy across fullscreen resizes', () => {
    render(<MapHarness />);
    act(() => {
      vi.advanceTimersByTime(1000);
      map.getSize.mockReturnValue({ x: 1000, y: 800 });
      // Leaflet fires moveend before resize and enterFullscreen.
      mapHandlers.moveend();
      mapHandlers.resize();
      mapHandlers.enterFullscreen();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
      map.getSize.mockReturnValue({ x: 400, y: 300 });
      mapHandlers.moveend();
      mapHandlers.resize();
      mapHandlers.exitFullscreen();
    });
    expect(screen.getByRole('textbox', { name: 'Latitude' })).toHaveValue('45');
    expect(screen.getByRole('textbox', { name: 'Accuracy' })).toHaveValue('12');
    expect(screen.queryByTestId('location-status')).not.toBeInTheDocument();
  });

  it('keeps GPS active and its status visible through fullscreen transitions', () => {
    render(<MapHarness />);
    fireEvent.click(screen.getByTestId('locate-me'));
    const [onFix] = geolocation.watchPosition.mock.calls[0];
    act(() =>
      onFix({ coords: { latitude: 45.1, longitude: 5.1, accuracy: 100 } })
    );
    act(() => {
      vi.advanceTimersByTime(1000);
      map.getSize.mockReturnValue({ x: 1000, y: 800 });
      mapHandlers.moveend();
      mapHandlers.resize();
      mapHandlers.enterFullscreen();
    });
    expect(screen.getByTestId('selector-map')).toContainElement(
      screen.getByTestId('location-status')
    );
    expect(screen.getByTestId('entrance-precision-legend').textContent).toBe(
      screen.getByTestId('location-status').textContent
    );
    expect(
      screen.getAllByRole('button', { name: 'Stop searching' })
    ).toHaveLength(1);
    expect(geolocation.clearWatch).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1000);
      map.getSize.mockReturnValue({ x: 400, y: 300 });
      mapHandlers.moveend();
      mapHandlers.resize();
      mapHandlers.exitFullscreen();
    });
    expect(screen.getByTestId('selector-map')).not.toContainElement(
      screen.getByTestId('location-status')
    );
    expect(screen.getByTestId('entrance-precision-legend')).toHaveTextContent(
      /^Accuracy$/
    );
    expect(geolocation.clearWatch).not.toHaveBeenCalled();
    act(() =>
      onFix({ coords: { latitude: 45.2, longitude: 5.2, accuracy: 7 } })
    );
    expect(screen.getByRole('textbox', { name: 'Accuracy' })).toHaveValue('7');
  });

  it('waits for valid coordinates before showing a circle or legend', () => {
    render(<MapHarness latitude="" longitude="" />);
    expect(screen.queryByTestId('accuracy-circle')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('entrance-precision-legend')
    ).not.toBeInTheDocument();
  });

  it('updates the entrance coordinates and circle as GPS accuracy improves', () => {
    render(<MapHarness />);
    const button = screen.getByTestId('locate-me');
    fireEvent.click(button);
    const [onFix] = geolocation.watchPosition.mock.calls[0];
    act(() =>
      onFix({ coords: { latitude: 45.1, longitude: 5.1, accuracy: 100 } })
    );
    expect(button).toHaveAccessibleName('Stop searching');
    expect(screen.getByTestId('accuracy-circle')).toHaveAttribute(
      'data-radius',
      '100'
    );
    act(() =>
      onFix({ coords: { latitude: 45.2, longitude: 5.2, accuracy: 6.4 } })
    );
    expect(button).not.toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Latitude' })).toHaveValue(
      '45.200000'
    );
    expect(screen.getByRole('textbox', { name: 'Longitude' })).toHaveValue(
      '5.200000'
    );
    expect(screen.getByRole('textbox', { name: 'Accuracy' })).toHaveValue('7');
    expect(screen.getByTestId('accuracy-circle')).toHaveAttribute(
      'data-center',
      JSON.stringify({ lat: 45.2, lng: 5.2 })
    );
    expect(screen.getByTestId('accuracy-circle')).toHaveAttribute(
      'data-radius',
      '7'
    );
    expect(button).toHaveAccessibleName('Stop searching');
    expect(geolocation.clearWatch).not.toHaveBeenCalled();
    act(() =>
      onFix({ coords: { latitude: 45.2, longitude: 5.2, accuracy: 3 } })
    );
    expect(screen.getByRole('textbox', { name: 'Accuracy' })).toHaveValue('3');
    expect(screen.getByTestId('accuracy-circle')).toHaveAttribute(
      'data-radius',
      '3'
    );
    expect(geolocation.clearWatch).toHaveBeenCalledWith(42);
  });

  it.each(['Latitude', 'Longitude', 'Accuracy'])(
    'stops acquiring when %s is manually edited',
    field => {
      render(<MapHarness />);
      fireEvent.click(screen.getByTestId('locate-me'));
      const [onFix] = geolocation.watchPosition.mock.calls[0];
      act(() =>
        onFix({ coords: { latitude: 45.1, longitude: 5.1, accuracy: 100 } })
      );
      fireEvent.change(screen.getByRole('textbox', { name: field }), {
        target: { value: '25' }
      });
      act(() =>
        onFix({ coords: { latitude: 45.2, longitude: 5.2, accuracy: 6.4 } })
      );
      expect(screen.getByRole('textbox', { name: field })).toHaveValue('25');
      expect(geolocation.clearWatch).toHaveBeenCalledWith(42);
      expect(screen.getByTestId('locate-me')).not.toBeDisabled();
    }
  );

  it('stops GPS as soon as dragging starts, preserving the manual placement', () => {
    render(<MapHarness />);
    fireEvent.click(screen.getByTestId('locate-me'));
    const [onFix] = geolocation.watchPosition.mock.calls[0];
    act(() => mapHandlers.dragstart());
    act(() =>
      onFix({ coords: { latitude: 45.3, longitude: 5.4, accuracy: 6.4 } })
    );
    expect(screen.getByRole('textbox', { name: 'Latitude' })).toHaveValue('45');
    act(() => {
      vi.advanceTimersByTime(501);
      mapHandlers.moveend();
    });
    act(() =>
      onFix({ coords: { latitude: 45.3, longitude: 5.4, accuracy: 6.4 } })
    );
    expect(screen.getByRole('textbox', { name: 'Latitude' })).toHaveValue(
      '45.200000'
    );
    expect(geolocation.clearWatch).toHaveBeenCalledWith(42);
  });

  it('honours manual edits made before the first GPS response', () => {
    render(<MapHarness />);
    fireEvent.click(screen.getByTestId('locate-me'));
    const [onFix] = geolocation.watchPosition.mock.calls[0];
    fireEvent.change(screen.getByRole('textbox', { name: 'Latitude' }), {
      target: { value: '' }
    });
    act(() =>
      onFix({ coords: { latitude: 45.3, longitude: 5.4, accuracy: 6.4 } })
    );
    expect(screen.getByRole('textbox', { name: 'Latitude' })).toHaveValue('');
    expect(geolocation.clearWatch).toHaveBeenCalledWith(42);
  });

  it('allows stopping a search while keeping the best measurement', () => {
    render(<MapHarness />);
    fireEvent.click(screen.getByTestId('locate-me'));
    expect(screen.getByTestId('location-status')).toHaveTextContent(
      'Searching for your position'
    );
    const [onFix] = geolocation.watchPosition.mock.calls[0];
    act(() =>
      onFix({ coords: { latitude: 45.1, longitude: 5.1, accuracy: 100 } })
    );
    expect(screen.getByTestId('location-status')).toHaveTextContent('±100 m');
    fireEvent.click(screen.getByRole('button', { name: 'Stop searching' }));
    act(() =>
      onFix({ coords: { latitude: 45.2, longitude: 5.2, accuracy: 5 } })
    );
    expect(screen.getByRole('textbox', { name: 'Accuracy' })).toHaveValue(
      '100'
    );
    expect(screen.getByTestId('location-status')).toHaveTextContent(
      'Estimated device accuracy: ±100 m.'
    );
    expect(geolocation.clearWatch).toHaveBeenCalledWith(42);
  });

  it('offers retry after reaching the deadline with a coarse measurement', () => {
    render(<MapHarness />);
    fireEvent.click(screen.getByTestId('locate-me'));
    const [onFix] = geolocation.watchPosition.mock.calls[0];
    act(() =>
      onFix({ coords: { latitude: 45.1, longitude: 5.1, accuracy: 100 } })
    );
    act(() => vi.advanceTimersByTime(60000));
    expect(screen.getByTestId('location-status')).toHaveTextContent(
      'Best accuracy received: ±100 m.'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(geolocation.watchPosition).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('textbox', { name: 'Accuracy' })).toHaveValue(
      '100'
    );
  });

  it.each(['Latitude', 'Select place'])(
    'invalidates acquired accuracy after using %s, even after tracking ends',
    action => {
      render(<MapHarness />);
      fireEvent.click(screen.getByTestId('locate-me'));
      const [onFix] = geolocation.watchPosition.mock.calls[0];
      act(() =>
        onFix({ coords: { latitude: 45.1, longitude: 5.1, accuracy: 3 } })
      );
      if (action === 'Latitude') {
        fireEvent.change(screen.getByRole('textbox', { name: action }), {
          target: { value: '46' }
        });
      } else fireEvent.click(screen.getByRole('button', { name: action }));
      expect(screen.getByRole('textbox', { name: 'Accuracy' })).toHaveValue('');
      expect(screen.queryByTestId('accuracy-circle')).not.toBeInTheDocument();
    }
  );

  it('keeps explicitly declared accuracy on manual moves with a reminder', () => {
    render(<MapHarness />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Accuracy' }), {
      target: { value: '25' }
    });
    act(() => {
      vi.advanceTimersByTime(501);
      mapHandlers.moveend();
    });
    expect(screen.getByRole('textbox', { name: 'Accuracy' })).toHaveValue('25');
    expect(screen.getByTestId('location-status')).toHaveTextContent(
      'Check the accuracy you entered.'
    );
    expect(screen.getByTestId('accuracy-circle')).toHaveAttribute(
      'data-center',
      JSON.stringify({ lat: 45.2, lng: 5.3 })
    );
  });

  it('does not invalidate accuracy for equivalent coordinate formatting', () => {
    render(<MapHarness />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Latitude' }), {
      target: { value: '45.000000' }
    });
    expect(screen.getByRole('textbox', { name: 'Accuracy' })).toHaveValue('12');
  });

  it('keeps the device circle at its fix in forms without entrance accuracy', () => {
    render(<MapHarness hasAccuracyField={false} />);
    fireEvent.click(screen.getByTestId('locate-me'));
    const [onFix] = geolocation.watchPosition.mock.calls[0];
    act(() =>
      onFix({ coords: { latitude: 45.1, longitude: 5.1, accuracy: 5 } })
    );
    act(() => {
      vi.advanceTimersByTime(501);
      mapHandlers.moveend();
    });
    expect(screen.getByTestId('accuracy-circle')).toHaveAttribute(
      'data-center',
      JSON.stringify({ lat: 45.1, lng: 5.1 })
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Latitude' }), {
      target: { value: '' }
    });
    expect(screen.getByTestId('accuracy-circle')).toHaveAttribute(
      'data-radius',
      '5'
    );
  });
});
