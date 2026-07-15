import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import ManageUsers from './ManageUsers';

// ---- Redux mock ----
const mockDispatch = vi.fn();
let mockStoreState = {};

vi.mock('react-redux', async () => ({
  ...(await vi.importActual('react-redux')),
  useDispatch: () => mockDispatch,
  useSelector: selector =>
    selector(mockStoreState)
}));

// ---- Action mocks ----
const mockFetchGroups = vi.fn(() => ({ type: 'FETCH_GROUPS' }));
const mockFetchBannedCavers = vi.fn(() => ({ type: 'FETCH_BANNED_CAVERS' }));
const mockFetchInvalidEmailCavers = vi.fn(() => ({
  type: 'FETCH_INVALID_EMAIL_CAVERS'
}));

vi.mock('../../actions/Person/GetPerson', () => ({
  fetchGroups: (...args) => mockFetchGroups(...args),
  fetchBannedCavers: (...args) => mockFetchBannedCavers(...args),
  fetchInvalidEmailCavers: (...args) => mockFetchInvalidEmailCavers(...args)
}));

// ---- Component mocks ----
vi.mock('../../components/appli/AuthChecker', () => {
  const MockAuthChecker = ({ componentToDisplay }) => (
    <div data-testid="auth-checker">{componentToDisplay}</div>
  );
  return { default: MockAuthChecker };
});

vi.mock('../../components/common/Layouts/Fixed/FixedContent', () => {
  const MockLayout = ({ title, content }) => (
    <div data-testid="layout">
      <h1>{title}</h1>
      {content}
    </div>
  );
  return { default: MockLayout };
});

vi.mock('./ManageUserGroups', () => {
  const MockManageUserGroups = () => (
    <div data-testid="manage-user-groups">ManageUserGroups</div>
  );
  return { default: MockManageUserGroups };
});

vi.mock('../../components/common/EntityTable', () => {
  const MockEntityTable = ({ isLoading, pageRows }) => (
    <div data-testid="entity-table">
      {isLoading ? 'Loading...' : `${pageRows.length} rows`}
    </div>
  );
  return { default: MockEntityTable };
});

const messages = {
  'Manage Users': 'Manage Users',
  'List of administrators': 'List of administrators',
  'List of moderators': 'List of moderators',
  'List of leaders': 'List of leaders',
  'List of banned cavers': 'List of banned cavers',
  'List of cavers with invalid email': 'List of cavers with invalid email'
};

const defaultState = {
  groups: {
    administrators: [],
    moderators: [],
    leaders: [],
    isLoading: false
  },
  bannedCavers: {
    bannedCavers: [],
    isLoading: false
  },
  invalidEmailCavers: {
    invalidEmailCavers: [],
    isLoading: false
  },
  updatePersonGroups: {
    isLoading: false,
    isSuccess: false
  },
  banCaver: {
    isLoading: false,
    isSuccess: false
  }
};

const renderManageUsers = (stateOverrides = {}) => {
  mockStoreState = { ...defaultState, ...stateOverrides };
  return render(
    <IntlProvider locale="en" messages={messages}>
      <ManageUsers />
    </IntlProvider>
  );
};

beforeEach(() => {
  mockDispatch.mockClear();
  mockFetchGroups.mockClear();
  mockFetchBannedCavers.mockClear();
  mockFetchInvalidEmailCavers.mockClear();
});

describe('ManageUsers - invalid email cavers integration', () => {
  it('renders the invalid email cavers UserList section', () => {
    renderManageUsers();

    expect(
      screen.getByText('List of cavers with invalid email')
    ).toBeInTheDocument();
  });

  it('dispatches fetchInvalidEmailCavers on mount', () => {
    renderManageUsers();

    // fetchInvalidEmailCavers action creator is called once on mount
    expect(mockFetchInvalidEmailCavers).toHaveBeenCalledTimes(1);
    // dispatch is called with the result of fetchInvalidEmailCavers()
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('renders the invalid email section after the banned cavers section', () => {
    renderManageUsers();

    const bannedTitle = screen.getByText('List of banned cavers');
    const invalidEmailTitle = screen.getByText(
      'List of cavers with invalid email'
    );

    // Verify ordering: banned cavers should appear before invalid email cavers
    const result = bannedTitle.compareDocumentPosition(invalidEmailTitle);
    // eslint-disable-next-line no-bitwise
    expect(result & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('dispatches fetchGroups and fetchBannedCavers alongside fetchInvalidEmailCavers on mount', () => {
    renderManageUsers();

    expect(mockFetchGroups).toHaveBeenCalledTimes(1);
    expect(mockFetchBannedCavers).toHaveBeenCalledTimes(1);
    expect(mockFetchInvalidEmailCavers).toHaveBeenCalledTimes(1);
  });
});
