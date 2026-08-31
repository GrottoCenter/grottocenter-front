import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import renderWithProviders from '@/test/renderWithProviders';
import BibliographicReference from './BibliographicReference';

const clipboard = vi.hoisted(() => ({
  copy: () => Promise.resolve(),
  values: []
}));

vi.mock('@/utils/clipboard', () => ({
  default: value => clipboard.copy(value)
}));

const messages = {
  'Copy reference': 'Copy reference',
  'Reference copied': 'Reference copied',
  'Unable to copy reference': 'Unable to copy reference'
};

const reference = 'DUPONT, 2022. Underground rivers. Speleology Review.';

describe('BibliographicReference', () => {
  beforeEach(() => {
    clipboard.values = [];
    clipboard.copy = value => {
      clipboard.values.push(value);
      return Promise.resolve();
    };
  });

  it('copies the formatted reference and confirms success', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BibliographicReference reference={reference} />, {
      messages
    });

    const referenceText = screen.getByText(reference);
    const copyButton = screen.getByRole('button', { name: 'Copy reference' });
    expect(referenceText.parentElement).toContainElement(copyButton);
    await user.click(copyButton);

    expect(clipboard.values).toEqual([reference]);
    expect(
      screen.getByRole('button', { name: 'Reference copied' })
    ).toBeVisible();
  });

  it('reports a clipboard failure without losing the reference', async () => {
    clipboard.copy = value => {
      clipboard.values.push(value);
      return Promise.reject(new Error('Clipboard unavailable'));
    };
    renderWithProviders(<BibliographicReference reference={reference} />, {
      messages
    });

    fireEvent.click(screen.getByRole('button', { name: 'Copy reference' }));

    expect(
      await screen.findByRole('button', { name: 'Unable to copy reference' })
    ).toBeVisible();
    expect(screen.getByText(reference)).toBeVisible();
  });
});
