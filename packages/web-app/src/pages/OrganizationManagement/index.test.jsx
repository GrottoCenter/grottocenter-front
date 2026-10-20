import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import { apiGet, apiPost } from '@/api/client';
import {
  useOnlineStatus,
  useOrganization,
  usePermissions,
  useDeleteOrganization,
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
  useDeleteOrganization: vi.fn(),
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

const first = { id: '42', name: 'Old club', type: null, city: 'Millau' };
const second = { id: '43', name: 'Old publisher', type: null, city: 'Paris' };
const typed = Array.from({ length: 99 }, (_, i) => ({
  id: String(1000 + i),
  name: `Classified ${i}`,
  type: 'SPELEOLOGY'
}));

const renderManagement = (initialEntry = '/ui/organizations/management') =>
  renderWithProviders(
    <MemoryRouter initialEntries={[initialEntry]}>
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

const openDuplicatesTab = () =>
  fireEvent.click(
    screen.getByRole('tab', { name: 'Manage duplicate organizations' })
  );

const keepOrganization = id =>
  fireEvent.click(
    within(screen.getByTestId(`duplicate-comparison-${id}`)).getByRole(
      'button',
      { name: 'Keep' }
    )
  );

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  usePermissions.mockReturnValue({ isAuth: true, isModerator: true });
  useOnlineStatus.mockReturnValue(true);
  useOrganization.mockReturnValue({ data: null, isFetching: true });
  useNotification.mockReturnValue({ onSuccess: vi.fn() });
  useUpdateOrganization.mockReturnValue({ mutateAsync: vi.fn() });
  useDeleteOrganization.mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false
  });
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

it('scans until unclassified organizations are found, without showing typed ones', async () => {
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
  const editLink = within(row).getByRole('link', {
    name: 'Edit organization Old club (opens in a new tab)'
  });
  expect(editLink).toHaveAttribute('href', '/ui/organizations/42/edit');
  expect(editLink).toHaveAttribute('target', '_blank');
  expect(editLink).toHaveAttribute('rel', 'noopener noreferrer');
  expect(editLink.parentElement).toBe(
    within(row).getByRole('button', { name: 'View organization Old club' })
      .parentElement
  );
  expect(
    within(row)
      .getByRole('button', { name: 'Save' })
      .querySelector('[data-testid="SaveIcon"]')
  ).toBeInTheDocument();
  fireEvent.mouseDown(within(row).getByRole('combobox'));
  fireEvent.click(screen.getByRole('option', { name: 'Caving group' }));
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

it('starts duplicate analysis only on request and reuses already loaded pages', async () => {
  const duplicate = {
    ...second,
    name: 'Old club',
    city: 'Millau',
    country: 'FR - France'
  };
  apiPost.mockImplementation((_url, { page }) =>
    Promise.resolve(
      page === 1
        ? {
            results: [...typed, { ...first, country: 'FR - France' }],
            totalResults: 101
          }
        : { results: [duplicate], totalResults: 101 }
    )
  );
  renderManagement();

  await waitFor(() => expect(apiPost).toHaveBeenCalledTimes(2));
  openDuplicatesTab();
  const section = await screen.findByRole('region', {
    name: 'Manage duplicate organizations'
  });
  expect(within(section).queryByText('Same name, city and country')).toBeNull();
  fireEvent.click(
    within(section).getByRole('button', { name: 'Analyze duplicates' })
  );
  expect(
    await within(section).findByText('Same name, city and country')
  ).toBeInTheDocument();
  expect(
    within(section).queryByRole('link', {
      name: 'Edit organization Old club (#42) (opens in a new tab)'
    })
  ).toBeNull();
  expect(
    within(section).queryByRole('button', {
      name: 'View organization Old club (#42)'
    })
  ).toBeNull();
  expect(within(section).getByRole('button', { name: 'Compare' })).toHaveClass(
    'MuiButton-contained',
    'MuiButton-colorPrimary'
  );
  expect(
    within(section)
      .getByRole('button', { name: 'Compare' })
      .querySelector('[data-testid="CompareIcon"]')
  ).toBeInTheDocument();
  fireEvent.click(within(section).getByRole('button', { name: 'Compare' }));
  const comparison = screen.getByTestId('duplicate-comparison-42');
  const duplicateEdit = within(comparison).getByRole('link', {
    name: 'Edit organization Old club (#42) (opens in a new tab)'
  });
  expect(duplicateEdit).toHaveAttribute('href', '/ui/organizations/42/edit');
  expect(duplicateEdit).toHaveAttribute('target', '_blank');
  expect(duplicateEdit).toHaveAttribute('rel', 'noopener noreferrer');
  const openLink = within(comparison).getByRole('link', {
    name: 'Open organization Old club (#42) (opens in a new tab)'
  });
  expect(openLink).toHaveAttribute('href', '/ui/organizations/42');
  expect(openLink).toHaveAttribute('target', '_blank');
  expect(openLink).toHaveAttribute('rel', 'noopener noreferrer');
  fireEvent.click(
    within(comparison).getByRole('button', {
      name: 'View organization Old club (#42)'
    })
  );
  expect(await screen.findByTestId('full-organization')).toBeInTheDocument();
  fireEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: 'close' })
  );
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(
    within(section).getByRole('button', { name: 'Ignore for this session' })
  ).toHaveClass('MuiButton-outlined', 'MuiButton-colorSecondary');
  expect(
    within(section)
      .getByRole('button', { name: 'Ignore for this session' })
      .querySelector('[data-testid="DoNotDisturbIcon"]')
  ).toBeInTheDocument();
  expect(apiPost).toHaveBeenCalledTimes(2);
});

it('shows a named similarity score for close names in the same city', async () => {
  apiPost.mockResolvedValue({
    results: [
      {
        id: '42',
        name: 'Spéléo Club du Luberon',
        city: 'Apt',
        country: 'FR - France'
      },
      {
        id: '43',
        name: 'Speleo Club du Luberonn',
        city: 'Apt',
        country: 'FR - France'
      }
    ],
    totalResults: 2
  });
  renderManagement('/ui/organizations/management?tab=duplicates');
  fireEvent.click(screen.getByRole('button', { name: 'Analyze duplicates' }));

  const section = screen.getByRole('region', {
    name: 'Manage duplicate organizations'
  });
  expect(
    await within(section).findByText(/Similar names in the same city/)
  ).toHaveTextContent(/Name similarity: \d+%/);
  expect(
    within(section).queryByRole('button', {
      name: 'View organization Spéléo Club du Luberon (#42)'
    })
  ).toBeNull();
  fireEvent.click(within(section).getByRole('button', { name: 'Compare' }));
  expect(
    within(section).getByRole('button', {
      name: 'View organization Spéléo Club du Luberon (#42)'
    })
  ).toHaveClass('MuiIconButton-root');
});

it('shows CNRS variants even when their location and contact details are missing', async () => {
  apiPost.mockResolvedValue({
    results: [
      { id: 3517, name: 'CNRS éditions (Paris)' },
      { id: 3480, name: 'CNRS éditions' },
      { id: 3440, name: 'CNRS éd. (Paris)' },
      { id: 3071, name: 'CNRS' }
    ],
    totalResults: 4
  });
  renderManagement('/ui/organizations/management?tab=duplicates');
  fireEvent.click(screen.getByRole('button', { name: 'Analyze duplicates' }));

  const section = screen.getByRole('region', {
    name: 'Manage duplicate organizations'
  });
  expect(
    await within(section).findByText(
      'Same normalized name (location unspecified)'
    )
  ).toBeInTheDocument();
  expect(within(section).getAllByText('Same leading acronym')).toHaveLength(3);
  expect(
    within(section).getAllByRole('button', { name: 'Compare' })
  ).toHaveLength(4);
});

it('ignores a group for this tab session and lets the moderator show it again', async () => {
  apiPost.mockResolvedValue({
    results: [
      { ...first, mail: 'club@example.org' },
      { ...second, mail: 'club@example.org' }
    ],
    totalResults: 2
  });
  const view = renderManagement();
  openDuplicatesTab();
  const section = await screen.findByRole('region', {
    name: 'Manage duplicate organizations'
  });
  expect(
    within(section).getByRole('button', {
      name: 'Show suggestions ignored for this session'
    })
  ).toBeDisabled();
  fireEvent.click(
    within(section).getByRole('button', { name: 'Analyze duplicates' })
  );
  fireEvent.click(
    await within(section).findByRole('button', {
      name: 'Ignore for this session'
    })
  );
  expect(within(section).queryByRole('button', { name: 'Compare' })).toBeNull();
  expect(
    sessionStorage.getItem('organizationManagement.ignoredDuplicates')
  ).toContain('42:43');
  const showIgnored = within(section).getByRole('button', {
    name: 'Show suggestions ignored for this session'
  });
  expect(showIgnored).toBeEnabled();
  expect(showIgnored).toHaveClass(
    'MuiButton-outlined',
    'MuiButton-colorSecondary'
  );
  expect(showIgnored.parentElement).toBe(
    within(section).getByRole('button', { name: 'Analyze duplicates' })
      .parentElement
  );
  view.unmount();
  renderManagement();
  openDuplicatesTab();
  expect(screen.queryByRole('button', { name: 'Compare' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Analyze duplicates' }));
  fireEvent.click(
    await screen.findByRole('button', {
      name: 'Show suggestions ignored for this session'
    })
  );
  expect(screen.getByRole('button', { name: 'Compare' })).toBeInTheDocument();
  expect(
    sessionStorage.getItem('organizationManagement.ignoredDuplicates')
  ).toBeNull();
});

it.each([2, 3])(
  'emphasizes differing values across %i organizations while keeping matching fields visible',
  async count => {
    const organizations = [
      {
        id: 42,
        name: 'First organization',
        mail: 'shared@example.org',
        type: null,
        authoredCount: 8,
        publishedCount: 5,
        url: null
      },
      {
        id: 43,
        name: 'Second organization',
        mail: 'shared@example.org',
        type: 'RESEARCH',
        authoredCount: 0,
        publishedCount: 0,
        url: ''
      },
      {
        id: 44,
        name: 'Third organization',
        mail: 'shared@example.org',
        type: 'RESEARCH'
      }
    ].slice(0, count);
    apiPost.mockResolvedValue({ results: organizations, totalResults: count });
    apiGet.mockImplementation(url =>
      Promise.resolve(
        organizations.find(org => org.id === Number(url.split('/').pop()))
      )
    );
    renderManagement('/ui/organizations/management?tab=duplicates');
    fireEvent.click(screen.getByRole('button', { name: 'Analyze duplicates' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Compare' }));

    const firstCard = within(screen.getByTestId('duplicate-comparison-42'));
    await waitFor(() =>
      expect(firstCard.getByText('13', { selector: 'strong' })).toBeVisible()
    );
    for (const organization of organizations) {
      const card = within(
        screen.getByTestId(`duplicate-comparison-${organization.id}`)
      );
      expect(
        card.getByTestId('comparison-field-type').querySelector('strong')
      ).toHaveTextContent(
        organization.id === 42 ? 'Type not specified' : 'Research organization'
      );
      expect(
        card.getByTestId('comparison-field-documents').querySelector('strong')
      ).toHaveTextContent(organization.id === 42 ? '13' : '0');
      for (const field of [
        'mail',
        'url',
        'address',
        'members',
        'caves',
        'managed'
      ]) {
        const row = card.getByTestId(`comparison-field-${field}`);
        expect(row).toBeVisible();
        expect(row.querySelector('strong')).toBeNull();
      }
      expect(card.getByTestId('comparison-field-url')).toHaveTextContent('—');
      expect(card.getByTestId('comparison-field-members')).toHaveTextContent(
        '0'
      );
    }
  }
);

it('requires an explicit direction and confirms a soft delete with redirect only', async () => {
  apiPost.mockResolvedValue({
    results: [
      { ...first, mail: 'club@example.org' },
      { ...second, mail: 'club@example.org' }
    ],
    totalResults: 2
  });
  apiGet.mockImplementation(url =>
    Promise.resolve(
      url.endsWith('/43') ? { ...second, id: 43 } : { ...first, id: 42 }
    )
  );
  const mutateAsync = vi.fn().mockResolvedValue({});
  useDeleteOrganization.mockReturnValue({ mutateAsync, isPending: false });
  renderManagement();
  expect(screen.getByTestId('BusinessIcon')).toBeInTheDocument();
  openDuplicatesTab();
  fireEvent.click(
    await screen.findByRole('button', { name: 'Analyze duplicates' })
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Compare' }));
  expect(
    screen.getByRole('button', {
      name: 'View organization Old club (#42)'
    })
  ).toHaveClass('MuiIconButton-root');
  expect(
    screen.queryByRole('button', { name: /^Delete .* and redirect to/ })
  ).toBeNull();
  keepOrganization(43);
  const keptCard = screen.getByTestId('duplicate-comparison-43');
  const removedCard = screen.getByTestId('duplicate-comparison-42');
  expect(within(keptCard).getByRole('status')).toHaveTextContent('To keep');
  expect(within(removedCard).queryByText('Organization to remove')).toBeNull();
  expect(within(keptCard).getByRole('status')).toContainElement(
    within(keptCard).getByTestId('CheckIcon')
  );
  expect(within(removedCard).queryByTestId('CloseIcon')).toBeNull();
  expect(within(keptCard).getByTestId('CheckIcon')).toHaveAttribute(
    'aria-hidden',
    'true'
  );
  expect(getComputedStyle(keptCard).borderColor).not.toBe(
    getComputedStyle(removedCard).borderColor
  );
  const action = screen.getByRole('button', {
    name: 'Delete Old club (#42) and redirect to Old publisher (#43)…'
  });
  await waitFor(() => expect(action).toBeEnabled());
  expect(action).toHaveClass('MuiButton-contained', 'MuiButton-colorError');
  expect(
    action.querySelector('[data-testid="DeleteRoundedIcon"]')
  ).toBeInTheDocument();
  expect(removedCard).toContainElement(action);
  expect(
    within(keptCard).queryByRole('button', { name: /^Delete/ })
  ).toBeNull();
  expect(screen.getByRole('button', { name: 'Close' })).toHaveClass(
    'MuiButton-outlined'
  );
  expect(
    screen
      .getByRole('button', { name: 'Close' })
      .querySelector('[data-testid="CloseIcon"]')
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Ignore for this session' })
      .parentElement
  ).toBe(screen.getByRole('button', { name: 'Close' }).parentElement);
  fireEvent.click(action);
  const dialog = screen.getByRole('dialog');
  expect(dialog).toHaveTextContent(
    'Members, documents and other relationships will not be transferred.'
  );
  expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveClass(
    'MuiButton-outlined'
  );
  const deleteButton = within(dialog).getByRole('button', { name: 'Delete' });
  expect(deleteButton).toHaveClass(
    'MuiButton-contained',
    'MuiButton-colorError'
  );
  expect(
    deleteButton.querySelector('[data-testid="DeleteRoundedIcon"]')
  ).toBeInTheDocument();
  fireEvent.click(deleteButton);
  await waitFor(() =>
    expect(mutateAsync).toHaveBeenCalledWith({
      id: '42',
      entityId: '43',
      isPermanent: false
    })
  );
  const success = await screen.findByTestId('duplicate-success-42');
  expect(success).toHaveTextContent(
    'Old club (#42) was soft-deleted and now redirects to Old publisher (#43).'
  );
  expect(
    within(success).queryByRole('button', {
      name: 'View organization Old publisher (#43)'
    })
  ).toBeNull();
  for (const [name, id] of [
    ['Old club (#42)', 42],
    ['Old publisher (#43)', 43]
  ]) {
    const link = within(success).getByRole('link', { name });
    expect(link).toHaveAttribute('href', `/ui/organizations/${id}`);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  }
  expect(within(success).getAllByRole('link')).toHaveLength(2);
  const acknowledge = within(success).getByRole('button', { name: 'Got it' });
  expect(acknowledge).toHaveClass(
    'MuiButton-outlined',
    'MuiButton-colorSuccess'
  );
  fireEvent.click(
    screen.getByRole('tab', { name: 'Organizations to classify' })
  );
  openDuplicatesTab();
  expect(screen.getByTestId('duplicate-success-42')).toBeInTheDocument();
  fireEvent.click(acknowledge);
  expect(screen.queryByTestId('duplicate-success-42')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Compare' })).toBeNull();
});

it('offers one delete action per other organization in a larger group', async () => {
  const third = {
    id: 44,
    name: 'Another club',
    type: null,
    mail: 'club@example.org'
  };
  apiPost.mockResolvedValue({
    results: [
      { ...first, mail: 'club@example.org' },
      { ...second, mail: 'club@example.org' },
      third
    ],
    totalResults: 3
  });
  const byId = new Map([
    [42, first],
    [43, second],
    [44, third]
  ]);
  apiGet.mockImplementation(url => {
    const id = Number(url.split('/').pop());
    return Promise.resolve({ ...byId.get(id), id });
  });
  const mutateAsync = vi.fn().mockResolvedValue({});
  useDeleteOrganization.mockReturnValue({ mutateAsync, isPending: false });
  renderManagement('/ui/organizations/management?tab=duplicates');

  fireEvent.click(screen.getByRole('button', { name: 'Analyze duplicates' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Compare' }));
  expect(
    screen.queryByRole('radiogroup', { name: 'Organization to remove' })
  ).toBeNull();
  keepOrganization(42);
  expect(screen.getAllByText('To keep')).toHaveLength(1);
  keepOrganization(43);
  expect(screen.getAllByText('To keep')).toHaveLength(1);
  const selected = within(screen.getByTestId('duplicate-comparison-43'));
  expect(selected.getByRole('status')).toHaveTextContent('To keep');
  expect(selected.queryByRole('button', { name: /Keep|To keep/ })).toBeNull();
  expect(
    within(screen.getByTestId('duplicate-comparison-42')).getByRole('button', {
      name: 'Keep'
    })
  ).toBeEnabled();
  const removeThird = screen.getByRole('button', {
    name: 'Delete Another club (#44) and redirect to Old publisher (#43)…'
  });
  expect(
    screen.getByRole('button', {
      name: 'Delete Old club (#42) and redirect to Old publisher (#43)…'
    })
  ).toBeInTheDocument();
  await waitFor(() => expect(removeThird).toBeEnabled());
  fireEvent.click(removeThird);
  expect(screen.getByRole('dialog')).toHaveTextContent(
    'Delete Another club (#44) and redirect visitors to Old publisher (#43)?'
  );
  fireEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' })
  );
  await waitFor(() =>
    expect(mutateAsync).toHaveBeenCalledWith({
      id: '44',
      entityId: '43',
      isPermanent: false
    })
  );
  expect(screen.getByTestId('duplicate-success-44')).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(screen.getByText('1 organization left to examine.')).toBeVisible();
  expect(selected.getByRole('status')).toHaveTextContent('To keep');
  expect(screen.getByTestId('duplicate-comparison-42')).toBeVisible();
  expect(screen.queryByTestId('duplicate-comparison-44')).toBeNull();
  // The actual mutation invalidates detail queries; a deleted source must no
  // longer participate in the comparison's readiness checks.
  apiGet.mockImplementation(url => {
    const id = Number(url.split('/').pop());
    return Promise.resolve({ ...byId.get(id), id, isDeleted: id === 44 });
  });
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  fireEvent.click(screen.getByRole('button', { name: 'Compare' }));
  expect(
    within(screen.getByTestId('duplicate-comparison-43')).getByRole('status')
  ).toHaveTextContent('To keep');
  const remainingAction = screen.getByRole('button', {
    name: 'Delete Old club (#42) and redirect to Old publisher (#43)…'
  });
  await waitFor(() => expect(remainingAction).toBeEnabled());
  fireEvent.click(remainingAction);
  fireEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' })
  );
  await waitFor(() =>
    expect(mutateAsync).toHaveBeenLastCalledWith({
      id: '42',
      entityId: '43',
      isPermanent: false
    })
  );
  expect(screen.getByTestId('duplicate-success-42')).toBeInTheDocument();
  expect(screen.getByTestId('duplicate-success-44')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Compare' })).toBeNull();
  expect(screen.queryByRole('radiogroup')).toBeNull();
});

it('keeps completed groups in their original position until acknowledged', async () => {
  const organizations = Array.from({ length: 6 }, (_, index) => ({
    id: index + 1,
    name: `${['Alpha', 'Beta', 'Gamma'][Math.floor(index / 2)]} organization ${index}`,
    mail: `pair${Math.floor(index / 2)}@example.org`,
    type: 'SPELEOLOGY'
  }));
  apiPost.mockResolvedValue({ results: organizations, totalResults: 6 });
  apiGet.mockImplementation(url =>
    Promise.resolve(
      organizations.find(
        organization => organization.id === Number(url.split('/').pop())
      )
    )
  );
  const mutateAsync = vi.fn().mockResolvedValue({});
  useDeleteOrganization.mockReturnValue({ mutateAsync, isPending: false });
  renderManagement('/ui/organizations/management?tab=duplicates');
  fireEvent.click(screen.getByRole('button', { name: 'Analyze duplicates' }));
  const middleGroup = await screen.findByTestId('duplicate-group-3:4');
  const initialGroups = screen.getAllByTestId(/^duplicate-group-/);
  fireEvent.click(within(middleGroup).getByRole('button', { name: 'Compare' }));
  keepOrganization(4);
  const action = within(middleGroup).getByRole('button', {
    name: 'Delete Beta organization 2 (#3) and redirect to Beta organization 3 (#4)…'
  });
  await waitFor(() => expect(action).toBeEnabled());
  fireEvent.click(action);
  fireEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' })
  );
  const success = await screen.findByTestId('duplicate-success-3');
  expect(middleGroup).toContainElement(success);
  expect(screen.getAllByTestId(/^duplicate-group-/)).toEqual(initialGroups);
  fireEvent.click(
    screen.getByRole('tab', { name: 'Organizations to classify' })
  );
  openDuplicatesTab();
  expect(screen.getAllByTestId(/^duplicate-group-/)).toEqual(initialGroups);
  fireEvent.click(within(success).getByRole('button', { name: 'Got it' }));
  expect(screen.queryByTestId('duplicate-group-3:4')).toBeNull();
  expect(screen.getAllByTestId(/^duplicate-group-/)).toEqual([
    initialGroups[0],
    initialGroups[2]
  ]);
});

it('loads at least 50 unclassified organizations then waits for Load more', async () => {
  const unclassified = Array.from({ length: 100 }, (_, i) => ({
    id: String(i + 1),
    name: `Unclassified ${i}`,
    type: null
  }));
  apiPost.mockImplementation((_url, { page }) => {
    let results;
    if (page === 1) {
      results = [...unclassified.slice(0, 30), ...typed.slice(0, 70)];
    } else if (page === 2) {
      results = [...unclassified.slice(30, 55), ...typed.slice(0, 75)];
    } else {
      results = [...unclassified.slice(55), ...typed.slice(0, 55)];
    }
    return Promise.resolve({ results, totalResults: 300 });
  });
  renderManagement();

  await waitFor(() => expect(apiPost).toHaveBeenCalledTimes(2));
  expect(screen.getAllByTestId(/^organization-row-/)).toHaveLength(50);
  expect(screen.queryByTestId('organization-row-56')).toBeNull();
  const loadMore = screen.getByRole('button', { name: 'Load more' });
  expect(loadMore).toHaveClass('MuiButton-outlined', 'MuiButton-fullWidth');
  fireEvent.click(loadMore);
  await waitFor(() => expect(apiPost).toHaveBeenCalledTimes(3));
  expect(screen.getAllByTestId(/^organization-row-/)).toHaveLength(100);
});

it('shows ten duplicate groups at a time with a full-width load-more button', async () => {
  apiPost.mockResolvedValue({
    results: Array.from({ length: 22 }, (_, index) => ({
      id: index + 1,
      name: `Organization ${index + 1}`,
      mail: `pair${Math.floor(index / 2)}@example.org`,
      type: 'SPELEOLOGY'
    })),
    totalResults: 22
  });
  renderManagement('/ui/organizations/management?tab=duplicates');
  fireEvent.click(screen.getByRole('button', { name: 'Analyze duplicates' }));

  await waitFor(() =>
    expect(screen.getAllByRole('button', { name: 'Compare' })).toHaveLength(10)
  );
  const loadMore = screen.getByRole('button', { name: 'Load more' });
  expect(loadMore).toHaveClass('MuiButton-outlined', 'MuiButton-fullWidth');
  fireEvent.click(loadMore);
  expect(screen.getAllByRole('button', { name: 'Compare' })).toHaveLength(11);
});

it('cancels an in-flight duplicate request and never shows partial matches', async () => {
  const firstPage = [
    { ...first, type: 'SPELEOLOGY', mail: 'club@example.org' },
    { ...second, type: 'EDITION', mail: 'club@example.org' },
    ...typed.slice(0, 98)
  ];
  let scanSignal;
  let scanAttempts = 0;
  apiPost.mockImplementation((_url, { page }, { signal }) => {
    if (page === 1) {
      return Promise.resolve({
        results: firstPage,
        totalResults: 200
      });
    }
    scanSignal = signal;
    scanAttempts += 1;
    if (scanAttempts > 1) {
      return Promise.resolve({
        results: [...typed, { id: '5000', name: 'Another', type: 'EDITION' }],
        totalResults: 200
      });
    }
    return new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () =>
        reject(new DOMException('Aborted', 'AbortError'))
      );
    });
  });
  renderManagement('/ui/organizations/management?tab=duplicates');
  const section = within(
    screen.getByRole('region', { name: 'Manage duplicate organizations' })
  );
  fireEvent.click(section.getByRole('button', { name: 'Analyze duplicates' }));
  expect(
    await section.findByText('Organizations scanned: 100 of 200')
  ).toBeInTheDocument();
  expect(section.getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '50'
  );
  const cancel = section.getByRole('button', { name: 'Cancel' });
  expect(cancel.parentElement).toBe(
    section.getByRole('progressbar').parentElement
  );
  expect(cancel).toHaveClass('MuiButton-outlined', 'MuiButton-colorError');
  fireEvent.click(cancel);
  await waitFor(() => expect(scanSignal.aborted).toBe(true));
  expect(
    await section.findByText(
      'Analysis cancelled. No partial results are shown.'
    )
  ).toBeInTheDocument();
  expect(apiPost).toHaveBeenCalledTimes(2);
  expect(section.queryByRole('button', { name: 'Compare' })).toBeNull();
  fireEvent.click(section.getByRole('button', { name: 'Analyze duplicates' }));
  expect(
    await section.findByText('Analysis complete: 200 organizations examined.')
  ).toBeInTheDocument();
  expect(apiPost).toHaveBeenCalledTimes(4);
  expect(section.getByRole('button', { name: 'Compare' })).toBeInTheDocument();
});

it('keeps an in-flight duplicate scan running when switching tabs', async () => {
  const unclassified = Array.from({ length: 50 }, (_, i) => ({
    id: String(i + 1),
    name: `Group ${i}`,
    type: null
  }));
  let scanSignal;
  apiPost.mockImplementation((_url, { page }, { signal }) => {
    if (page === 1) {
      return Promise.resolve({
        results: [...unclassified, ...typed.slice(0, 50)],
        totalResults: 200
      });
    }
    scanSignal = signal;
    return new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () =>
        reject(new DOMException('Aborted', 'AbortError'))
      );
    });
  });
  renderManagement();
  const tabs = within(screen.getByRole('tablist'));
  const duplicatesTab = tabs.getByRole('tab', {
    name: 'Manage duplicate organizations'
  });
  const classifyTab = tabs.getByRole('tab', {
    name: 'Organizations to classify'
  });
  await screen.findByTestId('organization-row-1');
  fireEvent.click(duplicatesTab);
  // The classification tab keeps 50 MUI rows mounted while hidden. Scope
  // queries to the scan controls to avoid repeatedly traversing those rows.
  const section = within(
    screen.getByRole('region', { name: 'Manage duplicate organizations' })
  );
  fireEvent.click(section.getByRole('button', { name: 'Analyze duplicates' }));
  await waitFor(() => expect(apiPost).toHaveBeenCalledTimes(2));
  fireEvent.click(classifyTab);
  expect(scanSignal.aborted).toBe(false);
  fireEvent.click(duplicatesTab);
  expect(section.getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '50'
  );
  expect(scanSignal.aborted).toBe(false);
  fireEvent.click(section.getByRole('button', { name: 'Cancel' }));
  await waitFor(() => expect(scanSignal.aborted).toBe(true));
});

it('opens either tab directly without scanning until requested', async () => {
  renderManagement('/ui/organizations/management?tab=duplicates');

  expect(
    screen.getByRole('tab', { name: 'Manage duplicate organizations' })
  ).toHaveAttribute('aria-selected', 'true');
  expect(apiPost).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Analyze duplicates' }));
  await waitFor(() => expect(apiPost).toHaveBeenCalled());
});
