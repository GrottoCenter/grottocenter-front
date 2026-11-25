import { fireEvent, render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';

import messages from '@/../public/lang/en.json';
import { startAdvancedSearch } from '@/hooks';
import DocumentSearch from './DocumentSearch';

vi.mock('@/hooks', () => ({
  startAdvancedSearch: vi.fn(),
  resetAdvancedSearch: vi.fn(),
  useDocumentTypes: () => ({ data: [] }),
  useSubjects: () => ({ data: [] }),
  useOnlineStatus: () => true
}));

const renderSearch = ({ initialFilter, lockedFilter } = {}) =>
  render(
    <MemoryRouter>
      <IntlProvider locale="en" messages={messages}>
        <DocumentSearch
          initialFilter={initialFilter}
          lockedFilter={lockedFilter}
        />
      </IntlProvider>
    </MemoryRouter>
  );

beforeEach(() => vi.clearAllMocks());

const openAdvancedFilters = () =>
  fireEvent.click(screen.getByRole('button', { name: /^Advanced filters/ }));

it.each([
  ['Yes', true],
  ['No', false]
])(
  'submits %s as a boolean and removes it through its chip',
  (label, value) => {
    const { container } = renderSearch({
      initialFilter: { 'authors.nickname': 'Test' },
      lockedFilter: ['authors.nickname']
    });
    openAdvancedFilters();
    const choices = within(
      screen.getByRole('group', { name: 'File available' })
    );
    fireEvent.click(choices.getByRole('button', { name: label }));
    expect(choices.getByRole('button', { name: label })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    fireEvent.submit(container.querySelector('form'));
    expect(startAdvancedSearch).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          hasFiles: value,
          'authors.nickname': 'Test'
        })
      })
    );
    fireEvent.keyUp(
      screen.getByRole('button', {
        name: `File available: ${value ? 'yes' : 'no'}`
      }),
      { key: 'Delete' }
    );
    fireEvent.submit(container.querySelector('form'));
    expect(startAdvancedSearch.mock.lastCall[0].filter.hasFiles).toBe('');
    expect(
      startAdvancedSearch.mock.lastCall[0].filter['authors.nickname']
    ).toBe('Test');
  }
);

it('clears a false filter with Clear all and preserves a locked file filter', () => {
  const { unmount } = renderSearch();
  openAdvancedFilters();
  fireEvent.click(screen.getByRole('button', { name: 'No' }));
  fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
  expect(startAdvancedSearch.mock.lastCall[0].filter.hasFiles).toBe('');
  unmount();
  const { container } = renderSearch({
    initialFilter: { hasFiles: false },
    lockedFilter: ['hasFiles']
  });
  expect(
    screen.queryByRole('group', { name: 'File available' })
  ).not.toBeInTheDocument();
  fireEvent.submit(container.querySelector('form'));
  expect(startAdvancedSearch.mock.lastCall[0].filter.hasFiles).toBe(false);
});

it('keeps the selected choice on repeated activation and explicitly returns to All', () => {
  const { container } = renderSearch();
  openAdvancedFilters();
  const choices = within(screen.getByRole('group', { name: 'File available' }));
  expect(choices.getByRole('button', { name: 'All' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  const withoutFile = choices.getByRole('button', { name: 'No' });
  fireEvent.click(withoutFile);
  fireEvent.click(withoutFile);
  fireEvent.submit(container.querySelector('form'));
  expect(startAdvancedSearch.mock.lastCall[0].filter.hasFiles).toBe(false);
  fireEvent.click(choices.getByRole('button', { name: 'All' }));
  fireEvent.submit(container.querySelector('form'));
  expect(startAdvancedSearch.mock.lastCall[0].filter.hasFiles).toBe('');
  expect(choices.getByRole('button', { name: 'All' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});

it.each([
  ['Yes', 'yes'],
  ['No', 'no']
])(
  'counts %s in advanced filters and keeps its chip visible when collapsed',
  (label, valueLabel) => {
    renderSearch();
    expect(
      screen.queryByRole('group', { name: 'File available' })
    ).not.toBeInTheDocument();
    openAdvancedFilters();
    fireEvent.click(
      within(screen.getByRole('group', { name: 'File available' })).getByRole(
        'button',
        { name: label }
      )
    );
    const toggle = screen.getByRole('button', { name: /^Advanced filters/ });
    expect(toggle).toHaveTextContent('1');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const chip = screen.getByRole('button', {
      name: `File available: ${valueLabel}`
    });
    expect(chip).toBeVisible();
    fireEvent.keyUp(chip, { key: 'Delete' });
    expect(toggle).not.toHaveTextContent('1');
  }
);
