import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import * as coordinatePreference from '@/hooks/useCoordinatePreference';
import copyToClipboard from '@/utils/clipboard';
import messages from '../../../../public/lang/en.json';
import CoordinatesProperty from './CoordinatesProperty';

vi.mock('@/hooks', () => ({
  ...coordinatePreference,
  useNotification: () => ({ onSuccess: vi.fn() }),
  useProjections: () => []
}));
vi.mock('@/utils/clipboard', () => ({ default: vi.fn() }));

const renderCoordinates = props =>
  render(
    <MemoryRouter>
      <IntlProvider locale="en" messages={messages}>
        <CoordinatesProperty {...props} />
      </IntlProvider>
    </MemoryRouter>
  );

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

it('displays and copies zero coordinates with map links', async () => {
  renderCoordinates({ latitude: 0, longitude: 0 });

  expect(screen.getByText('Coordinates (WGS84)')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Copy coordinates' }));
  await waitFor(() =>
    expect(copyToClipboard).toHaveBeenCalledWith('0.0000° N, 0.0000° E')
  );
  expect(
    screen.getByRole('button', { name: 'Open on map' })
  ).toBeInTheDocument();
});

it('keeps the label and copied value in the preferred coordinate system', async () => {
  localStorage.setItem('preferredCoordinateSystem', 'DMS');
  renderCoordinates({ latitude: 45.5, longitude: 6.5 });

  expect(screen.getByText('Coordinates (DMS)')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Copy coordinates' }));
  await waitFor(() =>
    expect(copyToClipboard).toHaveBeenCalledWith(expect.stringContaining('30'))
  );
  expect(copyToClipboard.mock.calls[0][0]).not.toContain('45.5000');
});

it.each([
  { latitude: null, longitude: 6 },
  { latitude: 45, longitude: undefined },
  { latitude: NaN, longitude: 6 },
  { latitude: 45, longitude: Infinity }
])('hides incomplete or non-finite coordinates: %j', props => {
  const { container } = renderCoordinates(props);
  expect(container).toBeEmptyDOMElement();
});
