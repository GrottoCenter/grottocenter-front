import { useState } from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { Button } from '@mui/material';
import StandardDialog from './index';
import ConfirmationDialog from '../ConfirmationDialog';
import ResponsiveActionRow from '../ResponsiveActionRow';

const messages = { close: 'close', Cancel: 'Cancel' };
const withIntl = children => (
  <IntlProvider locale="en" messages={messages}>
    {children}
  </IntlProvider>
);

const mockMobile = isMobile =>
  vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
    matches: isMobile,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));

it('associates its heading and description without requiring manual title IDs', () => {
  render(
    withIntl(
      <ConfirmationDialog
        open
        title="Remove the link"
        confirmLabel="Unlink"
        onClose={vi.fn()}
        onConfirm={vi.fn()}>
        This does not delete the entrance.
      </ConfirmationDialog>
    )
  );
  const dialog = screen.getByRole('dialog', { name: 'Remove the link' });
  expect(dialog).toHaveAccessibleDescription(
    'This does not delete the entrance.'
  );
  expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
    'Remove the link'
  );
  expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
});

it('uses one close policy for the cross, Escape and backdrop', () => {
  const onClose = vi.fn();
  const content = isBusy =>
    withIntl(
      <StandardDialog open title="Edit" onClose={onClose} isBusy={isBusy}>
        Content
      </StandardDialog>
    );
  const { rerender } = render(content(false));
  const container = document.querySelector('.MuiDialog-container');
  fireEvent.click(screen.getByRole('button', { name: 'close' }));
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  fireEvent.mouseDown(container);
  fireEvent.click(container);
  expect(onClose.mock.calls.map(([_event, reason]) => reason)).toEqual([
    'closeButtonClick',
    'escapeKeyDown',
    'backdropClick'
  ]);

  onClose.mockClear();
  rerender(content(true));
  expect(screen.getByRole('button', { name: 'close' })).toBeDisabled();
  expect(screen.getByRole('dialog')).toHaveAttribute('aria-busy', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'close' }));
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  fireEvent.mouseDown(container);
  fireEvent.click(container);
  expect(onClose).not.toHaveBeenCalled();
});

it('does not show a dead close control in a non-dismissible dialog', () => {
  render(
    withIntl(
      <StandardDialog open title="Submitting">
        Please wait
      </StandardDialog>
    )
  );
  expect(screen.queryByRole('button', { name: 'close' })).toBeNull();
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(screen.getByRole('dialog')).toBeVisible();
});

it('retains the paper form and transition callback contracts', async () => {
  const onSubmit = vi.fn(event => event.preventDefault());
  const onEntered = vi.fn();
  render(
    withIntl(
      <StandardDialog
        open
        title="Create"
        disableAutoFocus
        disableRestoreFocus
        slotProps={{
          paper: { component: 'form', onSubmit },
          transition: { onEntered }
        }}>
        <Button type="submit">Create</Button>
      </StandardDialog>
    )
  );
  expect(screen.getByRole('dialog').tagName).toBe('FORM');
  fireEvent.submit(screen.getByRole('dialog'));
  expect(onSubmit).toHaveBeenCalledOnce();
  await waitFor(() => expect(onEntered).toHaveBeenCalledOnce());
});

[false, true].forEach(isMobile => {
  it(`keeps confirmation DOM and keyboard order consistent on ${isMobile ? 'mobile' : 'desktop'}`, async () => {
    mockMobile(isMobile);
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      withIntl(
        <ConfirmationDialog
          open
          title="Remove"
          color="error"
          confirmLabel="Delete"
          onClose={vi.fn()}
          onConfirm={onConfirm}>
          This is permanent.
        </ConfirmationDialog>
      )
    );
    const buttons = within(
      document.querySelector('.MuiDialogActions-root')
    ).getAllByRole('button');
    expect(buttons.map(button => button.textContent)).toEqual(
      isMobile ? ['Delete', 'Cancel'] : ['Cancel', 'Delete']
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    if (isMobile) await user.tab({ shift: true });
    else await user.tab();
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});

it('reorders sibling fragments without duplicate keys or wrapper elements', () => {
  mockMobile(true);
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  render(
    <ResponsiveActionRow>
      <>
        <Button>Back</Button>
        <Button>Cancel</Button>
      </>
      <>
        <Button>Retry</Button>
        <Button>Save</Button>
      </>
    </ResponsiveActionRow>
  );
  expect(
    screen.getAllByRole('button').map(button => button.textContent)
  ).toEqual(['Save', 'Retry', 'Cancel', 'Back']);
  expect(error).not.toHaveBeenCalled();
});

it('resizes with the keyboard viewport and removes its event listeners', () => {
  const viewport = new EventTarget();
  viewport.height = 700;
  viewport.offsetTop = 0;
  const remove = vi.spyOn(viewport, 'removeEventListener');
  vi.stubGlobal('visualViewport', viewport);
  const { rerender, unmount } = render(
    withIntl(
      <StandardDialog open title="Edit">
        Content
      </StandardDialog>
    )
  );
  const root = document.querySelector('.MuiDialog-root');
  expect(root.style.getPropertyValue('--dialog-viewport-height')).toBe('700px');
  act(() => {
    viewport.height = 320;
    viewport.offsetTop = 80;
    viewport.dispatchEvent(new Event('resize'));
  });
  expect(root.style.getPropertyValue('--dialog-viewport-height')).toBe('320px');
  expect(root.style.getPropertyValue('--dialog-viewport-top')).toBe('80px');
  rerender(withIntl(<StandardDialog open={false} title="Edit" />));
  expect(remove.mock.calls.map(([type]) => type)).toEqual(['resize', 'scroll']);
  unmount();
  vi.unstubAllGlobals();
});

it('restores focus to the parent action when a nested confirmation closes', async () => {
  const NestedDialogs = () => {
    const [isConfirming, setIsConfirming] = useState(false);
    return (
      <StandardDialog open title="Parent">
        <Button onClick={() => setIsConfirming(true)}>Remove link</Button>
        <ConfirmationDialog
          open={isConfirming}
          title="Confirm removal"
          confirmLabel="Remove"
          onClose={() => setIsConfirming(false)}
          onConfirm={vi.fn()}>
          Remove only this link.
        </ConfirmationDialog>
      </StandardDialog>
    );
  };
  const user = userEvent.setup();
  render(withIntl(<NestedDialogs />));
  const opener = screen.getByRole('button', { name: 'Remove link' });
  await user.click(opener);
  const child = screen.getByRole('dialog', { name: 'Confirm removal' });
  await user.click(within(child).getByRole('button', { name: 'Cancel' }));
  await waitFor(() => expect(child).not.toBeInTheDocument());
  expect(opener).toHaveFocus();
});
