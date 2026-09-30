import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import useSearchFilter from '@/hooks/useSearchFilter';
import { normalizeRatingFilterState } from '@/utils/ratingFilter';
import messages from '../../../../public/lang/en.json';
import frenchMessages from '../../../../public/lang/fr.json';
import { ActiveFilterChips, countActiveFilters } from './SearchElements';
import SearchRatingSlider from './SearchRatingSlider';

const initialFilterState = { 'commentsRating.aestheticism': null };

const RatingFilterFixture = () => {
  const { filterState, updateFilter, handleRemoveFilter } =
    useSearchFilter(initialFilterState);
  return (
    <>
      <button
        type="button"
        onClick={() => updateFilter('commentsRating.aestheticism', [2, 10])}>
        Set rating filter
      </button>
      <SearchRatingSlider
        label="Interest of the visit"
        value={filterState['commentsRating.aestheticism']}
        onChange={value => updateFilter('commentsRating.aestheticism', value)}
      />
      <ActiveFilterChips
        filterState={filterState}
        query=""
        onClearQuery={() => {}}
        onRemoveFilter={handleRemoveFilter}
        labelMap={{ 'commentsRating.aestheticism': 'Interest of the visit' }}
      />
    </>
  );
};

const renderWithIntl = child =>
  render(
    <IntlProvider locale="en" messages={messages}>
      {child}
    </IntlProvider>
  );

describe('SearchRatingSlider', () => {
  it('clears a rating chip without crashing the controlled slider', () => {
    renderWithIntl(<RatingFilterFixture />);
    fireEvent.click(screen.getByRole('button', { name: 'Set rating filter' }));
    expect(screen.getByText('Interest of the visit: ≥ 1★')).toBeVisible();

    fireEvent.click(
      screen
        .getByRole('button', { name: 'Interest of the visit: ≥ 1★' })
        .querySelector('[data-testid="CancelIcon"]')
    );

    expect(
      screen.getByRole('slider', {
        name: 'Interest of the visit: Minimum rating'
      })
    ).toHaveAttribute('aria-valuetext', '0');
    expect(
      screen.queryByText('Interest of the visit: ≥ 1★')
    ).not.toBeInTheDocument();
  });

  it('does not count or display a restored full-range rating', () => {
    const filterState = { 'commentsRating.aestheticism': [0, 10] };
    expect(countActiveFilters(filterState)).toBe(0);
    expect(normalizeRatingFilterState(filterState)).toEqual({
      'commentsRating.aestheticism': null
    });

    renderWithIntl(
      <ActiveFilterChips
        filterState={filterState}
        query=""
        onClearQuery={() => {}}
        labelMap={{ 'commentsRating.aestheticism': 'Interest of the visit' }}
      />
    );
    expect(
      screen.queryByText(/Interest of the visit:/)
    ).not.toBeInTheDocument();
  });

  it('treats a legacy non-array value as an empty rating filter', () => {
    const onChange = vi.fn();
    renderWithIntl(
      <SearchRatingSlider
        label="Interest of the visit"
        value=""
        onChange={onChange}
      />
    );

    expect(
      screen.getByRole('slider', {
        name: 'Interest of the visit: Minimum rating'
      })
    ).toHaveAttribute('aria-valuetext', '0');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows stars and sends the existing 0–10 scale to the search', () => {
    const onChange = vi.fn();
    renderWithIntl(
      <SearchRatingSlider
        label="Interest of the visit"
        value={null}
        onChange={onChange}
      />
    );

    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    expect(screen.getByText('1★')).toBeInTheDocument();
    expect(screen.getByText('2★')).toBeInTheDocument();
    expect(screen.getByText('3★')).toBeInTheDocument();
    expect(screen.getByText('4★')).toBeInTheDocument();
    expect(screen.getAllByText('5★').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('slider', {
        name: 'Interest of the visit: Minimum rating'
      })
    ).toHaveAttribute('aria-valuetext', '0');
    expect(
      screen.getByRole('slider', {
        name: 'Interest of the visit: Maximum rating'
      })
    ).toHaveAttribute('aria-valuetext', '5★');

    fireEvent.keyDown(
      screen.getByRole('slider', {
        name: 'Interest of the visit: Minimum rating'
      }),
      { key: 'ArrowRight' }
    );
    expect(onChange).toHaveBeenCalledWith([2, 10]);
  });

  it('shows selected values on the slider and clears them', () => {
    const onChange = vi.fn();
    renderWithIntl(
      <SearchRatingSlider
        label="Interest of the visit"
        value={[6, 10]}
        onChange={onChange}
      />
    );

    expect(
      screen.getByRole('slider', {
        name: 'Interest of the visit: Minimum rating'
      })
    ).toHaveAttribute('aria-valuetext', '3★');
    fireEvent.click(
      screen.getByRole('button', {
        name: 'clear filter: Interest of the visit'
      })
    );
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('uses stars in the active filter chip too', () => {
    renderWithIntl(
      <ActiveFilterChips
        filterState={{ 'commentsRating.aestheticism': [6, 10] }}
        query=""
        onClearQuery={() => {}}
        labelMap={{ 'commentsRating.aestheticism': 'Interest of the visit' }}
      />
    );

    expect(screen.getByText('Interest of the visit: ≥ 3★')).toBeInTheDocument();
  });

  it('rounds an existing half-star filter to a whole star', () => {
    const onChange = vi.fn();
    render(
      <IntlProvider locale="fr" messages={frenchMessages}>
        <SearchRatingSlider
          label="Intérêt de la visite"
          value={[5, 10]}
          onChange={onChange}
        />
      </IntlProvider>
    );

    expect(
      screen.getByRole('slider', {
        name: 'Intérêt de la visite: Note minimale'
      })
    ).toHaveAttribute('aria-valuetext', '3★');
    expect(onChange).toHaveBeenCalledWith([6, 10]);
  });
});
