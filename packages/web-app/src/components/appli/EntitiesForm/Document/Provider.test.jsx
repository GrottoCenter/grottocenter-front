import { useContext } from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import { DocumentTypes } from '@/utils/documentTypeHelpers';
import { IS_NEW } from './formElements/AddFileForm/FileHelpers';
import DocumentFormProvider, {
  DocumentFormContext,
  getDocumentLengthErrors
} from './Provider';

const ValidationState = () => {
  const { isFormValid } = useContext(DocumentFormContext);
  return <span>{isFormValid ? 'valid' : 'invalid'}</span>;
};

const FileStates = () => {
  const { document } = useContext(DocumentFormContext);
  return <span>{document.files.map(file => file.state).join(',')}</span>;
};

const validDocument = {
  id: 42,
  type: DocumentTypes.ISSUE,
  title: 'Issue 42',
  description: 'A complete issue',
  authors: [{ id: 1 }],
  parent: { id: 41, title: 'Collection' }
};

const renderValidation = initialValues =>
  render(
    <DocumentFormProvider initialValues={initialValues}>
      <ValidationState />
    </DocumentFormProvider>
  );

describe('DocumentFormProvider parent validation', () => {
  it('preserves pending file states when a moderator reopens a proposal', () => {
    render(
      <DocumentFormProvider
        initialValues={{
          ...validDocument,
          files: [
            { fileName: 'renamed.pdf', state: 'IS_MODIFIED' },
            { fileName: 'deleted.pdf', state: 'IS_DELETED' },
            { fileName: 'intact.pdf' }
          ]
        }}>
        <FileStates />
      </DocumentFormProvider>
    );
    expect(
      screen.getByText('IS_MODIFIED,IS_DELETED,IS_INTACT')
    ).toBeInTheDocument();
  });
  it('accepts a distinct parent for a document type that requires one', async () => {
    renderValidation(validDocument);

    await waitFor(() => expect(screen.getByText('valid')).toBeInTheDocument());
  });

  it('rejects the current document as its own parent', async () => {
    renderValidation({
      ...validDocument,
      parent: { id: '42', title: 'Current document' }
    });

    await waitFor(() =>
      expect(screen.getByText('invalid')).toBeInTheDocument()
    );
  });

  it('ignores a stale parent on a document type that does not use one', async () => {
    renderValidation({
      ...validDocument,
      type: DocumentTypes.COLLECTION,
      parent: { id: '42', title: 'Current document' }
    });

    await waitFor(() => expect(screen.getByText('valid')).toBeInTheDocument());
  });
});

describe('DocumentFormProvider length validation', () => {
  it.each([
    ['title', 300],
    ['identifier', 250],
    ['pages', 100],
    ['issue', 100],
    ['creatorComment', 300]
  ])(
    'rejects a preloaded %s longer than %i characters',
    async (field, limit) => {
      renderValidation({
        ...validDocument,
        type: field === 'pages' ? DocumentTypes.ARTICLE : validDocument.type,
        [field]: 'x'.repeat(limit + 1)
      });

      await waitFor(() =>
        expect(screen.getByText('invalid')).toBeInTheDocument()
      );
    }
  );

  it.each([299, 300])('accepts a title of %i characters', async length => {
    renderValidation({ ...validDocument, title: 'x'.repeat(length) });

    await waitFor(() => expect(screen.getByText('valid')).toBeInTheDocument());
  });

  it('rejects an oversized new file even when its display name is empty', async () => {
    renderValidation({
      ...validDocument,
      files: [
        {
          state: IS_NEW,
          fileName: '',
          file: { name: `${'a'.repeat(197)}.png` }
        }
      ]
    });

    await waitFor(() =>
      expect(screen.getByText('invalid')).toBeInTheDocument()
    );
  });

  it('identifies the oversized field so the form can explain the blocked save', () => {
    expect(
      getDocumentLengthErrors({
        ...validDocument,
        identifier: 'x'.repeat(251)
      })
    ).toEqual([
      {
        field: 'identifier',
        label: 'Identifier',
        limit: 250,
        count: 251
      }
    ]);
  });

  it('ignores stale metadata that the document type does not expose', async () => {
    renderValidation({
      ...validDocument,
      type: DocumentTypes.IMAGE,
      issue: 'x'.repeat(101),
      pages: 'x'.repeat(101)
    });

    await waitFor(() => expect(screen.getByText('valid')).toBeInTheDocument());
  });
});
