import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import renderWithProviders from '@/test/renderWithProviders';
import { DocumentTypes } from '@/utils/documentTypeHelpers';
import DocumentReferences from './DocumentReferences';

const messages = {
  'Available at:': 'Available at:',
  'Bibliographic references': 'Bibliographic references',
  online: 'online',
  'Show more': 'Show more',
  'Show less': 'Show less'
};

const makeDocument = id => ({
  id,
  type: DocumentTypes.TEXT,
  title: `Document ${id}`
});

const renderReferences = documents =>
  renderWithProviders(
    <MemoryRouter>
      <DocumentReferences documents={documents} />
    </MemoryRouter>,
    { messages }
  );

describe('DocumentReferences', () => {
  it('renders formatted references as document links', () => {
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

    const link = screen.getByRole('link', {
      name: 'Jean Dupont, 2022. Underground rivers. Speleology Review.'
    });
    expect(link).toHaveAttribute('href', '/ui/documents/42');
    expect(link).not.toHaveAttribute('target');
    expect(screen.getByTestId('ArticleIcon')).toBeInTheDocument();
    expect(
      [...link.querySelectorAll('cite')].map(title => title.textContent)
    ).toEqual(['Underground rivers', 'Speleology Review']);
  });

  it('shows ten references before expanding the complete list', async () => {
    const user = userEvent.setup();
    renderReferences(
      Array.from({ length: 12 }, (_, index) => makeDocument(index + 1))
    );

    expect(screen.getAllByRole('link')).toHaveLength(10);
    expect(
      screen.queryByRole('link', { name: 'Document 11' })
    ).not.toBeInTheDocument();

    const showMore = screen.getByRole('button', { name: 'Show more' });
    expect(showMore).toHaveAttribute('aria-expanded', 'false');
    await user.click(showMore);

    expect(screen.getAllByRole('link')).toHaveLength(12);
    expect(screen.getByRole('link', { name: 'Document 11' })).toHaveAttribute(
      'href',
      '/ui/documents/11'
    );
    const showLess = screen.getByRole('button', { name: 'Show less' });
    expect(showLess).toHaveAttribute('aria-expanded', 'true');
    await user.click(showLess);

    expect(screen.getAllByRole('link')).toHaveLength(10);
    expect(screen.getByRole('button', { name: 'Show more' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('uses titles as fallbacks and omits the control for short lists', () => {
    renderReferences([makeDocument(1), makeDocument(2)]);

    expect(screen.getAllByRole('link').map(link => link.textContent)).toEqual([
      'Document 1',
      'Document 2'
    ]);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
