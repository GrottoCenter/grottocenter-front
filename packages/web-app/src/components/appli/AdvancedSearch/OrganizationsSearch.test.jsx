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

it.each([
  ['Publisher', 'EDITION'],
  ['Other', 'OTHER']
])('searches %s immediately and clears back to All', (label, type) => {
  renderSearch(<OrganizationsSearch />);
  fireEvent.click(screen.getByRole('button', { name: label }));
  expect(startAdvancedSearch).toHaveBeenLastCalledWith(
    expect.objectContaining({
      filter: expect.objectContaining({ type })
    })
  );
  expect(screen.getByText(`Organization type: ${label}`)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'All' }));
  expect(startAdvancedSearch.mock.lastCall[0].filter).not.toHaveProperty(
    'type'
  );
});

it('defaults persons to Cavers and clears an explicit author filter back to Cavers', () => {
  const { container } = renderSearch(<PersonSearch />);
  expect(screen.getByRole('button', { name: 'Cavers' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  fireEvent.submit(container.querySelector('form'));
  expect(startAdvancedSearch).toHaveBeenLastCalledWith(
    expect.objectContaining({ filter: { type: 'CAVER' } })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Authors' }));
  expect(startAdvancedSearch).toHaveBeenLastCalledWith(
    expect.objectContaining({ filter: { type: 'AUTHOR' } })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
  expect(startAdvancedSearch).toHaveBeenLastCalledWith(
    expect.objectContaining({ filter: { type: 'CAVER' } })
  );
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
