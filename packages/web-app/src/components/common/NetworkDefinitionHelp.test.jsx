import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import messages from '@/../public/lang/fr.json';

import NetworkDefinitionHelp from './NetworkDefinitionHelp';

it('opens a named help dialog from the keyboard without submitting the form and restores focus', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn(event => event.preventDefault());
  render(
    <IntlProvider locale="fr" messages={messages}>
      <form onSubmit={onSubmit}>
        <NetworkDefinitionHelp />
      </form>
    </IntlProvider>
  );

  const trigger = screen.getByRole('button', {
    name: messages['network.definition.title']
  });
  await user.tab();
  expect(trigger).toHaveFocus();
  await user.keyboard('{Enter}');

  const dialog = await screen.findByRole('dialog', {
    name: messages['network.definition.title']
  });
  expect(trigger).toHaveAttribute('aria-expanded', 'true');
  expect(within(dialog).getByText('au moins deux entrées').tagName).toBe(
    'STRONG'
  );
  expect(
    within(dialog).getByText('établie par une exploration humaine').tagName
  ).toBe('STRONG');
  expect(onSubmit).not.toHaveBeenCalled();

  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(trigger).toHaveFocus();
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
});
