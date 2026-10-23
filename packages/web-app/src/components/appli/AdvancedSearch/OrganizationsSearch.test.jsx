import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { Link, MemoryRouter } from 'react-router-dom';
import messages from '@/../public/lang/en.json';
import { startAdvancedSearch } from '@/hooks';
import {
  ORGANIZATION_TYPE_VALUES,
  getOrganizationTypeLabelId
} from '@/utils/organizationTypes';
import OrganizationsSearchPage from '@/pages/Organizations';
import OrganizationsSearch from './OrganizationsSearch';
import PersonSearch from './PersonSearch';

vi.mock('@/hooks', () => ({
  startAdvancedSearch: vi.fn(),
  resetAdvancedSearch: vi.fn(),
  useOnlineStatus: () => true
}));

vi.mock('@/components/common/Layouts/Fixed/FixedContent', () => ({
  default: ({ content }) => content
}));
vi.mock('@/components/common/NewEntityButton', () => ({
  default: () => null
}));
vi.mock('./SearchResults', () => ({ default: () => null }));

const renderSearch = (element, route = '/organizations') =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <IntlProvider locale="en" messages={messages}>
        {element}
      </IntlProvider>
    </MemoryRouter>
  );

beforeEach(() => vi.clearAllMocks());

it('defaults to caving groups and submits the same type', () => {
  const { container } = renderSearch(<OrganizationsSearch />);
  expect(
    screen.getByRole('group', { name: 'Type' }).querySelector('img')
  ).toBeNull();
  expect(screen.getByRole('button', { name: 'Caving group' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  fireEvent.submit(container.querySelector('form'));
  expect(startAdvancedSearch).toHaveBeenLastCalledWith(
    expect.objectContaining({
      entity: 'organizations',
      filter: expect.objectContaining({ type: 'SPELEOLOGY' })
    })
  );
});

it('loads caving groups when the organizations page first opens', () => {
  renderSearch(<OrganizationsSearchPage />);
  expect(startAdvancedSearch).toHaveBeenLastCalledWith(
    expect.objectContaining({
      entity: 'organizations',
      filter: { type: 'SPELEOLOGY' }
    })
  );
});

it.each(ORGANIZATION_TYPE_VALUES)(
  'initializes the request and selected filter from the URL type %s',
  type => {
    renderSearch(<OrganizationsSearchPage />, `/organizations?type=${type}`);
    expect(startAdvancedSearch).toHaveBeenLastCalledWith(
      expect.objectContaining({ filter: { type } })
    );
    expect(
      screen.getByRole('button', {
        name: messages[getOrganizationTypeLabelId(type)]
      })
    ).toHaveAttribute('aria-pressed', 'true');
  }
);

it.each(['ALL', 'INVALID', ''])(
  'resolves the URL type %s consistently in the request and selection',
  type => {
    renderSearch(<OrganizationsSearchPage />, `/organizations?type=${type}`);
    const isAll = type === 'ALL';
    expect(startAdvancedSearch).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filter: isAll ? {} : { type: 'SPELEOLOGY' }
      })
    );
    expect(
      screen.getByRole('button', { name: isAll ? 'All' : 'Caving group' })
    ).toHaveAttribute('aria-pressed', 'true');
  }
);

it('reinitializes the search when navigation changes the URL type', () => {
  renderSearch(
    <>
      <Link to="/organizations?type=EDITION">Show publishers</Link>
      <OrganizationsSearchPage />
    </>
  );
  fireEvent.click(screen.getByRole('link', { name: 'Show publishers' }));
  expect(startAdvancedSearch).toHaveBeenLastCalledWith(
    expect.objectContaining({ filter: { type: 'EDITION' } })
  );
  expect(screen.getByRole('button', { name: 'Publisher' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});

it('resets the search to caving groups while All remains selectable', () => {
  renderSearch(<OrganizationsSearch initialType="EDITION" />);
  fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
  expect(startAdvancedSearch).toHaveBeenLastCalledWith(
    expect.objectContaining({
      query: '',
      filter: expect.objectContaining({ type: 'SPELEOLOGY' })
    })
  );
  expect(screen.getByRole('button', { name: 'Caving group' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  fireEvent.click(screen.getByRole('button', { name: 'All' }));
  expect(startAdvancedSearch.mock.lastCall[0].filter).not.toHaveProperty(
    'type'
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
