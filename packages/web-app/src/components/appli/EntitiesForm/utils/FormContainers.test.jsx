import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { FormActionRow } from './FormContainers';

const messages = {
  Create: 'Create',
  Update: 'Update',
  Cancel: 'Cancel',
  offlineActionUnavailable: 'Unavailable offline'
};

const setOnLine = value => {
  Object.defineProperty(window.navigator, 'onLine', {
    value,
    configurable: true
  });
};

const renderRow = (props = {}) =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <FormActionRow
        isNew
        isSubmitting={false}
        onCancel={() => {}}
        {...props}
      />
    </IntlProvider>
  );

describe('FormActionRow', () => {
  beforeEach(() => setOnLine(true));

  it('allows submitting while online', () => {
    renderRow();
    expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled();
  });

  // Losing the connection mid-typing must block the save rather than let it
  // fail: the API write cannot succeed and the draft would be lost.
  it('disables the submit while offline', () => {
    setOnLine(false);
    renderRow();
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  // Cancel only discards local form state, so it must never be taken away —
  // otherwise an offline user is trapped in the form.
  it('keeps Cancel usable while offline', () => {
    setOnLine(false);
    renderRow();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
  });

  it('still honours its own disabled prop while online', () => {
    renderRow({ disabled: true });
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  describe.each([
    { layout: 'mobile', isMobile: true, labels: ['Create', 'Cancel'] },
    { layout: 'desktop', isMobile: false, labels: ['Cancel', 'Create'] }
  ])('$layout keyboard navigation', ({ isMobile, labels }) => {
    beforeEach(() => {
      vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
        matches: isMobile,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }));
    });

    afterEach(() => vi.restoreAllMocks());

    it('tabs through the actions in visual order and back', async () => {
      const user = userEvent.setup();
      renderRow();

      expect(
        screen.getAllByRole('button').map(button => button.textContent)
      ).toEqual(labels);
      await user.tab();
      expect(screen.getByRole('button', { name: labels[0] })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole('button', { name: labels[1] })).toHaveFocus();
      await user.tab({ shift: true });
      expect(screen.getByRole('button', { name: labels[0] })).toHaveFocus();
    });

    it('skips the unavailable submit and keeps Cancel reachable offline', async () => {
      const user = userEvent.setup();
      setOnLine(false);
      renderRow();

      await user.tab();
      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
      expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
    });
  });
});
