import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import renderWithProviders from '@/test/renderWithProviders';
import { DocumentTypes } from '@/utils/documentTypeHelpers';
import DocumentReferences from './DocumentReferences';

const clipboard = vi.hoisted(() => ({
  values: []
}));

vi.mock('@/utils/clipboard', () => ({
  default: value => {
    clipboard.values.push(value);
    return Promise.resolve();
  }
}));

const messages = {
  'Available at:': 'Available at:',
  'Bibliographic references': 'Bibliographic references',
  'Copy reference': 'Copy reference',
  online: 'online',
  'Reference copied': 'Reference copied',
  'Show more': 'Show more',
  'Show less': 'Show less',
  'Unable to copy reference': 'Unable to copy reference'
};

const makeDocument = id => ({
  id,
  type: DocumentTypes.ARTICLE,
  datePublication: '2024',
  title: `Document ${id}`
});

const renderReferences = documents =>
  renderWithProviders(<DocumentReferences documents={documents} />, {
    messages
  });

describe('DocumentReferences', () => {
  beforeEach(() => {
    clipboard.values = [];
  });

  it('renders a formatted reference as plain text with a copy button', async () => {
    const user = userEvent.setup();
    renderReferences([
      {
        id: 42,
        type: DocumentTypes.ARTICLE,
        title: 'Underground rivers',
        authors: [
          {
            id: 1,
            nickname: 'jdupont',
            name: 'Jean',
            surname: 'Dupont'
          }
        ],
        datePublication: '2022',
        parent: { id: 2, title: 'Speleology Review' }
      }
    ]);

    const reference = screen.getByText('Jean Dupont, 2022.', { exact: false });
    const copyButton = screen.getByRole('button', { name: 'Copy reference' });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(reference.closest('li')).toContainElement(copyButton);
    expect(screen.getByTestId('ArticleIcon')).toBeInTheDocument();
    expect(
      [...reference.querySelectorAll('cite')].map(title => title.textContent)
    ).toEqual(['Underground rivers', 'Speleology Review']);
    await user.click(copyButton);
    expect(clipboard.values).toEqual([
      'Jean Dupont, 2022. Underground rivers. Speleology Review.'
    ]);
  });

  it('shows ten references before expanding the complete list', async () => {
    const user = userEvent.setup();
    renderReferences(
      Array.from({ length: 12 }, (_, index) => makeDocument(index + 1))
    );

    expect(
      screen.getAllByRole('button', { name: 'Copy reference' })
    ).toHaveLength(10);
    expect(screen.queryByText('Document 11')).not.toBeInTheDocument();

    const showMore = screen.getByRole('button', { name: 'Show more' });
    expect(showMore).toHaveAttribute('aria-expanded', 'false');
    await user.click(showMore);

    expect(
      screen.getAllByRole('button', { name: 'Copy reference' })
    ).toHaveLength(12);
    expect(screen.getByText('Document 11')).toBeVisible();
    const showLess = screen.getByRole('button', { name: 'Show less' });
    expect(showLess).toHaveAttribute('aria-expanded', 'true');
    await user.click(showLess);

    expect(
      screen.getAllByRole('button', { name: 'Copy reference' })
    ).toHaveLength(10);
    expect(screen.getByRole('button', { name: 'Show more' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('omits documents without a genuine bibliographic reference', () => {
    renderReferences([
      {
        id: 1,
        type: DocumentTypes.ARTICLE,
        title: 'Bare article title'
      },
      {
        id: 2,
        type: DocumentTypes.MAP,
        title: 'Map with a date',
        datePublication: '2024'
      },
      makeDocument(3)
    ]);

    expect(screen.queryByText('Bare article title')).not.toBeInTheDocument();
    expect(screen.queryByText('Map with a date')).not.toBeInTheDocument();
    expect(screen.getByText('Document 3')).toBeVisible();
    expect(
      screen.getAllByRole('button', { name: 'Copy reference' })
    ).toHaveLength(1);
  });
});
