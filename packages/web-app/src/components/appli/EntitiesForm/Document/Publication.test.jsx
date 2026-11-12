import { useMemo, useState } from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { apiGet, apiGetWithRange, apiPutForm } from '@/api/client';
import { getLicensesUrl, putDocumentUrl } from '@/conf/apiRoutes';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import DocumentSubmission from './index';
import { DocumentFormContext } from './Provider';
import AddFileForm from './formElements/AddFileForm';
import {
  AUTHORIZATION_FROM_AUTHOR,
  DOCUMENT_AUTHORIZE_TO_PUBLISH,
  LICENSE_IN_FILE
} from './formElements/AddFileForm/FileHelpers';

vi.mock('@/api/client', () => ({
  apiGet: vi.fn(),
  apiGetWithRange: vi.fn(),
  apiPutForm: vi.fn(),
  apiPostForm: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn()
}));

const permission = { id: 99, title: 'Publication permission' };
const ccBy = {
  id: 2,
  name: 'CC-BY',
  url: 'https://creativecommons.org/licenses/by/4.0/'
};
const ccBySa = { id: 1, name: 'CC-BY-SA' };
const initialDocument = {
  id: 42,
  type: 'Issue',
  title: 'Issue 42',
  description: 'Issue summary',
  parent: { id: 41, type: 'Collection', title: 'Collection' },
  authorizationDocument: permission,
  license: 'CC-BY',
  authors: [{ id: 1, nickname: 'Original author' }],
  mainLanguage: 'eng',
  files: []
};

const renderSubmission = (overrides = {}) => {
  const onSuccess = vi.fn();
  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <DocumentSubmission
          initialValues={{ ...initialDocument, ...overrides }}
          onSuccess={onSuccess}
        />
      )
    }
  ]);
  const rendered = renderWithProviders(<RouterProvider router={router} />, {
    messages,
    preloadedState: {
      login: {
        authTokenDecoded: {
          id: 1,
          nickname: 'Original author',
          groups: [{ id: 1, name: 'User' }],
          exp: Date.now() / 1000 + 3600
        }
      }
    }
  });
  return { ...rendered, onSuccess };
};

const addFile = async container => {
  await waitFor(() =>
    expect(screen.getByTestId('file-dropzone')).toHaveAttribute(
      'aria-disabled',
      'false'
    )
  );
  const input = container.querySelector('input[type="file"]');
  await act(async () => {
    fireEvent.change(input, {
      target: {
        files: [new File(['PDF'], 'issue.pdf', { type: 'application/pdf' })]
      }
    });
  });
  await screen.findByTestId('selected-file-issue.pdf');
};

const LicenseRecoveryForm = ({ parentId }) => {
  const [license, setLicense] = useState('Historical license');
  const context = useMemo(
    () => ({
      document: {
        ...initialDocument,
        parent: { ...initialDocument.parent, id: parentId },
        license
      },
      updateAttribute: vi.fn()
    }),
    [license, parentId]
  );
  return (
    <DocumentFormContext.Provider value={context}>
      <AddFileForm
        files={[{ id: 10, fileName: 'issue.pdf' }]}
        setFiles={vi.fn()}
        option={DOCUMENT_AUTHORIZE_TO_PUBLISH}
        setOption={vi.fn()}
        setLicense={setLicense}
        setAuthorizationDocument={vi.fn()}
      />
    </DocumentFormContext.Provider>
  );
};

describe('editing document publication rights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockImplementation(async url => {
      if (url === getLicensesUrl) return { licenses: [ccBy, ccBySa] };
      return {
        languages: [{ id: 'eng', part1: 'en', refName: 'English' }],
        documentTypes: [{ id: 3, name: 'Issue' }],
        fileFormats: [{ mimeType: 'application/pdf', extension: 'pdf' }],
        identifierTypes: [],
        subjects: []
      };
    });
    apiGetWithRange.mockResolvedValue({ data: { documents: [permission] } });
    apiPutForm.mockResolvedValue({ id: 42 });
  });

  describe.each(['Article', 'Issue'])('%s parent normalization', type => {
    it.each([{ id: 41 }, 41, '41'])(
      'submits an untitled existing parent as parent[id]: %j',
      async parent => {
        const { onSuccess } = renderSubmission({
          type,
          parent
        });
        const submit = screen.getByRole('button', { name: 'Update' });
        await waitFor(() => expect(submit).toBeEnabled());
        fireEvent.click(submit);

        await waitFor(() => expect(apiPutForm).toHaveBeenCalledTimes(1));
        const [url, body] = apiPutForm.mock.calls[0];
        expect(url).toBe(putDocumentUrl(42));
        expect(body.get('parent[id]')).toBe('41');
        expect(body.has('parent')).toBe(false);
        expect(body.get('type')).toBe(type);
        await waitFor(() => expect(onSuccess).toHaveBeenCalled());
      }
    );
    it.each([42, '42'])('blocks a bare self-parent id: %j', async parent => {
      renderSubmission({ type, parent });
      const submit = screen.getByRole('button', { name: 'Update' });
      expect(submit).toBeDisabled();
      fireEvent.submit(submit.closest('form'));
      expect(apiPutForm).not.toHaveBeenCalled();
    });
  });

  it('submits a new file with the stored license and inferred authorization without reselecting the parent', async () => {
    const { container, onSuccess } = renderSubmission();
    await addFile(container);

    const authorization = screen.getByLabelText(
      messages[
        'There is an authorization to publish from the author on Grottocenter'
      ]
    );
    expect(authorization).toBeChecked();
    expect(authorization).toBeDisabled();
    expect(screen.getByLabelText('Authorization from authors')).toHaveValue(
      permission.title
    );
    expect(screen.getByText('Original author')).toBeInTheDocument();
    expect(
      screen.getByTestId('document-license').querySelector('[role="combobox"]')
    ).not.toHaveAttribute('aria-describedby');

    const submit = screen.getByRole('button', { name: 'Update' });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);
    await waitFor(() => expect(apiPutForm).toHaveBeenCalledTimes(1));
    const [url, body] = apiPutForm.mock.calls[0];
    expect(url).toBe(putDocumentUrl(42));
    expect(body.get('option')).toBe(DOCUMENT_AUTHORIZE_TO_PUBLISH);
    expect(body.get('license[id]')).toBe('2');
    expect(body.get('license[name]')).toBe('CC-BY');
    expect(body.get('authorizationDocument[id]')).toBe('99');
    expect(body.get('authors[0][id]')).toBe('1');
    expect(body.get('files').name).toBe('issue.pdf');
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('blocks submission while the existing license is being resolved', async () => {
    let resolveLicenses;
    const licenses = new Promise(resolve => {
      resolveLicenses = resolve;
    });
    const defaultGet = apiGet.getMockImplementation();
    apiGet.mockImplementation(url =>
      url === getLicensesUrl ? licenses : defaultGet(url)
    );
    const { container } = renderSubmission();
    await addFile(container);
    const submit = screen.getByRole('button', { name: 'Update' });
    expect(submit).toBeDisabled();
    // The submit handler must also reject attempts that bypass the button.
    fireEvent.submit(submit.closest('form'));
    expect(apiPutForm).not.toHaveBeenCalled();
    await act(async () => resolveLicenses({ licenses: [ccBy, ccBySa] }));
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);
    await waitFor(() => expect(apiPutForm).toHaveBeenCalledTimes(1));
    expect(apiPutForm.mock.calls[0][1].get('license[id]')).toBe('2');
  });

  it.each([false, true])(
    'allows explicit correction of an unknown inherited license (existing file: %s)',
    async hasExistingFile => {
      const { container } = renderSubmission({
        license: 'Historical license',
        files: hasExistingFile ? [{ id: 10, fileName: 'issue.pdf' }] : []
      });
      if (!hasExistingFile) await addFile(container);
      expect(await screen.findByText('Select a license')).toBeInTheDocument();
      expect(screen.getByText('Historical license')).toBeInTheDocument();
      expect(screen.getByTestId('publication-authorization')).toBeDisabled();
      const licenseSelect = screen
        .getByTestId('document-license')
        .querySelector('[role="combobox"]');
      expect(licenseSelect).toHaveAccessibleDescription('Select a license');
      const submit = screen.getByRole('button', { name: 'Update' });
      expect(submit).toBeDisabled();
      fireEvent.submit(submit.closest('form'));
      expect(apiPutForm).not.toHaveBeenCalled();

      fireEvent.mouseDown(
        screen
          .getByTestId('document-license')
          .querySelector('[role="combobox"]')
      );
      fireEvent.click(await screen.findByTestId('document-license-option-2'));
      await waitFor(() => expect(submit).toBeEnabled());
      expect(screen.queryByText('Select a license')).not.toBeInTheDocument();
      expect(licenseSelect).not.toHaveAttribute('aria-disabled', 'true');
      expect(licenseSelect).not.toHaveAttribute('aria-describedby');
      expect(licenseSelect).toHaveAccessibleName('License');
      fireEvent.mouseDown(licenseSelect);
      fireEvent.click(await screen.findByTestId('document-license-option-1'));
      fireEvent.click(submit);
      await waitFor(() => expect(apiPutForm).toHaveBeenCalledTimes(1));
      const body = apiPutForm.mock.calls[0][1];
      expect(body.get('license[id]')).toBe('1');
      expect(body.get('authorizationDocument[id]')).toBe('99');
    }
  );

  it('resets the correction unlock when the parent changes, including switching back', async () => {
    const { rerender } = renderWithProviders(
      <LicenseRecoveryForm parentId={41} />,
      { messages }
    );
    await screen.findByText('Select a license');
    const licenseSelect = screen
      .getByTestId('document-license')
      .querySelector('[role="combobox"]');
    fireEvent.mouseDown(licenseSelect);
    fireEvent.click(await screen.findByTestId('document-license-option-2'));
    expect(licenseSelect).not.toHaveAttribute('aria-disabled', 'true');

    rerender(<LicenseRecoveryForm parentId={43} />);
    expect(licenseSelect).toHaveAttribute('aria-disabled', 'true');
    expect(licenseSelect).toHaveAccessibleName(
      messages[
        'The license of the document has been deduced from the parent document'
      ]
    );

    rerender(<LicenseRecoveryForm parentId={41} />);
    expect(licenseSelect).toHaveAttribute('aria-disabled', 'true');
  });

  it.each(['CC-BY', 'Historical license'])(
    'applies CC-BY-SA to the author-rights option instead of %s',
    async license => {
      const { container } = renderSubmission({
        license,
        option: AUTHORIZATION_FROM_AUTHOR,
        authorizationDocument: null
      });
      await addFile(container);
      const submit = screen.getByRole('button', { name: 'Update' });
      await waitFor(() => expect(submit).toBeEnabled());
      expect(screen.queryByTestId('document-license')).not.toBeInTheDocument();
      fireEvent.click(submit);
      await waitFor(() => expect(apiPutForm).toHaveBeenCalledTimes(1));
      const body = apiPutForm.mock.calls[0][1];
      expect(body.get('option')).toBe(AUTHORIZATION_FROM_AUTHOR);
      expect(body.get('license[id]')).toBe('1');
    }
  );

  it('applies CC-BY-SA when switching from a file license to declaring publication rights', async () => {
    const { container } = renderSubmission({
      option: LICENSE_IN_FILE,
      authorizationDocument: null
    });
    await addFile(container);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled()
    );
    fireEvent.click(screen.getByTestId('publication-author-rights'));
    await waitFor(() =>
      expect(screen.queryByTestId('document-license')).not.toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(apiPutForm).toHaveBeenCalledTimes(1));
    expect(apiPutForm.mock.calls[0][1].get('license[id]')).toBe('1');
  });

  it('uses the default only when there is no existing license', async () => {
    const { container } = renderSubmission({ license: null });
    await addFile(container);
    const submit = screen.getByRole('button', { name: 'Update' });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);
    await waitFor(() => expect(apiPutForm).toHaveBeenCalledTimes(1));
    expect(apiPutForm.mock.calls[0][1].get('license[id]')).toBe('1');
  });
});
