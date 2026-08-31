import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';

import {
  useDbExport,
  useDuplicatesCount,
  usePendingDocumentsCount,
  usePermissions
} from '../hooks';
import Dashboard from './Dashboard';

vi.mock('../hooks', () => ({
  useDbExport: vi.fn(),
  useDuplicatesCount: vi.fn(),
  usePendingDocumentsCount: vi.fn(),
  usePermissions: vi.fn()
}));

vi.mock('../components/appli/ImpersonationLauncher', () => ({
  default: () => null
}));

const queryResult = { data: 0, isPending: false, isError: false };

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <IntlProvider locale="en">
        <Dashboard />
      </IntlProvider>
    </MemoryRouter>
  );

beforeEach(() => {
  useDbExport.mockReturnValue({ data: null, isPending: false });
  useDuplicatesCount.mockReturnValue(queryResult);
  usePendingDocumentsCount.mockReturnValue(queryResult);
});

it('shows moderators an accessible Guidelines link', () => {
  usePermissions.mockReturnValue({
    isAuth: true,
    isAdmin: false,
    isLeader: false,
    isModerator: true,
    isRealAdmin: false,
    isTokenExpired: false
  });

  renderDashboard();

  expect(screen.getByRole('link', { name: /Guidelines/ })).toHaveAttribute(
    'href',
    '/ui/guidelines'
  );
});

it('does not show the Guidelines card to leaders without moderation rights', () => {
  usePermissions.mockReturnValue({
    isAuth: true,
    isAdmin: false,
    isLeader: true,
    isModerator: false,
    isRealAdmin: false,
    isTokenExpired: false
  });

  renderDashboard();

  expect(screen.queryByRole('link', { name: /Guidelines/ })).toBeNull();
});
