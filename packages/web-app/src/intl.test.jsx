import { render, screen } from '@testing-library/react';
import { FormattedMessage, IntlProvider, useIntl } from 'react-intl';

import englishMessages from '../public/lang/en.json';
import frenchMessages from '../public/lang/fr.json';

const LocalizedFormats = () => {
  const { formatDate, formatNumber } = useIntl();

  return (
    <>
      <output data-testid="localized-number">{formatNumber(1234.5)}</output>
      <output data-testid="localized-date">
        {formatDate('2026-10-07T12:00:00Z', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC'
        })}
      </output>
    </>
  );
};

describe('React Intl migration contracts', () => {
  it('updates translations and ICU plurals when switching catalogues', () => {
    const { rerender } = render(
      <IntlProvider locale="en" messages={englishMessages}>
        <FormattedMessage id="results_count" values={{ count: 1 }} />
      </IntlProvider>
    );

    expect(screen.getByText('1 result')).toBeInTheDocument();

    rerender(
      <IntlProvider locale="fr" messages={frenchMessages}>
        <FormattedMessage id="results_count" values={{ count: 3 }} />
      </IntlProvider>
    );

    expect(screen.getByText('3 résultats')).toBeInTheDocument();

    rerender(
      <IntlProvider locale="en" messages={englishMessages}>
        <FormattedMessage id="results_count" values={{ count: 0 }} />
      </IntlProvider>
    );

    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('preserves React links inside translated plural messages', () => {
    render(
      <IntlProvider locale="en" messages={englishMessages}>
        <FormattedMessage
          id="This entrance belongs to the network {networkLink} of {count, plural, one {# entrance} other {# entrances}}."
          values={{
            count: 2,
            networkLink: <a href="/ui/caves/42">Test network</a>
          }}
        />
      </IntlProvider>
    );

    expect(screen.getByRole('link', { name: 'Test network' })).toHaveAttribute(
      'href',
      '/ui/caves/42'
    );
    expect(screen.getByText(/of 2 entrances/)).toBeInTheDocument();
  });

  it('updates hook-based date and number formats with the locale', () => {
    const { rerender } = render(
      <IntlProvider locale="en" messages={englishMessages}>
        <LocalizedFormats />
      </IntlProvider>
    );

    expect(screen.getByTestId('localized-number')).toHaveTextContent('1,234.5');
    expect(screen.getByTestId('localized-date')).toHaveTextContent(
      'October 7, 2026'
    );

    rerender(
      <IntlProvider locale="fr" messages={frenchMessages}>
        <LocalizedFormats />
      </IntlProvider>
    );

    expect(screen.getByTestId('localized-number')).toHaveTextContent('1 234,5');
    expect(screen.getByTestId('localized-date')).toHaveTextContent(
      '7 octobre 2026'
    );
  });

  it('renders rich-text tags through React callbacks', () => {
    render(
      <IntlProvider
        locale="en"
        messages={{ 'migration.rich-text': 'Explore <strong>{name}</strong>' }}>
        <FormattedMessage
          id="migration.rich-text"
          values={{
            name: 'Grottocenter',
            strong: chunks => <strong>{chunks}</strong>
          }}
        />
      </IntlProvider>
    );

    expect(screen.getByText('Grottocenter').tagName).toBe('STRONG');
    expect(screen.getByText(/Explore/)).toHaveTextContent(
      'Explore Grottocenter'
    );
  });

  it('keeps default-message and message-id fallbacks for missing translations', () => {
    const onError = vi.fn();
    render(
      <IntlProvider locale="fr" messages={frenchMessages} onError={onError}>
        <FormattedMessage
          id="migration.missing-message"
          defaultMessage="Fallback for {name}"
          values={{ name: 'Grottocenter' }}
        />
        <FormattedMessage id="migration.missing-id" />
      </IntlProvider>
    );

    expect(screen.getByText(/Fallback for Grottocenter/)).toBeInTheDocument();
    expect(screen.getByText(/migration.missing-id/)).toBeInTheDocument();
    expect(onError.mock.calls.map(([error]) => error.code)).toEqual([
      'MISSING_TRANSLATION',
      'MISSING_TRANSLATION'
    ]);
  });
});
