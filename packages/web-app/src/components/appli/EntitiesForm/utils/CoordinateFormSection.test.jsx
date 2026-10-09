import { fireEvent, render, screen } from '@testing-library/react';
import { useForm, useWatch } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import messages from '@/../public/lang/en.json';
import CoordinateFormSection from './CoordinateFormSection';

vi.mock('@/hooks', () => ({
  WGS84_DD: 'WGS84_DD',
  DMS_CODE: 'DMS',
  useProjections: () => [
    {
      code: 'EPSG:3857',
      title: 'Mercator',
      units: 'm',
      definition: 'EPSG:3857'
    }
  ]
}));
vi.mock('./MapMarkerSelector', () => ({ default: () => null }));
vi.mock('@/components/common/CRSMenu', () => ({
  default: ({ onSelect }) => (
    <>
      <button type="button" onClick={() => onSelect('EPSG:3857')}>
        Mercator
      </button>
      <button type="button" onClick={() => onSelect('DMS')}>
        DMS
      </button>
      <button type="button" onClick={() => onSelect('WGS84_DD')}>
        WGS84
      </button>
    </>
  )
}));

const Harness = () => {
  const { control } = useForm({
    defaultValues: { latitude: '45.123456', longitude: '5.123456' }
  });
  const latitude = useWatch({ control, name: 'latitude' });
  const longitude = useWatch({ control, name: 'longitude' });
  return (
    <IntlProvider locale="en" messages={messages}>
      <CoordinateFormSection
        control={control}
        formLatitudeKey="latitude"
        formLongitudeKey="longitude"
      />
      <output data-testid="coordinates">
        {latitude},{longitude}
      </output>
    </IntlProvider>
  );
};

describe('CoordinateFormSection', () => {
  it('preserves the exact point when displaying rounded projections or DMS', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Mercator' }));
    expect(screen.getByTestId('coordinates')).toHaveTextContent(
      '45.123456,5.123456'
    );
    fireEvent.click(screen.getByRole('button', { name: 'DMS' }));
    expect(screen.getByTestId('coordinates')).toHaveTextContent(
      '45.123456,5.123456'
    );
    fireEvent.click(screen.getByRole('button', { name: 'WGS84' }));
    expect(screen.getByTestId('coordinates')).toHaveTextContent(
      '45.123456,5.123456'
    );
  });

  it('updates coordinates for an actual projected edit, including a return to the original display', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Mercator' }));
    const easting = screen.getByRole('textbox', { name: 'Easting' });
    const original = easting.value;
    fireEvent.change(easting, {
      target: { value: String(Number(original) + 100) }
    });
    const moved = screen.getByTestId('coordinates').textContent;
    expect(moved).not.toBe('45.123456,5.123456');
    fireEvent.change(easting, { target: { value: original } });
    expect(screen.getByTestId('coordinates').textContent).not.toBe(moved);
  });
});
