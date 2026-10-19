import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import messages from '@/../public/lang/en.json';
import { startAdvancedSearch } from '@/hooks';
import OrganizationsSearch from './OrganizationsSearch';
import PersonSearch from './PersonSearch';

vi.mock('@/hooks', () => ({
  startAdvancedSearch: vi.fn(),
  resetAdvancedSearch: vi.fn(),
  useOnlineStatus: () => true
}));

const renderSearch = element =>
  render(
    <IntlProvider locale="en" messages={messages}>
      {element}
    </IntlProvider>
  );

beforeEach(() => vi.clearAllMocks());

it('defaults to All and does not send a type field before migration', () => {
  const { container } = renderSearch(<OrganizationsSearch />);
  expect(
    screen.getByRole('group', { name: 'Type' }).querySelector('img')
  ).toBeNull();
  expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  fireEvent.submit(container.querySelector('form'));
  expect(startAdvancedSearch).toHaveBeenLastCalledWith(
    expect.objectContaining({
      entity: 'organizations',
      filter: expect.not.objectContaining({ type: expect.anything() })
    })
  );
});

it('searches the explicit type immediately and clears back to All', () => {
  renderSearch(<OrganizationsSearch />);
  fireEvent.click(screen.getByRole('button', { name: 'Publisher' }));
  expect(startAdvancedSearch).toHaveBeenLastCalledWith(
    expect.objectContaining({
      filter: expect.objectContaining({ type: 'EDITION' })
    })
  );
  expect(screen.getByText('Organization type: Publisher')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'All' }));
  expect(startAdvancedSearch.mock.lastCall[0].filter).not.toHaveProperty(
    'type'
  );
});

it('keeps the persons selector default and shared pressed-state behavior', () => {
  renderSearch(<PersonSearch />);
  expect(screen.getByRole('button', { name: 'Cavers' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  fireEvent.click(screen.getByRole('button', { name: 'All' }));
  expect(startAdvancedSearch).toHaveBeenLastCalledWith(
    expect.objectContaining({ filter: {} })
  );
});

it('clears the type and searches All when its active chip is removed with the keyboard', () => {
  renderSearch(<OrganizationsSearch />);
  fireEvent.click(screen.getByRole('button', { name: 'Publisher' }));
  fireEvent.keyUp(
    screen.getByRole('button', { name: 'Organization type: Publisher' }),
    { key: 'Delete' }
  );
  expect(startAdvancedSearch.mock.lastCall[0].filter).not.toHaveProperty(
    'type'
  );
  expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});
