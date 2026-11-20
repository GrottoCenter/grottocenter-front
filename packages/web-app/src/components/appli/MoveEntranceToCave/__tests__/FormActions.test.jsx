import { fireEvent, screen } from '@testing-library/react';
import { useMediaQuery } from '@mui/material';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import FormActions from '../FormActions';

vi.mock('@mui/material', async importOriginal => ({
  ...(await importOriginal()),
  useMediaQuery: vi.fn()
}));

it.each([true, false])(
  'keeps keyboard order aligned with the responsive confirmation layout (mobile: %s)',
  isMobile => {
    useMediaQuery.mockReturnValue(isMobile);
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(
      <FormActions
        confirmLabel="Attach the entrance"
        onConfirm={onConfirm}
        onCancel={onCancel}
        confirmTooltip="Confirm the attachment"
      />,
      { messages }
    );
    expect(
      screen.getAllByRole('button').map(button => button.textContent)
    ).toEqual(
      isMobile
        ? ['Attach the entrance', 'Cancel']
        : ['Cancel', 'Attach the entrance']
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Attach the entrance' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  }
);

it('keeps both actions disabled and the confirmation pending during the mutation', () => {
  useMediaQuery.mockReturnValue(false);
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <FormActions
      confirmLabel="Attach the entrance"
      onConfirm={onConfirm}
      onCancel={onCancel}
      loading
    />,
    { messages }
  );
  const confirm = screen.getByRole('button', { name: 'Attach the entrance' });
  expect(confirm).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  expect(screen.getByRole('progressbar')).toBeVisible();
  fireEvent.click(confirm);
  expect(onConfirm).not.toHaveBeenCalled();
});
