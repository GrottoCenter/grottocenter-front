import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import SensitiveCaveWarning from './SensitiveCaveWarning';

const lockLabel =
  'The sensitivity of this entrance is locked by an administrator.';

const messages = {
  'Sensitive entrance': 'Sensitive entrance',
  'This entrance requires special protection measures. We do not communicate its precise location on Grottocenter.':
    'This entrance requires special protection measures. We do not communicate its precise location on Grottocenter.',
  [lockLabel]: lockLabel
};

const renderWarning = props =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <SensitiveCaveWarning {...props} />
    </IntlProvider>
  );

describe('SensitiveCaveWarning', () => {
  it('shows no lock indicator on an unlocked entrance', () => {
    renderWarning({});

    expect(
      screen.queryByRole('img', { name: lockLabel })
    ).not.toBeInTheDocument();
  });

  it('names the lock indicator for assistive technologies', () => {
    renderWarning({ isLocked: true });

    // A bare MUI SvgIcon is rendered aria-hidden, so the name has to come
    // from the wrapper for the indicator to exist in the a11y tree at all.
    expect(screen.getByRole('img', { name: lockLabel })).toBeInTheDocument();
  });

  it('puts the lock indicator in the keyboard tab order', async () => {
    renderWarning({ isLocked: true });

    await userEvent.tab();

    // Being focusable is what makes the tooltip reachable without a pointer.
    // That the tooltip then opens is MUI's own behaviour and can't be asserted
    // here: it gates on :focus-visible, which jsdom does not implement.
    expect(screen.getByRole('img', { name: lockLabel })).toHaveFocus();
  });
});
