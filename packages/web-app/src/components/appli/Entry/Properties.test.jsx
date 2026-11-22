import { fireEvent, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import NetworkProperties from '@/components/appli/Network/Properties';
import Properties from './Properties';

const cave = {
  id: 7,
  depth: 40,
  length: 120,
  temperature: 8,
  exploringOrganizations: [{ id: 9, name: 'Exploring organization' }]
};

const renderProperties = element =>
  renderWithProviders(<MemoryRouter>{element}</MemoryRouter>, { messages });

it('preserves entrance content, the featured image slot and section headings', () => {
  renderProperties(
    <Properties
      entrance={{
        id: 42,
        city: 'Example city',
        region: 'Example region',
        cave,
        hasBat: true
      }}
      featuredImage={<a href="/image">Featured image</a>}
    />
  );
  expect(screen.getByTestId('entrance-location')).toHaveTextContent(
    'Example city, Example region'
  );
  expect(screen.getByTestId('entrance-location')).toContainElement(
    screen.getByRole('link', { name: 'Featured image' })
  );
  expect(screen.getByText('40 m')).toBeVisible();
  expect(screen.getByText('120 m')).toBeVisible();
  expect(screen.getByText('Bat habitat')).toBeVisible();
  expect(
    screen.getByRole('link', { name: 'Exploring organization' })
  ).toHaveAttribute('href', '/ui/organizations/9');
  for (const title of [
    'Location',
    'Characteristics',
    'Interest of the visit',
    'Hazards & restrictions',
    'Exploring organizations'
  ]) {
    expect(
      screen.getByRole('heading', { name: title, level: 2 })
    ).toBeVisible();
  }
});

it('retains conditional panels on deleted and minimally described entrances', () => {
  renderProperties(<Properties entrance={{ id: 42, isDeleted: true }} />);
  expect(screen.getAllByRole('heading')).toHaveLength(1);
  expect(screen.getByRole('heading', { name: 'Location' })).toBeVisible();
  expect(screen.queryByText('Not rated')).toBeNull();
});

it('keeps the data-quality details interactive inside the shared panel', async () => {
  renderProperties(
    <Properties
      entrance={{ id: 42 }}
      dataQuality={{ total: 72, categories: { general: 80 } }}
    />
  );
  expect(screen.getByText('80%')).not.toBeVisible();
  fireEvent.click(screen.getByText('Details by category'));
  await waitFor(() => expect(screen.getByText('80%')).toBeVisible());
  fireEvent.click(screen.getByText('Details by category'));
  await waitFor(() => expect(screen.getByText('80%')).not.toBeVisible());
});

it('preserves network properties and hides absent network panels', () => {
  const { rerender } = renderProperties(
    <NetworkProperties cave={cave} isLoading={false} />
  );
  expect(
    screen.getByRole('heading', { name: 'Characteristics', level: 2 })
  ).toBeVisible();
  expect(screen.getByText('8 °C')).toBeVisible();
  expect(
    screen.getByRole('link', { name: 'Exploring organization' })
  ).toHaveAttribute('href', '/ui/organizations/9');
  rerender(
    <MemoryRouter>
      <NetworkProperties cave={{ id: 7 }} isLoading={false} />
    </MemoryRouter>
  );
  expect(screen.queryByRole('heading')).toBeNull();
});
