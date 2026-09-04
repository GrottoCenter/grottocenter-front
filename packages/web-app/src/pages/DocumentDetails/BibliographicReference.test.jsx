import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import renderWithProviders from '@/test/renderWithProviders';
import { DocumentTypes } from '@/utils/documentTypeHelpers';
import BibliographicReference from './BibliographicReference';

const clipboard = vi.hoisted(() => ({
  copy: () => Promise.resolve(),
  values: []
}));

vi.mock('@/utils/clipboard', () => ({
  default: value => clipboard.copy(value)
}));

const messages = {
  'Available at:': 'Disponible à l’adresse :',
  'Copy reference': 'Copy reference',
  online: 'en ligne',
  'Reference copied': 'Reference copied',
  'Unable to copy reference': 'Unable to copy reference'
};

const reference = 'DUPONT, 2022. Underground rivers. Speleology Review.';
const document = {
  id: 1,
  type: DocumentTypes.ARTICLE,
  title: 'Underground rivers',
  datePublication: '2022',
  authors: [{ id: 1, nickname: 'DUPONT' }],
  authorsOrganization: [],
  parent: {
    id: 2,
    type: DocumentTypes.ISSUE,
    parent: {
      id: 3,
      type: DocumentTypes.COLLECTION,
      title: 'Speleology Review'
    }
  }
};

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
    renderWithProviders(<BibliographicReference document={document} />, {
      messages
    });

    const referenceText = screen.getByText('DUPONT, 2022.', { exact: false });
    const copyButton = screen.getByRole('button', { name: 'Copy reference' });
    expect(referenceText.parentElement).toContainElement(copyButton);
    expect(
      [...referenceText.querySelectorAll('cite')].map(
        title => title.textContent
      )
    ).toEqual(['Underground rivers', 'Speleology Review']);
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
    renderWithProviders(<BibliographicReference document={document} />, {
      messages
    });

    fireEvent.click(screen.getByRole('button', { name: 'Copy reference' }));

    expect(
      await screen.findByRole('button', { name: 'Unable to copy reference' })
    ).toBeVisible();
    expect(screen.getByText('DUPONT, 2022.', { exact: false })).toBeVisible();
  });

  it('localizes online references in the display and clipboard value', async () => {
    const user = userEvent.setup();
    const onlineDocument = {
      id: 2,
      type: DocumentTypes.BOOK,
      title: 'Karst atlas',
      datePublication: '1998',
      authors: [],
      authorsOrganization: [],
      identifier: 'https://example.org/karst-atlas',
      identifierType: 'url'
    };
    renderWithProviders(<BibliographicReference document={onlineDocument} />, {
      messages
    });

    expect(screen.getByText('Karst atlas').parentElement).toHaveTextContent(
      'Karst atlas [en ligne]'
    );
    await user.click(screen.getByRole('button', { name: 'Copy reference' }));

    expect(clipboard.values).toEqual([
      'Karst atlas [en ligne]. 1998. Disponible à l’adresse : https://example.org/karst-atlas.'
    ]);
  });
});
