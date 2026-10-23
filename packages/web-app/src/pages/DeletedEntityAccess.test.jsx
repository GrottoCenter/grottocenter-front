import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  useCave,
  useEntrance,
  useMassif,
  useOrganization,
  usePermissions
} from '@/hooks';
import EntryPage from './Entry';
import NetworkPage from './Network';
import MassifPage from './Massif';
import OrganizationPage from './Organization';

vi.mock('@/hooks', () => ({
  useCave: vi.fn(),
  useEntrance: vi.fn(),
  useMassif: vi.fn(),
  useOrganization: vi.fn(),
  usePermissions: vi.fn()
}));

// Keep this regression focused on page guards, not the entity detail bodies.
vi.mock('@/components/appli/Entry', () => ({
  default: () => <div>Entrance detail</div>
}));
vi.mock('@/components/appli/Network', () => ({
  default: () => <div>Network detail</div>
}));
vi.mock('@/components/appli/Massif/Massif', () => ({
  default: () => <div>Massif detail</div>
}));
vi.mock('@/components/appli/Organization', () => ({
  default: () => <div>Organization detail</div>
}));
vi.mock('@/components/common/card/Deleted', () => ({
  Deleted: () => <div>Restricted deleted view</div>,
  DELETED_ENTITIES: {
    entrance: 'entrance',
    network: 'network',
    massif: 'massif',
    organization: 'organization'
  }
}));

beforeEach(() => {
  vi.clearAllMocks();
  useCave.mockReturnValue({});
});

describe.each([
  ['Entrance', EntryPage, useEntrance],
  ['Network', NetworkPage, useCave],
  ['Massif', MassifPage, useMassif],
  ['Organization', OrganizationPage, useOrganization]
])('%s deleted-page access', (name, Page, queryHook) => {
  it.each([
    ['administrator only', { isAdmin: true, isModerator: false }],
    ['moderator only', { isAdmin: false, isModerator: true }]
  ])(
    'keeps the detail view through delete and restore for %s',
    (_role, roles) => {
      usePermissions.mockReturnValue({ isAuth: true, ...roles });
      queryHook.mockReturnValue({ data: { id: 7, isDeleted: false } });
      const renderPage = () => (
        <MemoryRouter>
          <Page />
        </MemoryRouter>
      );
      const { rerender } = render(renderPage());

      [true, false].forEach(isDeleted => {
        queryHook.mockReturnValue({ data: { id: 7, isDeleted } });
        rerender(renderPage());
        expect(screen.getByText(`${name} detail`)).toBeVisible();
        expect(
          screen.queryByText('Restricted deleted view')
        ).not.toBeInTheDocument();
      });
    }
  );

  it.each([true, false])(
    'restricts deleted content for an ordinary reader (authenticated: %s)',
    isAuth => {
      usePermissions.mockReturnValue({
        isAuth,
        isAdmin: false,
        isModerator: false
      });
      queryHook.mockReturnValue({ data: { id: 7, isDeleted: true } });
      render(
        <MemoryRouter>
          <Page />
        </MemoryRouter>
      );
      expect(screen.getByText('Restricted deleted view')).toBeVisible();
      expect(screen.queryByText(`${name} detail`)).not.toBeInTheDocument();
    }
  );
});
