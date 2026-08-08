import { act, render, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { SnackbarProvider } from 'notistack';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import SessionExpiryNotifier from './SessionExpiryNotifier';

const WARNING = 'Your session expires in less than 24 hours.';
const messages = { mfaSessionExpiryWarning: WARNING, Close: 'Close' };

const USER_ID = 42;
const SET_LOGIN = 'SET_LOGIN';

const loginState = ({ hoursLeft, isAdmin = true }) => ({
  authTokenDecoded: {
    id: USER_ID,
    exp: Math.floor(Date.now() / 1000) + hoursLeft * 3600,
    groups: [{ name: isAdmin ? 'Administrator' : 'User' }]
  }
});

// notistack renders each message into a #notistack-snackbar div that also
// holds the variant icon, so match on textContent rather than on a leaf node.
const countTexts = (container, text) =>
  Array.from(container.querySelectorAll('#notistack-snackbar')).filter(
    node => node.textContent.trim() === text
  ).length;

const reducer = (state, action) =>
  action.type === SET_LOGIN ? { login: action.payload } : state;

const renderNotifier = login => {
  const store = createStore(reducer, { login });
  const utils = render(
    <Provider store={store}>
      <IntlProvider locale="en" messages={messages}>
        <SnackbarProvider>
          <SessionExpiryNotifier />
        </SnackbarProvider>
      </IntlProvider>
    </Provider>
  );
  return { ...utils, store };
};

describe('SessionExpiryNotifier', () => {
  beforeEach(() => sessionStorage.clear());

  it('says nothing while the session has more than 24h left', () => {
    const { baseElement } = renderNotifier(loginState({ hoursLeft: 48 }));
    expect(countTexts(baseElement, WARNING)).toBe(0);
  });

  it('warns an admin whose session expires in less than 24h', () => {
    const { baseElement } = renderNotifier(loginState({ hoursLeft: 3 }));
    expect(countTexts(baseElement, WARNING)).toBe(1);
  });

  it('says nothing to a non-admin', () => {
    const { baseElement } = renderNotifier(
      loginState({ hoursLeft: 3, isAdmin: false })
    );
    expect(countTexts(baseElement, WARNING)).toBe(0);
  });

  it('does not warn again once dismissed in this session', () => {
    sessionStorage.setItem(`mfaExpiryBannerDismissed_${USER_ID}`, 'true');
    const { baseElement } = renderNotifier(loginState({ hoursLeft: 3 }));
    expect(countTexts(baseElement, WARNING)).toBe(0);
  });

  // The regression this component exists to avoid: the message asks the admin
  // to log out, so it must not survive them doing exactly that.
  it('closes the warning when the session goes away', async () => {
    const { baseElement, store } = renderNotifier(loginState({ hoursLeft: 3 }));
    expect(countTexts(baseElement, WARNING)).toBe(1);

    act(() => {
      store.dispatch({ type: SET_LOGIN, payload: { authTokenDecoded: null } });
    });

    await waitFor(() => expect(countTexts(baseElement, WARNING)).toBe(0));
  });
});
