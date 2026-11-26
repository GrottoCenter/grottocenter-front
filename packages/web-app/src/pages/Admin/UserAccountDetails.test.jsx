import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import UserAccountDetails from './UserAccountDetails';

const messages = {
  Email: 'Email',
  'Email verified': 'Email verified',
  'Email not verified': 'Email not verified',
  'adminUserDetails.title': 'Account details',
  'adminUserDetails.activated': 'Account activated',
  'adminUserDetails.notActivated': 'Account not activated',
  'adminUserDetails.mfaEnabled': 'MFA enabled',
  'adminUserDetails.mfaDisabled': 'MFA disabled',
  'adminUserDetails.pendingMail': 'Pending email change',
  'adminUserDetails.registeredOn': 'Registered on',
  'adminUserDetails.lastConnection': 'Last connection',
  'adminUserDetails.never': 'Never',
  'adminUserDetails.connections': 'Connections',
  'adminUserDetails.failedLogins': 'Failed login attempts',
  'adminUserDetails.lastFailedLogin': 'Last failed login',
  'adminUserDetails.failedMfa': 'Failed MFA attempts'
};

const renderDetails = person =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <UserAccountDetails person={person} />
    </IntlProvider>
  );

describe('UserAccountDetails', () => {
  it('renders nothing without a person', () => {
    const { container } = renderDetails(undefined);
    expect(container).toBeEmptyDOMElement();
  });

  it('omits the last connection row when the API does not return it', () => {
    renderDetails({ mfaEnabled: true });
    expect(screen.queryByText('Last connection')).not.toBeInTheDocument();
    expect(screen.queryByText('Never')).not.toBeInTheDocument();
  });

  it('shows healthy account state and both emails', () => {
    renderDetails({
      mail: 'a@b.org',
      pendingMail: 'new@b.org',
      mailIsValid: true,
      activated: true,
      mfaEnabled: true,
      dateLastConnection: '2026-10-07T12:00:00Z',
      connectionCounter: 12,
      loginFailedAttempts: 0,
      totpFailedAttempts: 0
    });
    expect(screen.getByText('Email verified')).toBeInTheDocument();
    expect(screen.getByText('Account activated')).toBeInTheDocument();
    expect(screen.getByText('MFA enabled')).toBeInTheDocument();
    expect(screen.getByTestId('admin-user-mail')).toHaveTextContent('a@b.org');
    expect(screen.getByTestId('admin-user-pending-mail')).toHaveTextContent(
      'new@b.org'
    );
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('shows warning state and "Never" when no connection', () => {
    renderDetails({
      mailIsValid: false,
      activated: false,
      mfaEnabled: false,
      dateLastConnection: null
    });
    expect(screen.getByText('Email not verified')).toBeInTheDocument();
    expect(screen.getByText('Account not activated')).toBeInTheDocument();
    expect(screen.getByText('MFA disabled')).toBeInTheDocument();
    expect(screen.getByText('Never')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-user-mail')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('admin-user-pending-mail')
    ).not.toBeInTheDocument();
  });
});
