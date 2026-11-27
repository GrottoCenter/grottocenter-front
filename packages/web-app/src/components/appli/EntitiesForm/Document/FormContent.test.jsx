import { useContext } from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { renderWithProviders } from '@/test/renderWithProviders';
import {
  DocumentTypes,
  documentTypeHelpers
} from '@/utils/documentTypeHelpers';
import messages from '@/../public/lang/en.json';
import DocumentFormProvider, { DocumentFormContext } from './Provider';
import FormContent from './FormContent';

vi.mock('@/hooks', () => ({
  useLanguages: () => ({ data: [] }),
  useLicenses: () => ({ data: [] }),
  findLicenseByName: () => undefined,
  useIdentifierTypes: () => ({ data: [] }),
  useOnlineStatus: () => true
}));

vi.mock('./formElements/DocumentTypeSelect', () => ({ default: () => null }));
vi.mock('./formElements/AuthorAndSharing', () => ({ default: () => null }));
vi.mock('@/components/common/LanguageSelect', () => ({ default: () => null }));
vi.mock('./formElements/ParentDocumentSelect', () => ({ default: () => null }));
vi.mock('./formElements/MultipleISORegionsSelect', () => ({
  default: () => null
}));
vi.mock('./formElements/MultipleSubjectsSelect', () => ({
  default: () => null
}));
vi.mock('@/components/appli/OrganizationSelect', () => ({
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

describe('Document publication date visibility', () => {
  // Load the real lazy editor before timing its visibility assertions.
  beforeAll(() => import('./formElements/PublicationDatePicker'), 30000);
  const datedTypes = Object.values(DocumentTypes).filter(
    type =>
      !documentTypeHelpers.isUnknown(type) &&
      !documentTypeHelpers.isCollection(type)
  );

  it.each(datedTypes)(
    'shows one date editor outside advanced metadata for %s',
    async type => {
      renderForm({ type, identifierType: null });
      const date = await screen.findByTestId('document-publication-date');
      expect(date).toBeVisible();
      expect(screen.getAllByTestId('document-publication-date')).toHaveLength(
        1
      );
      expect(
        date.closest('[data-testid="document-advanced-metadata"]')
      ).toBeNull();
      expect(
        screen.getByRole('button', { name: 'Open calendar' })
      ).toBeVisible();
      const advanced = screen.queryByRole('button', {
        name: 'Advanced metadata'
      });
      if (advanced) expect(advanced).toHaveAttribute('aria-expanded', 'false');
    }
  );

  it('does not add a date editor to collections', () => {
    renderForm();
    expect(screen.queryByTestId('document-publication-date')).toBeNull();
  });

  it('accepts a future event date in the same field as a partial date', async () => {
    renderForm({ type: DocumentTypes.EVENT, description: '' });
    const input = await screen.findByRole('textbox', { name: /Event date/ });
    const nextYear = String(new Date().getFullYear() + 1);
    fireEvent.change(input, { target: { value: nextYear } });
    expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled();
    fireEvent.change(input, { target: { value: `${nextYear}-02-30` } });
    expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled();
  });
});

it('shows the issue number in the main form for periodical issues', () => {
  renderForm({ type: DocumentTypes.ISSUE });
  const input = screen.getByRole('textbox', { name: 'Periodical issue' });
  expect(input).toBeVisible();
  expect(
    input.closest('[data-testid="document-advanced-metadata"]')
  ).toBeNull();
});
