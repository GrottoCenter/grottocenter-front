import { act, render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { SnackbarProvider } from 'notistack';
import NetworkStatusNotifier from './NetworkStatusNotifier';

const messages = {
  offlineIndicator: 'You are offline.',
  backOnline: 'You are back online.',
  Close: 'Close'
};

const setOnLine = value => {
  Object.defineProperty(window.navigator, 'onLine', {
    value,
    configurable: true
  });
};

const goOffline = () => {
  act(() => {
    setOnLine(false);
    window.dispatchEvent(new Event('offline'));
  });
};

const goOnline = () => {
  act(() => {
    setOnLine(true);
    window.dispatchEvent(new Event('online'));
  });
};

// `locale` is what makes useIntl() hand out a fresh formatMessage identity,
// which is exactly what used to re-run the effect and re-announce a
// reconnection that never happened.
const renderNotifier = (locale = 'en') =>
  render(
    <IntlProvider locale={locale} messages={messages}>
      <SnackbarProvider>
        <NetworkStatusNotifier />
      </SnackbarProvider>
    </IntlProvider>
  );

// notistack renders each message into a #notistack-snackbar div that also
// holds the variant icon, so match on textContent rather than on a leaf node.
const countTexts = (container, text) =>
  Array.from(container.querySelectorAll('#notistack-snackbar')).filter(
    node => node.textContent.trim() === text
  ).length;

describe('NetworkStatusNotifier', () => {
  beforeEach(() => setOnLine(true));

  it('says nothing on mount while online', () => {
    const { baseElement } = renderNotifier();
    expect(countTexts(baseElement, 'You are back online.')).toBe(0);
    expect(countTexts(baseElement, 'You are offline.')).toBe(0);
  });

  it('announces the loss of connection', () => {
    const { baseElement } = renderNotifier();
    goOffline();
    expect(countTexts(baseElement, 'You are offline.')).toBe(1);
  });

  it('announces the reconnection once', () => {
    const { baseElement } = renderNotifier();
    goOffline();
    goOnline();
    expect(countTexts(baseElement, 'You are back online.')).toBe(1);
  });

  it('does not re-announce a reconnection when the locale changes', () => {
    const { baseElement, rerender } = renderNotifier();
    goOffline();
    goOnline();

    act(() => {
      rerender(
        <IntlProvider locale="fr" messages={messages}>
          <SnackbarProvider>
            <NetworkStatusNotifier />
          </SnackbarProvider>
        </IntlProvider>
      );
    });

    expect(countTexts(baseElement, 'You are back online.')).toBe(1);
  });

  it('stays silent when the app simply starts offline', () => {
    setOnLine(false);
    const { baseElement } = renderNotifier();
    expect(countTexts(baseElement, 'You are back online.')).toBe(0);
  });
});
