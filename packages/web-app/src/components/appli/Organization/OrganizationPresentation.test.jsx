import { screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import Organization from './index';

vi.mock('@/hooks', () => ({
  usePermissions: () => ({ isAuth: true, isAdmin: true, isModerator: true }),
  useOnlineStatus: () => true,
  useIsDesktopLayout: () => true,
  useDeleteOrganization: () => ({ mutate: vi.fn() }),
  useRestoreOrganization: () => ({ mutate: vi.fn() }),
  useJoinOrganization: () => ({ mutateAsync: vi.fn() }),
  useLeaveOrganization: () => ({ mutateAsync: vi.fn() }),
  useSharePage: () => vi.fn()
}));
vi.mock('@/hooks/usePostDeletion', () => ({
  usePostDeletion: () => ({
    wantedDeletedState: false,
    onDeletePress: vi.fn(),
    setWantedDeletedState: vi.fn()
  })
}));
vi.mock('@/components/common/card/Deleted', () => ({
  DeletedCard: () => null,
  DeleteConfirmationDialog: () => null,
  DELETED_ENTITIES: { organization: 'organization' }
}));
vi.mock('@/components/common/Layouts/Fixed/ScrollableContent', () => ({
  default: ({ title, content, icon, anchorId }) => (
    <section data-testid={anchorId}>
      <h2>{title}</h2>
      {icon}
      {content}
    </section>
  )
}));
vi.mock('@/components/common/RelatedCaves/RelatedCaves', () => ({
  default: ({ canManageCaves }) => (
    <p data-testid="exploration-permission">
      {canManageCaves ? 'editable' : 'read-only'}
    </p>
  )
}));
vi.mock(
  '@/components/common/DocumentsList/OrganizationDocumentReferences',
  () => ({
    default: () => null,
    DocumentReferencesSubheader: () => null
  })
);
vi.mock('@/components/common/Maps/common/MapContainer', () => ({
  default: () => null
}));

const renderOrganization = (type, isPreview = false) =>
  renderWithProviders(
    <MemoryRouter>
      <Organization
        isLoading={false}
        isPreview={isPreview}
        organization={{
          id: 42,
          name: 'Example organization',
          type,
          cavers: [{ id: 1, nickname: 'Caver' }],
          exploredEntrances: [{ id: 7, name: 'An entrance' }],
          exploredNetworks: [{ id: 8, name: 'A network' }]
        }}
      />
    </MemoryRouter>,
    { messages }
  );

it.each(['SPELEOLOGY', 'CAVE_RESCUE', 'RESEARCH', null, undefined, ''])(
  'shows membership and exploration controls for %s',
  type => {
    renderOrganization(type);
    expect(screen.getByTestId('members')).toBeInTheDocument();
    expect(screen.getByTestId('related-caves')).toBeInTheDocument();
    expect(screen.getByAltText('cavers')).toBeInTheDocument();
    expect(screen.getByAltText('networks')).toBeInTheDocument();
    expect(screen.getByAltText('entrances')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('organization-properties')).getByTestId(
        'organization-type-label'
      )
    ).not.toBeEmptyDOMElement();
  }
);

it('keeps the full organization details but hides every editing control in preview', () => {
  renderOrganization('SPELEOLOGY', true);

  expect(screen.getByTestId('organization-properties')).toBeInTheDocument();
  expect(screen.getByTestId('members')).toBeInTheDocument();
  expect(screen.getByTestId('related-caves')).toBeInTheDocument();
  expect(screen.getByTestId('authored-documents')).toBeInTheDocument();
  expect(screen.getByTestId('exploration-permission')).toHaveTextContent(
    'read-only'
  );
  for (const action of [
    'Copy link',
    'Edit properties',
    'Delete',
    'Join organization',
    'Add a cave',
    'Remove from organization'
  ]) {
    expect(screen.queryByRole('button', { name: action })).toBeNull();
  }
});

it('retains the usual controls outside the preview', () => {
  renderOrganization('SPELEOLOGY');

  expect(screen.getByTestId('exploration-permission')).toHaveTextContent(
    'editable'
  );
  expect(
    screen.getByRole('button', { name: 'Edit properties' })
  ).toBeInTheDocument();
});

it('shows a failed preview without a retry action', () => {
  renderWithProviders(
    <MemoryRouter>
      <Organization
        isPreview
        isLoading={false}
        error={new Error('Unavailable')}
        organization={null}
      />
    </MemoryRouter>,
    { messages }
  );

  expect(screen.getByTestId('fetch-error-state')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
});

it.each([
  'EDITION',
  'LIBRARY',
  'ADMINISTRATION',
  'NATURE_CONSERVATION',
  'FUTURE'
])(
  'hides membership and exploration without discarding document roles for %s',
  type => {
    renderOrganization(type);
    expect(screen.queryByTestId('members')).not.toBeInTheDocument();
    expect(screen.queryByTestId('related-caves')).not.toBeInTheDocument();
    expect(screen.queryByAltText('cavers')).not.toBeInTheDocument();
    expect(screen.queryByAltText('networks')).not.toBeInTheDocument();
    expect(screen.queryByAltText('entrances')).not.toBeInTheDocument();
    expect(screen.getByTestId('authored-documents')).toBeInTheDocument();
    expect(screen.getByTestId('published-documents')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Join organization' })
    ).not.toBeInTheDocument();
  }
);
