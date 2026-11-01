import { useContext } from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import { DocumentTypes } from '@/utils/documentTypeHelpers';
import {
  AUTHORIZATION_FROM_AUTHOR,
  DOCUMENT_AUTHORIZE_TO_PUBLISH,
  IS_DELETED,
  IS_NEW,
  LICENSE_IN_FILE
} from './formElements/AddFileForm/FileHelpers';
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

const PublicationOption = () => {
  const { document } = useContext(DocumentFormContext);
  return <span>{document.selectOptionAuthorizationDocument ?? 'unset'}</span>;
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
    ['pages', 20],
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

  it.each([19, 20])('accepts pages of %i characters', async length => {
    renderValidation({
      ...validDocument,
      type: DocumentTypes.ARTICLE,
      pages: '1'.repeat(length)
    });

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

describe('DocumentFormProvider publication authorization', () => {
  it.each([null, { id: 41, title: 'Collection' }])(
    'deduces the missing option from an authorization (parent: %j)',
    parent => {
      render(
        <DocumentFormProvider
          initialValues={{
            ...validDocument,
            parent,
            authorizationDocument: { id: 99, title: 'Permission' }
          }}>
          <PublicationOption />
        </DocumentFormProvider>
      );
      expect(
        screen.getByText(DOCUMENT_AUTHORIZE_TO_PUBLISH)
      ).toBeInTheDocument();
    }
  );

  it.each([AUTHORIZATION_FROM_AUTHOR, LICENSE_IN_FILE])(
    'preserves the explicit option %s',
    option => {
      render(
        <DocumentFormProvider
          initialValues={{
            ...validDocument,
            option,
            authorizationDocument: { id: 99, title: 'Permission' }
          }}>
          <PublicationOption />
        </DocumentFormProvider>
      );
      expect(screen.getByText(option)).toBeInTheDocument();
    }
  );

  it('leaves the option unset when no authorization is supplied', () => {
    render(
      <DocumentFormProvider initialValues={validDocument}>
        <PublicationOption />
      </DocumentFormProvider>
    );
    expect(screen.getByText('unset')).toBeInTheDocument();
  });

  it.each(['CC-BY', { name: 'CC-BY' }, null])(
    'rejects a file publication until its license has an id (%j)',
    async license => {
      renderValidation({
        ...validDocument,
        license,
        authorizationDocument: { id: 99, title: 'Permission' },
        files: [{ fileName: 'issue.pdf' }]
      });
      await waitFor(() =>
        expect(screen.getByText('invalid')).toBeInTheDocument()
      );
    }
  );

  it('accepts a resolved license and a deduced authorization option', async () => {
    renderValidation({
      ...validDocument,
      license: { id: 2, name: 'CC-BY' },
      authorizationDocument: { id: 99, title: 'Permission' },
      files: [{ fileName: 'issue.pdf' }]
    });
    await waitFor(() => expect(screen.getByText('valid')).toBeInTheDocument());
  });

  it('does not require a resolved license when all files are deleted', async () => {
    renderValidation({
      ...validDocument,
      license: 'CC-BY',
      files: [{ fileName: 'issue.pdf', state: IS_DELETED }]
    });
    await waitFor(() => expect(screen.getByText('valid')).toBeInTheDocument());
  });

  it('does not require a license for an authorization document', async () => {
    renderValidation({
      ...validDocument,
      type: DocumentTypes.AUTHORIZATION_TO_PUBLISH,
      license: null,
      files: [{ fileName: 'permission.pdf' }]
    });
    await waitFor(() => expect(screen.getByText('valid')).toBeInTheDocument());
  });
});
