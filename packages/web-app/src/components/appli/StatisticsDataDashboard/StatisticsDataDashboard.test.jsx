import { fireEvent, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { apiGet } from '@/api/client';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import StatisticsDataDashboard from './index';

vi.mock('@/api/client', () => ({ apiGet: vi.fn() }));

const territories = [
  ['country', { countryId: 'FR' }],
  ['region', { countryId: 'FR', regionId: '38' }],
  ['massif', { massifId: 7 }]
];
const renderDashboard = props =>
  renderWithProviders(
    <MemoryRouter>
      <StatisticsDataDashboard
        countryId={props.countryId}
        regionId={props.regionId}
        massifId={props.massifId}
        description="Territory statistics"
      />
    </MemoryRouter>,
    { messages }
  );

beforeEach(() => vi.clearAllMocks());

it.each(territories)(
  'shows three entrances and one network for a %s without multiplying measurements',
  async (_type, props) => {
    apiGet.mockResolvedValue({
      nb_entrances: 3,
      nb_caves: 1,
      nb_networks: 1,
      avg: { avg_depth: 25, avg_length: 100 },
      total_length: { value: 100, nb_data: 1 }
    });
    renderDashboard(props);
    const counts = within(await screen.findByTestId('statistics-counts'));
    expect(counts.getByText('entrances').parentElement).toHaveTextContent('3');
    expect(
      counts.getByText('network (cave of more than 1 entrance)').parentElement
    ).toHaveTextContent('1');
    expect(screen.getByText('25 m')).toBeVisible();
    expect(screen.getAllByText('100 m')).toHaveLength(2);
    expect(apiGet).toHaveBeenCalledTimes(1);
  }
);

it.each(territories)(
  'keeps valid zero counts for a %s without empty measurement cards',
  async (_type, props) => {
    apiGet.mockResolvedValue({ nb_entrances: 0, nb_networks: 0, avg: null });
    renderDashboard(props);
    const counts = within(await screen.findByTestId('statistics-counts'));
    expect(counts.getByText('entrances').parentElement).toHaveTextContent('0');
    expect(counts.getAllByText('0')).toHaveLength(2);
    expect(screen.queryByText(messages['Caves statistics'])).toBeNull();
    expect(screen.queryByText(messages['Specifics caves'])).toBeNull();
  }
);

it('pluralizes a single entrance', async () => {
  apiGet.mockResolvedValue({ nb_entrances: 1 });
  renderDashboard({ countryId: 'FR' });
  const counts = within(await screen.findByTestId('statistics-counts'));
  expect(counts.getByText('entrance').parentElement).toHaveTextContent('1');
});

it.each([{}, { nb_entrances: null }, { nb_caves: 99 }])(
  'shows unavailable data instead of inventing a count for %j',
  async statistics => {
    apiGet.mockResolvedValue(statistics);
    renderDashboard({ countryId: 'FR' });
    expect(
      await screen.findByText(
        messages[
          'There is currently not enough information about this country.'
        ]
      )
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('heading', { name: 'More information' }));
    expect(screen.getByRole('alert')).toBeVisible();
    expect(screen.queryByTestId('statistics-counts')).toBeNull();
  }
);

it('keeps the unavailable-data presentation after an API error', async () => {
  apiGet.mockRejectedValue(new Error('Statistics unavailable'));
  renderDashboard({ massifId: 7 });
  expect(
    await screen.findByText(
      messages['There is currently not enough information about this massif.']
    )
  ).toBeInTheDocument();
  expect(screen.queryByTestId('statistics-counts')).toBeNull();
});
