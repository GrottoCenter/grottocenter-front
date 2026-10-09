import { useContext } from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { renderWithProviders } from '@/test/renderWithProviders';
import { DocumentTypes } from '@/utils/documentTypeHelpers';
import messages from '@/../public/lang/en.json';
import DocumentFormProvider, { DocumentFormContext } from './Provider';
import FormContent from './FormContent';

vi.mock('@/hooks', () => ({
  useLanguages: () => ({ data: [] }),
  useIdentifierTypes: () => ({ data: [] }),
  useOnlineStatus: () => true
}));

vi.mock('./formElements/DocumentTypeSelect', () => ({ default: () => null }));
vi.mock('@/components/common/LanguageSelect', () => ({ default: () => null }));
vi.mock('./formElements/DocumentAutoComplete', () => ({ default: () => null }));
vi.mock('./formElements/MultipleISORegionsSelect', () => ({
  default: () => null
}));
vi.mock('./formElements/MultipleSubjectsSelect', () => ({
  default: () => null
}));
vi.mock('./formElements/OrganizationAutoComplete', () => ({
  default: () => null
}));
vi.mock('./formElements/AuthorsSection', () => ({ default: () => null }));
vi.mock('./formElements/PublicationDatePicker', () => ({
  default: () => null
}));
vi.mock('./formElements/AddFileForm', () => ({ default: () => null }));

const IntroduceLengthError = () => {
  const { updateAttribute } = useContext(DocumentFormContext);
  return (
    <button
      type="button"
      onClick={() => updateAttribute('identifier', 'x'.repeat(251))}>
      Load oversized identifier
    </button>
  );
};

const renderForm = overrides =>
  renderWithProviders(
    <MemoryRouter>
      <DocumentFormProvider
        initialValues={{
          id: 42,
          type: DocumentTypes.COLLECTION,
          title: 'Test collection',
          description: 'A collection of documents',
          authors: [{ id: 1 }],
          identifierType: { id: 'url', regexp: '^.*$' },
          ...overrides
        }}>
        <FormContent />
        <IntroduceLengthError />
      </DocumentFormProvider>
    </MemoryRouter>,
    { messages }
  );

describe('Document advanced metadata length errors', () => {
  it.each([true, false])(
    'keeps metadata open after correcting an error (prefilled: %s)',
    async isPrefilled => {
      renderForm({ identifier: isPrefilled ? 'x'.repeat(251) : '' });
      const summary = screen.getByRole('button', { name: 'Advanced metadata' });

      if (!isPrefilled) {
        expect(summary).toHaveAttribute('aria-expanded', 'false');
        fireEvent.click(screen.getByText('Load oversized identifier'));
      }
      await waitFor(() =>
        expect(summary).toHaveAttribute('aria-expanded', 'true')
      );
      expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled();

      const input = screen.getByRole('textbox', { name: 'Identifier' });
      input.focus();
      fireEvent.change(input, { target: { value: 'x'.repeat(250) } });

      await waitFor(() =>
        expect(input).toHaveAttribute('aria-invalid', 'false')
      );
      expect(summary).toHaveAttribute('aria-expanded', 'true');
      expect(input).toHaveFocus();
      expect(input).toBeVisible();
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled()
      );

      fireEvent.click(summary);
      expect(summary).toHaveAttribute('aria-expanded', 'false');
    }
  );
});
