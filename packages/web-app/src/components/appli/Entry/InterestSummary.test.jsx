import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import messages from '../../../../public/lang/en.json';
import frMessages from '../../../../public/lang/fr.json';
import InterestSummary from './InterestSummary';

const renderSummary = (comments, canComment = false, locale = 'en') =>
  render(
    <MemoryRouter>
      <IntlProvider
        locale={locale}
        messages={locale === 'fr' ? frMessages : messages}>
        <InterestSummary
          entranceId={42}
          comments={comments}
          canComment={canComment}
        />
      </IntlProvider>
    </MemoryRouter>
  );

describe('InterestSummary', () => {
  it('counts rated active comments and ignores deleted or unrated comments', () => {
    renderSummary([
      { aestheticism: 7, isDeleted: false },
      { aestheticism: 8, isDeleted: false },
      { aestheticism: null, isDeleted: false },
      { aestheticism: 10, isDeleted: true }
    ]);

    expect(
      screen.getByRole('heading', { name: 'Interest of the visit' })
    ).toBeInTheDocument();
    expect(screen.getByText('3.8/5')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '2 ratings' })).toHaveAttribute(
      'href',
      '/ui/entrances/42?tab=comments'
    );
  });

  it('shows an unrated state with a comment link for signed-in users', () => {
    renderSummary([{ aestheticism: 0, isDeleted: false }], true);

    expect(screen.getByText('Interest not rated yet')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Add a new comment' })
    ).toBeInTheDocument();
  });

  it('shows a compact rating in French', () => {
    renderSummary([{ aestheticism: 6, isDeleted: false }], false, 'fr');

    expect(screen.getByText('3/5')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '1 évaluation' })).toBeVisible();
  });
});
