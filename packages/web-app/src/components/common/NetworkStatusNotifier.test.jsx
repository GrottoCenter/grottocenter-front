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

// SnackbarProvider INSIDE IntlProvider, mirroring ApplicationShell: notistack
// renders snackbar content in its own subtree, so a <FormattedMessage> node
// handed to enqueueSnackbar only resolves if the provider sits below the intl
// context. `onError` is a no-op like the app's customOnIntlError, so the
// deliberately message-less render below stays quiet.
const tree = (locale, msgs) => (
  <IntlProvider locale={locale} messages={msgs} onError={() => {}}>
    <SnackbarProvider>
      <NetworkStatusNotifier />
    </SnackbarProvider>
  </IntlProvider>
);

// `locale` is what makes useIntl() hand out a fresh formatMessage identity,
// which is exactly what used to re-run the effect and re-announce a
// reconnection that never happened.
const renderNotifier = (locale = 'en', msgs = messages) =>
  render(tree(locale, msgs));

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
      rerender(tree('fr', messages));
    });

    expect(countTexts(baseElement, 'You are back online.')).toBe(1);
  });

  it('stays silent when the app simply starts offline', () => {
    setOnLine(false);
    const { baseElement } = renderNotifier();
    expect(countTexts(baseElement, 'You are back online.')).toBe(0);
  });

  // Launching already offline enqueues the offline snackbar before
  // bootstrapIntl has resolved /lang/*.json, so IntlProvider still has no
  // messages. The snackbar is persistent and keyed, so preventDuplicate makes
  // notistack DISCARD the re-enqueue that follows — the text can only come from
  // the intl context, never from a string captured at enqueue time. This used to
  // leave "offlineIndicator" on screen for the whole session (#1489 follow-up).
  it('translates the offline message when the catalogue lands after mount', () => {
    setOnLine(false);
    const { baseElement, rerender } = render(tree('en', undefined));
    expect(countTexts(baseElement, 'offlineIndicator')).toBe(1);

    act(() => {
      rerender(tree('en', messages));
    });

    expect(countTexts(baseElement, 'You are offline.')).toBe(1);
    expect(countTexts(baseElement, 'offlineIndicator')).toBe(0);
  });

  // Same mechanism, the other trigger: a locale change must reach a snackbar
  // that is already on screen and can never be re-enqueued.
  it('retranslates the offline message when the locale changes', () => {
    setOnLine(false);
    const { baseElement, rerender } = renderNotifier();
    expect(countTexts(baseElement, 'You are offline.')).toBe(1);

    act(() => {
      rerender(
        tree('fr', { ...messages, offlineIndicator: 'Vous êtes hors-ligne.' })
      );
    });

    expect(countTexts(baseElement, 'Vous êtes hors-ligne.')).toBe(1);
    expect(countTexts(baseElement, 'You are offline.')).toBe(0);
  });
});
