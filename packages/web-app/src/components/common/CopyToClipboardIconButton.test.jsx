import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import renderWithProviders from '@/test/renderWithProviders';
import CopyToClipboardIconButton from './CopyToClipboardIconButton';

const clipboard = vi.hoisted(() => ({
  copy: () => Promise.resolve(),
  values: []
}));

vi.mock('@/utils/clipboard', () => ({
  default: value => clipboard.copy(value)
}));

const props = {
  value: 'Text to copy',
  label: 'Copy text',
  successLabel: 'Text copied',
  errorLabel: 'Unable to copy text'
};

const renderButton = () =>
  renderWithProviders(
    <CopyToClipboardIconButton
      value={props.value}
      label={props.label}
      successLabel={props.successLabel}
      errorLabel={props.errorLabel}
    />
  );

const renderCompactButton = () =>
  renderWithProviders(
    <CopyToClipboardIconButton
      compact
      value={props.value}
      label={props.label}
      successLabel={props.successLabel}
      errorLabel={props.errorLabel}
    />
  );

describe('CopyToClipboardIconButton', () => {
  beforeEach(() => {
    clipboard.values = [];
    clipboard.copy = value => {
      clipboard.values.push(value);
      return Promise.resolve();
    };
  });

  it('copies the value and confirms success', async () => {
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole('button', { name: 'Copy text' }));

    expect(clipboard.values).toEqual(['Text to copy']);
    expect(screen.getByRole('button', { name: 'Text copied' })).toBeVisible();
    expect(screen.getByTestId('CheckIcon')).toHaveClass(
      'MuiSvgIcon-colorSuccess'
    );
  });

  it('exposes clipboard failures through the button state', async () => {
    clipboard.copy = () => Promise.reject(new Error('Clipboard unavailable'));
    renderButton();

    fireEvent.click(screen.getByRole('button', { name: 'Copy text' }));

    expect(
      await screen.findByRole('button', { name: 'Unable to copy text' })
    ).toBeVisible();
    expect(screen.getByTestId('ErrorOutlineIcon')).toHaveClass(
      'MuiSvgIcon-colorError'
    );
  });

  it('uses a line-height-safe size in compact mode', () => {
    renderCompactButton();

    expect(screen.getByRole('button', { name: 'Copy text' })).toHaveStyle({
      width: '20px',
      height: '20px',
      padding: 0
    });
  });
});
