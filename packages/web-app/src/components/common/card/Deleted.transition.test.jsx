import {
  render,
  screen,
  fireEvent,
  waitForElementToBeRemoved
} from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import messages from '@/../public/lang/en.json';

import { DeleteConfirmationDialog, DELETED_ENTITIES } from './Deleted';

vi.mock('@/hooks', () => ({
  useOnlineStatus: () => true,
  useDebounce: value => value,
  useQuickSearch: () => ({
    data: { results: [] },
    error: null,
    isFetching: false
  })
}));

const renderDialog = isOpen => (
  <IntlProvider locale="en" messages={messages}>
    <DeleteConfirmationDialog
      entityType={DELETED_ENTITIES.guideline}
      entityId={42}
      entityName="Access restrictions"
      isOpen={isOpen}
      isLoading={false}
      isPermanent={false}
      onClose={() => {}}
      onConfirmation={() => {}}
    />
  </IntlProvider>
);

it('retains the real MUI dialog until its exit transition completes', async () => {
  const { rerender } = render(renderDialog(true));
  const dialog = screen.getByRole('dialog');
  rerender(renderDialog(false));

  expect(dialog).toBeInTheDocument();
  await waitForElementToBeRemoved(dialog);

  rerender(renderDialog(true));
  expect(screen.getByRole('dialog')).toHaveTextContent('Access restrictions');
});

it('prevents closing the real MUI dialog by cross, Escape or backdrop while pending', () => {
  const onClose = vi.fn();
  render(
    <IntlProvider locale="en" messages={messages}>
      <DeleteConfirmationDialog
        entityType={DELETED_ENTITIES.guideline}
        entityId={42}
        isOpen
        isLoading
        isPermanent={false}
        onClose={onClose}
        onConfirmation={vi.fn()}
      />
    </IntlProvider>
  );
  expect(screen.queryByRole('button', { name: 'close' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  fireEvent.keyDown(screen.getByRole('dialog'), {
    key: 'Escape',
    code: 'Escape'
  });
  fireEvent.click(document.querySelector('.MuiBackdrop-root'));
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByRole('dialog')).toBeVisible();
});
