import { useContext } from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import { DocumentTypes } from '@/utils/documentTypeHelpers';
import DocumentFormProvider, { DocumentFormContext } from './Provider';

const ValidationState = () => {
  const { isFormValid } = useContext(DocumentFormContext);
  return <span>{isFormValid ? 'valid' : 'invalid'}</span>;
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
