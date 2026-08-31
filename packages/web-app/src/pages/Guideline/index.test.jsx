import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import {
  useDeleteGuideline,
  useGuideline,
  useNotification,
  usePermissions
} from '@/hooks';
import GuidelinePage from './index';

vi.mock('@/hooks', () => ({
  useDeleteGuideline: vi.fn(),
  useGuideline: vi.fn(),
  useNotification: vi.fn(),
  usePermissions: vi.fn()
}));
vi.mock('@/components/common/CustomIcon', () => ({
  default: () => <span data-testid="custom-icon" />
}));
vi.mock('@/components/common/Layouts/PageContainer', () => ({
  default: ({ children }) => <main>{children}</main>
}));
vi.mock('@/components/common/Layouts/PageHeader', () => ({
  default: ({ title, actions }) => (
    <header>
      <h1>{title}</h1>
      {actions}
    </header>
  )
}));
vi.mock('@/components/common/Layouts/ResponsiveActions', () => ({
  default: ({ items }) => (
    <div>
      {items
        .filter(item => !item.hidden)
        .map(item =>
          item.href ? (
            <a key={item.key} href={item.href}>
              {item.label}
            </a>
          ) : (
            <button key={item.key} type="button" onClick={item.onClick}>
              {item.label}
            </button>
          )
        )}
    </div>
  )
}));
vi.mock('@/components/common/Layouts/SectionStack', () => ({
  default: ({ children }) => <div>{children}</div>
}));
vi.mock('@/components/common/Layouts/Fixed/ScrollableContent', () => ({
  default: ({ title, content, dense }) => (
    <section data-dense={String(dense)}>
      <h2>{title}</h2>
      {content}
    </section>
  )
}));
vi.mock('@/components/common/FetchErrorState', () => ({
  default: () => <div role="alert">Unable to load guideline</div>
}));

const messages = {
  'guidelines.description': 'Instructions',
  'Applies to': 'Applies to',
  Country: 'Country',
  Region: 'Region',
  Massif: 'Massif',
  Created: 'Created',
  Updated: 'Modified',
  'author.by': '{verb} by',
  Language: 'Language',
  Edit: 'Edit',
  History: 'History',
  Delete: 'Delete',
  Cancel: 'Cancel',
  close: 'Close',
  'Loading ...': 'Loading',
  'delete-confirmation-dialog': 'Delete this {entityFmt}?',
  'guidelines.delete_error': 'Delete failed'
};

const guideline = {
  id: 42,
  title: 'Access restrictions',
  description: 'First line\nSecond line',
  language: { id: 'eng', refName: 'English' },
  countries: [{ id: 'FR', name: 'France' }],
  regions: [{ id: 'FR-01', name: 'Ain', countryId: 'FR' }],
  massifs: [{ id: 7, name: 'Vercors' }],
  author: { id: 3, nickname: 'Paul' },
  reviewer: { id: 4, nickname: 'Jane' },
  dateInscription: '2026-05-12T09:30:00.000Z',
  dateReviewed: '2026-08-10T09:30:00.000Z',
  isDeleted: false
};

const setGuidelineResult = data => {
  useGuideline.mockReturnValue({
    data,
    error: null,
    isPending: false,
    fetchStatus: 'idle',
    refetch: vi.fn()
  });
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/ui/guidelines/42']}>
      <IntlProvider locale="en" messages={messages}>
        <Routes>
          <Route
            path="/ui/guidelines/:guidelineId"
            element={<GuidelinePage />}
          />
          <Route path="/ui/guidelines" element={<div>Guidelines list</div>} />
        </Routes>
      </IntlProvider>
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  usePermissions.mockReturnValue({ isAuth: false, isModerator: false });
  useNotification.mockReturnValue({ onError: vi.fn() });
  useDeleteGuideline.mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false
  });
});

it('shows the full instructions, contributors and geographical scope', () => {
  setGuidelineResult(guideline);
  renderPage();

  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
    'Access restrictions'
  );
  expect(screen.getByText(/First line/)).toHaveStyle({
    whiteSpace: 'pre-wrap'
  });
  expect(
    screen.getByRole('heading', { name: 'Instructions' }).closest('section')
  ).toHaveAttribute('data-dense', 'true');
  expect(
    screen.getByRole('heading', { name: 'Applies to' }).closest('section')
  ).toHaveAttribute('data-dense', 'true');
  expect(screen.getByRole('link', { name: 'France' })).toHaveAttribute(
    'href',
    '/ui/countries/FR'
  );
  expect(screen.getByRole('link', { name: 'Ain' })).toHaveAttribute(
    'href',
    '/ui/countries/FR/regions/FR-01'
  );
  expect(screen.getByRole('link', { name: 'Vercors' })).toHaveAttribute(
    'href',
    '/ui/massifs/7'
  );
  expect(screen.getByRole('link', { name: 'Paul' })).toHaveAttribute(
    'href',
    '/ui/persons/3'
  );
  expect(screen.getByRole('link', { name: 'Jane' })).toHaveAttribute(
    'href',
    '/ui/persons/4'
  );
  expect(screen.getByTestId('guideline-metadata')).toHaveTextContent(
    /Created by Paul .* · Modified by Jane .* · Language : ENG/
  );
  expect(screen.getByRole('link', { name: 'History' })).toHaveAttribute(
    'href',
    expect.stringContaining('/ui/guidelines/42/snapshots')
  );
  expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Delete' })
  ).not.toBeInTheDocument();
});

it('offers edit and confirmed deletion according to RBAC', async () => {
  const user = userEvent.setup();
  const mutateAsync = vi.fn().mockResolvedValue(undefined);
  usePermissions.mockReturnValue({ isAuth: true, isModerator: true });
  useDeleteGuideline.mockReturnValue({ mutateAsync, isPending: false });
  setGuidelineResult(guideline);
  renderPage();

  expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
    'href',
    '/ui/guidelines/42/edit'
  );
  await user.click(screen.getByRole('button', { name: 'Delete' }));
  expect(screen.getByText('Delete this Access restrictions?')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Delete' }));

  expect(mutateAsync).toHaveBeenCalledWith({ id: '42', isPermanent: false });
  expect(await screen.findByText('Guidelines list')).toBeVisible();
});

it('uses the standard fetch error state', () => {
  useGuideline.mockReturnValue({
    data: null,
    error: { status: 500 },
    isPending: false,
    fetchStatus: 'idle',
    refetch: vi.fn()
  });
  renderPage();

  expect(screen.getByRole('alert')).toHaveTextContent(
    'Unable to load guideline'
  );
});
