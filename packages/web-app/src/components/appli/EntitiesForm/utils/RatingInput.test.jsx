import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import messages from '../../../../../public/lang/en.json';
import RatingInput from './RatingInput';

const levels = [
  'No interest',
  'Limited interest',
  'Interesting',
  'Remarkable',
  'Exceptional'
];

const RatingFixture = () => {
  const [value, setValue] = useState(null);
  return (
    <RatingInput
      labelId="Interest rating"
      descriptionIds={levels}
      value={value}
      onChange={setValue}
      valueMultiplier={2}
    />
  );
};

const renderRating = child =>
  render(
    <IntlProvider locale="en" messages={messages}>
      {child}
    </IntlProvider>
  );

describe('RatingInput', () => {
  it('previews a level on hover and restores the unselected state', () => {
    const { container } = renderRating(<RatingFixture />);
    const rating = container.querySelector('.MuiRating-root');
    vi.spyOn(rating, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      right: 100,
      width: 100
    });

    fireEvent.mouseMove(rating, { clientX: 50 });
    expect(screen.getByText('3 / 5 · Interesting')).toBeInTheDocument();

    fireEvent.mouseLeave(rating);
    expect(screen.getByText('No Rating')).toBeInTheDocument();
  });

  it('previews all five meanings on focus and keeps the selected meaning', () => {
    renderRating(<RatingFixture />);

    levels.forEach((label, index) => {
      const rating = index + 1;
      const radio = screen.getByRole('radio', {
        name: `${rating} out of 5 stars`
      });
      fireEvent.focus(radio);
      expect(screen.getByText(`${rating} / 5 · ${label}`)).toBeInTheDocument();
      fireEvent.click(radio);
      expect(screen.getByText(`${rating} / 5 · ${label}`)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByText('No Rating')).toBeInTheDocument();
  });

  it('describes a historical half-star rating without changing it', () => {
    renderRating(
      <RatingInput
        labelId="Interest rating"
        descriptionIds={levels}
        precision={0.5}
        value={9}
        onChange={() => {}}
        valueMultiplier={2}
      />
    );

    expect(
      screen.getByText('4.5 / 5 · Remarkable – Exceptional')
    ).toBeInTheDocument();
  });
});
