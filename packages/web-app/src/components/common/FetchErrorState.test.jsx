import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import FetchErrorState from './FetchErrorState';

const messages = {
  offlineActionUnavailable: 'Unavailable offline',
  offlineContentUnavailable: 'This content has not been saved yet.',
  Retry: 'Retry',
  'entity-error': 'Error, the entrance data is not available.'
};

const setOnLine = value => {
  Object.defineProperty(window.navigator, 'onLine', {
    value,
    configurable: true
  });
};

const renderState = props =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <FetchErrorState messageId="entity-error" {...props} />
    </IntlProvider>
  );

describe('FetchErrorState', () => {
  beforeEach(() => setOnLine(true));

  describe('when the failure is a network one', () => {
    const networkError = new TypeError('Failed to fetch');

    it('shows the offline wording, not the entity error', () => {
      setOnLine(false);
      renderState({ error: networkError });

      expect(screen.getByText('Unavailable offline')).toBeInTheDocument();
      expect(
        screen.queryByText('Error, the entrance data is not available.')
      ).not.toBeInTheDocument();
    });

    it('uses the info severity — offline is not a failure', () => {
      setOnLine(false);
      renderState({ error: networkError });

      expect(screen.getByTestId('fetch-error-state')).toHaveClass(
        'MuiAlert-standardInfo'
      );
    });

    it('hides Retry while offline, since it could only fail', () => {
      setOnLine(false);
      renderState({ error: networkError, onRetry: vi.fn() });

      expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    });

    // "Failed to fetch" also covers an unreachable API while the browser is
    // perfectly online. Claiming the content "will load once you are back
    // online" would be wrong there — and Retry can genuinely work.
    it('keeps the entity error wording when the browser is still online', () => {
      renderState({ error: networkError, onRetry: vi.fn() });

      expect(
        screen.getByText('Error, the entrance data is not available.')
      ).toBeInTheDocument();
      expect(screen.queryByText('Unavailable offline')).not.toBeInTheDocument();
      expect(screen.getByTestId('fetch-error-state')).toHaveClass(
        'MuiAlert-standardError'
      );
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  describe('when the server answered with an error', () => {
    const serverError = { status: 500, message: 'Server error' };

    it('shows the entity-specific message with the error severity', () => {
      renderState({ error: serverError });

      expect(
        screen.getByText('Error, the entrance data is not available.')
      ).toBeInTheDocument();
      expect(screen.getByTestId('fetch-error-state')).toHaveClass(
        'MuiAlert-standardError'
      );
    });

    it('offers Retry and calls it back', () => {
      const onRetry = vi.fn();
      renderState({ error: serverError, onRetry });

      fireEvent.click(screen.getByText('Retry'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('omits Retry when no callback is given', () => {
      renderState({ error: serverError });
      expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    });
  });
});
