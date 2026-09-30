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
    renderSummary([{ aestheticism: 0, isDeleted: false }], true, 'fr');

    expect(screen.getByText('Non évalué')).toBeInTheDocument();
    const commentLink = screen.getByRole('link', {
      name: 'Commenter et évaluer'
    });
    expect(commentLink).toHaveAttribute(
      'href',
      '/ui/entrances/42?tab=comments'
    );
    expect(
      commentLink.querySelector('[data-testid="AddCircleIcon"]')
    ).toBeInTheDocument();
  });

  it('shows a compact rating in French', () => {
    renderSummary([{ aestheticism: 6, isDeleted: false }], false, 'fr');

    expect(screen.getByText('3/5')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '1 évaluation' })).toBeVisible();
  });

  it('shows the range of reported times, excluding deleted comments', () => {
    renderSummary(
      [
        {
          aestheticism: 6,
          eTTrail: '0:30:00',
          eTUnderground: '2:00:00'
        },
        {
          aestheticism: null,
          eTTrail: '0:15:00',
          eTUnderground: '1:30:00'
        },
        {
          isDeleted: true,
          eTTrail: '0:05:00',
          eTUnderground: '5:00:00'
        }
      ],
      false,
      'fr'
    );

    expect(screen.getByText("Temps d'accès")).toBeVisible();
    expect(screen.getByText('15-30min')).toBeVisible();
    expect(screen.getByText('Temps passé sous terre')).toBeVisible();
    expect(screen.getByText('1h30-2h')).toBeVisible();
    expect(screen.getByRole('link', { name: '1 évaluation' })).toBeVisible();
  });

  it('shows a single time without a range and hides absent times', () => {
    renderSummary([
      { eTTrail: '0:00:00', eTUnderground: '1:05:00' },
      { eTTrail: null, eTUnderground: 'invalid' }
    ]);

    expect(screen.getByText('1h05')).toBeVisible();
    expect(screen.queryByText('Time to go')).not.toBeInTheDocument();
    expect(screen.getByText('Not rated')).toBeVisible();
  });
});
