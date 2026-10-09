import { act, fireEvent, render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import messages from '@/../public/lang/en.json';
import CoordinateFormSection from './CoordinateFormSection';

const mapState = vi.hoisted(() => ({
  map: null
}));

vi.mock('react-leaflet', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    useMap: () => {
      const map = actual.useMap();
      mapState.map = map;
      return map;
    }
  };
});
vi.mock('../../../common/Maps/common/Markers/useMarkers', () => ({
  default: () => vi.fn()
}));
vi.mock('../../../common/Maps/common/Markers/Components', () => ({
  EntrancePopup: () => null
}));
vi.mock('../../../common/Maps/common/LayersControl', () => ({
  default: () => null
}));
vi.mock('../../../common/Maps/common/LocateMeControl', () => ({
  default: () => null
}));
vi.mock('../../../common/Maps/common/GeocodingControl', () => ({
  default: () => null
}));
vi.mock('../../../common/Maps/common/FullscreenControl', () => ({
  default: () => null
}));
vi.mock('../../../common/Maps/common/TileReloader', () => ({
  default: () => null
}));
vi.mock('../../../common/CRSMenu', () => ({ default: () => null }));
vi.mock('../../../../hooks', () => ({
  useProjections: () => [],
  WGS84_DD: 'WGS84',
  DMS_CODE: 'DMS'
}));

const Harness = () => {
  const {
    control,
    formState: { errors }
  } = useForm({
    defaultValues: { latitude: '', longitude: '' }
  });
  return (
    <IntlProvider locale="en" messages={messages}>
      <CoordinateFormSection
        control={control}
        formLatitudeKey="latitude"
        formLongitudeKey="longitude"
        latitudeError={errors.latitude?.message}
        longitudeError={errors.longitude?.message}
        required
      />
    </IntlProvider>
  );
};

it('writes coordinates on successive map pans and retains manual editing', () => {
  let now = 10000;
  const clock = vi.spyOn(Date, 'now').mockImplementation(() => now);
  render(<Harness />);
  const pan = (lat, lng) => {
    now += 1000;
    act(() => mapState.map.panTo([lat, lng], { animate: false }));
  };
  pan(45, 6);
  expect(screen.getByRole('textbox', { name: /Latitude/ })).toHaveValue(
    '45.000000'
  );
  expect(screen.getByRole('textbox', { name: /Longitude/ })).toHaveValue(
    '6.000000'
  );
  pan(46, 7);
  expect(screen.getByRole('textbox', { name: /Latitude/ })).toHaveValue(
    '46.000000'
  );
  expect(screen.getByRole('textbox', { name: /Longitude/ })).toHaveValue(
    '7.000000'
  );
  now += 1000;
  fireEvent.change(screen.getByRole('textbox', { name: /Latitude/ }), {
    target: { value: '47' }
  });
  expect(mapState.map.getCenter().lat).toBeCloseTo(47, 5);
  expect(mapState.map.getCenter().lng).toBeCloseTo(7, 5);
  pan(48, 8);
  expect(screen.getByRole('textbox', { name: /Latitude/ })).toHaveValue(
    '48.000000'
  );
  expect(screen.getByRole('textbox', { name: /Longitude/ })).toHaveValue(
    '8.000000'
  );
  act(() => {
    mapState.map.fire('resize');
    mapState.map.panTo([49, 9], { animate: false });
  });
  expect(screen.getByRole('textbox', { name: /Latitude/ })).toHaveValue(
    '48.000000'
  );
  act(() => {
    mapState.map.fire('dragstart');
    mapState.map.panTo([50, 10], { animate: false });
  });
  expect(screen.getByRole('textbox', { name: /Latitude/ })).toHaveValue(
    '50.000000'
  );
  expect(screen.getByRole('textbox', { name: /Longitude/ })).toHaveValue(
    '10.000000'
  );
  clock.mockRestore();
});
