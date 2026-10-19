import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import { apiGet, apiPost } from '@/api/client';
import {
  useOnlineStatus,
  useOrganization,
  usePermissions,
  useUpdateOrganization
} from '@/hooks';
import { useNotification } from '@/hooks/useNotification';
import OrganizationManagement from './index';

vi.mock('@/api/client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn()
}));
vi.mock('@/hooks', () => ({
  useOnlineStatus: vi.fn(),
  useOrganization: vi.fn(),
  usePermissions: vi.fn(),
  useUpdateOrganization: vi.fn()
}));
vi.mock('@/hooks/useNotification', () => ({
  useNotification: vi.fn()
}));
vi.mock('@/components/appli/Organization', () => ({
  default: ({ organization, isPreview }) => (
    <div data-testid="full-organization">
      {isPreview ? 'Preview' : 'Edit'}: {organization?.name}
    </div>
  )
}));
vi.mock('@/components/common/Layouts/Fixed/FixedContent', () => ({
  default: ({ title, content }) => (
    <main>
      <h1>{title}</h1>
      {content}
    </main>
  )
}));

const first = { id: '42', name: 'Old club', type: null, city: 'Millau' };
const second = { id: '43', name: 'Old publisher', type: null, city: 'Paris' };
const typed = Array.from({ length: 99 }, (_, i) => ({
  id: String(1000 + i),
  name: `Classified ${i}`,
  type: 'SPELEOLOGY'
}));

const renderManagement = () =>
  renderWithProviders(
    <MemoryRouter initialEntries={['/ui/organizations/management']}>
      <Routes>
        <Route
          path="/ui/organizations/management"
          element={<OrganizationManagement />}
        />
        <Route path="/ui/dashboard" element={<p>Dashboard</p>} />
      </Routes>
    </MemoryRouter>,
    { messages }
  );

beforeEach(() => {
  vi.clearAllMocks();
  usePermissions.mockReturnValue({ isAuth: true, isModerator: true });
  useOnlineStatus.mockReturnValue(true);
  useOrganization.mockReturnValue({ data: null, isFetching: true });
  useNotification.mockReturnValue({ onSuccess: vi.fn() });
  useUpdateOrganization.mockReturnValue({ mutateAsync: vi.fn() });
  apiPost.mockImplementation((_url, { page }) =>
    Promise.resolve(
      page === 1
        ? { results: [...typed, first], totalResults: 101 }
        : { results: [second], totalResults: 101 }
    )
  );
  apiGet.mockResolvedValue({
    ...first,
    country: 'FR',
    county: 'Aveyron',
    region: 'Occitanie',
    yearBirth: 1978,
    address: '1 rue du Club',
    postalCode: '12100',
    customMessage: 'A club',
    latitude: 44.1,
    longitude: 3.1,
    mail: 'club@example.org',
    url: 'https://example.org'
  });
});

it('scans every page and shows only unclassified organizations', async () => {
  renderManagement();

  expect(
    await screen.findByRole('button', {
      name: 'View organization Old publisher'
    })
  ).toBeInTheDocument();
  expect(apiPost).toHaveBeenCalledTimes(2);
  expect(
    screen.getByText('Organizations scanned: 101 of 101')
  ).toBeInTheDocument();
  expect(screen.queryByText('Classified 0')).not.toBeInTheDocument();
});

it('opens the existing complete organization in a modal from the eye button', async () => {
  useOrganization.mockReturnValue({
    data: { ...first, name: 'Old club', cavers: [{ id: 1 }] },
    isFetching: false,
    isPaused: false
  });
  renderManagement();

  fireEvent.click(
    await screen.findByRole('button', { name: 'View organization Old club' })
  );
  expect(screen.getByRole('dialog')).toContainElement(
    screen.getByTestId('full-organization')
  );
  expect(screen.getByTestId('full-organization')).toHaveTextContent(
    'Preview: Old club'
  );
  fireEvent.click(screen.getByRole('button', { name: 'close' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(
    screen.getByRole('button', { name: 'View organization Old club' })
  ).toBeInTheDocument();
});

it('sends the selected type with all existing editable fields', async () => {
  const mutateAsync = vi
    .fn()
    .mockResolvedValue({ ...first, type: 'SPELEOLOGY' });
  useUpdateOrganization.mockReturnValue({ mutateAsync });
  renderManagement();

  const row = await screen.findByTestId('organization-row-42');
  fireEvent.mouseDown(within(row).getByRole('combobox'));
  fireEvent.click(screen.getByRole('option', { name: 'Caving club' }));
  fireEvent.click(within(row).getByRole('button', { name: 'Save' }));

  await waitFor(() =>
    expect(mutateAsync).toHaveBeenCalledWith({
      id: '42',
      type: 'SPELEOLOGY',
      address: '1 rue du Club',
      city: 'Millau',
      country: { id: 'FR' },
      county: 'Aveyron',
      customMessage: 'A club',
      latitude: 44.1,
      longitude: 3.1,
      mail: 'club@example.org',
      postalCode: '12100',
      region: 'Occitanie',
      url: 'https://example.org',
      yearBirth: 1978
    })
  );
  await waitFor(() =>
    expect(screen.queryByTestId('organization-row-42')).toBeNull()
  );
});

it('does not overwrite a type set by another editor', async () => {
  const mutateAsync = vi.fn();
  useUpdateOrganization.mockReturnValue({ mutateAsync });
  apiGet.mockResolvedValue({ ...first, type: 'RESEARCH' });
  renderManagement();

  const row = await screen.findByTestId('organization-row-42');
  fireEvent.mouseDown(within(row).getByRole('combobox'));
  fireEvent.click(screen.getByRole('option', { name: 'Publisher' }));
  fireEvent.click(within(row).getByRole('button', { name: 'Save' }));

  expect(
    await within(row).findByText(messages['Organization already classified'])
  ).toBeInTheDocument();
  expect(mutateAsync).not.toHaveBeenCalled();
});

it('keeps non-moderators out and never requests the list', async () => {
  usePermissions.mockReturnValue({ isAuth: true, isModerator: false });
  renderManagement();

  expect(await screen.findByText('Dashboard')).toBeInTheDocument();
  expect(apiPost).not.toHaveBeenCalled();
});
