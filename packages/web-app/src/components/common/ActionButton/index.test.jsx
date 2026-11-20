import { fireEvent, render, screen, within } from '@testing-library/react';
import SaveIcon from '@mui/icons-material/Save';
import ActionButton from './index';

it('announces loading without losing the label or accepting another click', () => {
  const onClick = vi.fn();
  const content = loading => (
    <ActionButton
      label="Save"
      loading={loading}
      disabled={false}
      icon={<SaveIcon data-testid="save-icon" />}
      onClick={onClick}
    />
  );
  const { rerender } = render(content(false));
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(onClick).toHaveBeenCalledOnce();

  rerender(content(true));
  const button = screen.getByRole('button', { name: 'Save' });
  expect(button).toBeDisabled();
  expect(within(button).getByText('Save')).toBeVisible();
  expect(within(button).getByRole('progressbar')).toHaveAccessibleName('Save');
  fireEvent.click(button);
  expect(onClick).toHaveBeenCalledOnce();

  rerender(content(false));
  expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  expect(screen.getByTestId('save-icon')).toBeVisible();
  expect(screen.queryByRole('progressbar')).toBeNull();
});

it('keeps icon-only actions named while loading', () => {
  render(
    <ActionButton
      label="Save"
      shouldHideLabelOnMobile
      icon={<SaveIcon />}
      loading
    />
  );
  const button = screen.getByRole('button', { name: 'Save' });
  expect(button).toBeDisabled();
  expect(within(button).getByRole('progressbar')).toHaveAccessibleName('Save');
});
