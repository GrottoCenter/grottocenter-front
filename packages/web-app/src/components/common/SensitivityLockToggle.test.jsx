import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import SensitivityLockToggle from './SensitivityLockToggle';

const messages = {
  'Lock sensitivity': 'Lock sensitivity',
  'Unlock sensitivity': 'Unlock sensitivity'
};

const renderToggle = props =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <SensitivityLockToggle onChange={vi.fn()} {...props} />
    </IntlProvider>
  );

describe('SensitivityLockToggle', () => {
  it('offers to lock when unlocked', () => {
    renderToggle({ isLocked: false });

    expect(
      screen.getByRole('button', { name: 'Lock sensitivity' })
    ).toBeInTheDocument();
  });

  it('offers to unlock when locked', () => {
    renderToggle({ isLocked: true });

    expect(
      screen.getByRole('button', { name: 'Unlock sensitivity' })
    ).toBeInTheDocument();
  });

  it('asks for the opposite lock state on click', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderToggle({ isLocked: false, onChange });

    await user.click(screen.getByRole('button', { name: 'Lock sensitivity' }));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('cannot be activated while an action is in progress', () => {
    const onChange = vi.fn();
    renderToggle({ isLocked: true, onChange, disabled: true });

    expect(
      screen.getByRole('button', { name: 'Unlock sensitivity' })
    ).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
