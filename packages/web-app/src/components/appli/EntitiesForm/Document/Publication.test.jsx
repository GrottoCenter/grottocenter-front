import { useMemo, useState } from 'react';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { apiGet, apiPost, apiPostForm, apiPutForm } from '@/api/client';
import { referenceKeys } from '@/api/queryKeys';
import {
  getDocumentDetailsUrl,
  getLicensesUrl,
  putDocumentUrl,
  quickSearchUrl
} from '@/conf/apiRoutes';
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

const renderSubmission = (overrides = {}, { isNewDocument = false } = {}) => {
  const onSuccess = vi.fn();
  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <DocumentSubmission
          initialValues={
            isNewDocument ? undefined : { ...initialDocument, ...overrides }
          }
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

const selectAuthorization = async (title = permission.title, query = title) => {
  const user = userEvent.setup();
  const input = screen.getByTestId('authorization-document-search');
  await user.clear(input);
  await user.type(input, query);
  await user.click(await screen.findByRole('option', { name: title }));
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
        documentTypes: [
          { id: 3, name: 'Issue' },
          { id: 4, name: 'Collection' },
          { id: 5, name: 'Image' },
          { id: 6, name: 'Book' }
        ],
        fileFormats: [{ mimeType: 'application/pdf', extension: 'pdf' }],
        identifierTypes: [],
        subjects: []
      };
    });
    apiPost.mockResolvedValue({
      results: [{ ...permission, id: String(permission.id) }]
    });
    apiPostForm.mockResolvedValue({ id: 43 });
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

  it('allows a collection without authorization and hides file publication choices', async () => {
    renderSubmission({
      type: 'Collection',
      parent: null,
      license: null,
      authorizationDocument: null
    });
    const rights = screen.getByTestId('collection-publication-rights');
    expect(
      within(rights).getByRole('combobox', {
        name: 'Authorization from authors'
      })
    ).not.toBeRequired();
    expect(screen.queryByTestId('file-dropzone')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('publication-author-rights')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('publication-authorization')
    ).not.toBeInTheDocument();
    const submit = screen.getByRole('button', { name: 'Update' });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);
    await waitFor(() => expect(apiPutForm).toHaveBeenCalledOnce());
    const body = apiPutForm.mock.calls[0][1];
    expect(body.has('authorizationDocument[id]')).toBe(false);
    expect(body.has('option')).toBe(false);
    expect(body.has('files')).toBe(false);
  });

  it('requires an explicit license when attaching an authorization to a collection', async () => {
    renderSubmission({
      type: 'Collection',
      parent: null,
      license: null,
      authorizationDocument: null
    });
    await selectAuthorization(permission.title, 'Permission letter');
    expect(apiPost).toHaveBeenCalledWith(quickSearchUrl, {
      query: 'Permission letter',
      entities: ['documents'],
      filter: { type: ['Authorization To Publish'] }
    });
    const submit = screen.getByRole('button', { name: 'Update' });
    await waitFor(() => expect(submit).toBeDisabled());
    fireEvent.submit(submit.closest('form'));
    expect(apiPutForm).not.toHaveBeenCalled();
    fireEvent.mouseDown(
      screen.getByTestId('document-license').querySelector('[role="combobox"]')
    );
    fireEvent.click(await screen.findByTestId('document-license-option-2'));
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);
    await waitFor(() => expect(apiPutForm).toHaveBeenCalledOnce());
    const body = apiPutForm.mock.calls[0][1];
    expect(body.get('license[id]')).toBe('2');
    expect(body.get('authorizationDocument[id]')).toBe('99');
    expect(body.get('option')).toBe(DOCUMENT_AUTHORIZE_TO_PUBLISH);
    expect(body.has('files')).toBe(false);
  });

  it('finds an authorization through search when attaching a file without a parent', async () => {
    const { container } = renderSubmission({
      type: 'Book',
      parent: null,
      authors: [{ id: 2, nickname: 'Document author' }],
      authorizationDocument: null,
      license: null
    });
    await addFile(container);
    fireEvent.click(screen.getByTestId('publication-authorization'));
    await selectAuthorization();
    const submit = screen.getByTestId('document-submit');
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);
    await waitFor(() => expect(apiPutForm).toHaveBeenCalledOnce());
    const body = apiPutForm.mock.calls[0][1];
    expect(body.get('authorizationDocument[id]')).toBe('99');
    expect(body.get('option')).toBe(DOCUMENT_AUTHORIZE_TO_PUBLISH);
  });

  it('can clear an unsaved collection authorization even after changing types', async () => {
    renderSubmission({
      type: 'Collection',
      parent: null,
      license: null,
      authorizationDocument: null
    });
    await selectAuthorization();
    fireEvent.mouseDown(
      screen.getByTestId('document-license').querySelector('[role="combobox"]')
    );
    fireEvent.click(await screen.findByTestId('document-license-option-2'));
    fireEvent.click(await screen.findByTestId('document-type-5'));
    await waitFor(() =>
      expect(screen.getByTestId('file-dropzone')).toHaveAttribute(
        'aria-disabled',
        'false'
      )
    );
    fireEvent.click(screen.getByTestId('document-type-4'));
    fireEvent.click(
      within(screen.getByTestId('collection-publication-rights')).getByTitle(
        'Clear'
      )
    );
    const submit = screen.getByRole('button', { name: 'Update' });
    await waitFor(() => expect(submit).toBeEnabled());
    expect(screen.queryByTestId('document-license')).not.toBeInTheDocument();
    fireEvent.click(submit);
    await waitFor(() => expect(apiPutForm).toHaveBeenCalledOnce());
    expect(apiPutForm.mock.calls[0][1].has('authorizationDocument[id]')).toBe(
      false
    );
    expect(apiPutForm.mock.calls[0][1].has('option')).toBe(false);
    expect(apiPutForm.mock.calls[0][1].has('license[id]')).toBe(false);
  });

  it('does not submit a file license when converting an unauthorized document to a collection', async () => {
    renderSubmission({
      type: 'Image',
      parent: null,
      authorizationDocument: null,
      option: LICENSE_IN_FILE,
      license: ccBy
    });
    fireEvent.click(await screen.findByTestId('document-type-4'));
    const submit = screen.getByTestId('document-submit');
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);
    await waitFor(() => expect(apiPutForm).toHaveBeenCalledOnce());
    const body = apiPutForm.mock.calls[0][1];
    expect(body.get('type')).toBe('Collection');
    expect(body.has('license[id]')).toBe(false);
    expect(body.has('option')).toBe(false);
  });

  it('restores the issue parent and publication choices after visiting Collection', async () => {
    renderSubmission({ license: ccBy });
    fireEvent.click(await screen.findByTestId('document-type-4'));
    expect(
      screen.queryByTestId('document-parent-search')
    ).not.toBeInTheDocument();
    const license = await screen.findByTestId('document-license');
    fireEvent.mouseDown(license.querySelector('[role="combobox"]'));
    fireEvent.click(await screen.findByTestId('document-license-option-1'));
    fireEvent.click(screen.getByTestId('document-type-3'));
    expect(screen.getByTestId('document-parent-search')).toHaveValue(
      'Collection'
    );
    const submit = screen.getByTestId('document-submit');
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);
    await waitFor(() => expect(apiPutForm).toHaveBeenCalledOnce());
    const body = apiPutForm.mock.calls[0][1];
    expect(body.get('parent[id]')).toBe('41');
    expect(body.get('license[id]')).toBe('2');
    expect(body.get('authorizationDocument[id]')).toBe('99');
  });

  it('resets the prefilled issue title for Collection and restores it with the parent', async () => {
    const getFormData = apiGet.getMockImplementation();
    apiGet.mockImplementation(async url =>
      url === `${getDocumentDetailsUrl}41`
        ? initialDocument.parent
        : getFormData(url)
    );
    apiPost.mockResolvedValue({ results: [initialDocument.parent] });
    const user = userEvent.setup();
    renderSubmission({}, { isNewDocument: true });

    await user.click(await screen.findByTestId('document-type-3'));
    await user.type(screen.getByTestId('document-parent-search'), 'Coll');
    await user.click(await screen.findByRole('option', { name: /Collection/ }));
    const title = () =>
      screen.getByTestId('document-title').querySelector('input');
    await waitFor(() => expect(title()).toHaveValue('Collection'));

    await user.click(screen.getByTestId('document-type-4'));
    expect(title()).toHaveValue('');
    await user.click(screen.getByTestId('document-type-3'));
    expect(title()).toHaveValue('Collection');
    expect(screen.getByTestId('document-parent-search')).toHaveValue(
      'Collection'
    );

    await user.clear(title());
    await user.type(title(), 'Custom issue title');
    await user.click(screen.getByTestId('document-type-4'));
    expect(title()).toHaveValue('Custom issue title');
  });

  it('does not mark the stored collection license unknown when loading licenses fails', async () => {
    const getFormData = apiGet.getMockImplementation();
    apiGet.mockImplementation(async url => {
      if (url === getLicensesUrl) throw new Error('Licenses unavailable');
      return getFormData(url);
    });
    const { queryClient } = renderSubmission({
      type: 'Collection',
      parent: null
    });
    await waitFor(() =>
      expect(queryClient.getQueryState(referenceKeys.licenses())?.status).toBe(
        'error'
      )
    );
    expect(screen.queryByText('Select a license')).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId('document-license')).getByRole('img', {
        name: 'CC-BY'
      })
    ).toBeInTheDocument();
  });

  it('preserves stored collection rights and permits replacement but not removal', async () => {
    const replacement = { id: 100, title: 'Replacement permission' };
    apiPost.mockResolvedValue({ results: [replacement] });
    renderSubmission({ type: 'Collection', parent: null });
    const rights = screen.getByTestId('collection-publication-rights');
    expect(within(rights).queryByTitle('Clear')).not.toBeInTheDocument();
    const submit = screen.getByRole('button', { name: 'Update' });
    await waitFor(() => expect(submit).toBeEnabled());
    await selectAuthorization(replacement.title);
    fireEvent.click(submit);
    await waitFor(() => expect(apiPutForm).toHaveBeenCalledOnce());
    const body = apiPutForm.mock.calls[0][1];
    expect(body.get('authorizationDocument[id]')).toBe('100');
    expect(body.get('license[id]')).toBe('2');
    expect(body.get('option')).toBe(DOCUMENT_AUTHORIZE_TO_PUBLISH);
    expect(body.has('files')).toBe(false);
  });

  it('preserves collection rights and replacements across file publication choices', async () => {
    const replacement = { id: 100, title: 'Replacement permission' };
    apiPost.mockResolvedValue({ results: [replacement] });
    const { container } = renderSubmission({
      type: 'Collection',
      parent: null
    });
    await selectAuthorization(replacement.title);
    fireEvent.click(await screen.findByTestId('document-type-6'));
    await addFile(container);
    fireEvent.click(screen.getByTestId('publication-author-rights'));
    fireEvent.click(screen.getByTestId('document-type-4'));
    const rights = within(screen.getByTestId('collection-publication-rights'));
    expect(
      rights.getByRole('combobox', { name: 'Authorization from authors' })
    ).toHaveValue(replacement.title);
    expect(rights.queryByTitle('Clear')).not.toBeInTheDocument();
    const submit = screen.getByTestId('document-submit');
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);
    await waitFor(() => expect(apiPutForm).toHaveBeenCalledOnce());
    const body = apiPutForm.mock.calls[0][1];
    expect(body.get('authorizationDocument[id]')).toBe('100');
    expect(body.get('license[id]')).toBe('2');
    expect(body.get('option')).toBe(DOCUMENT_AUTHORIZE_TO_PUBLISH);
    expect(body.has('files')).toBe(false);
  });

  it.each([
    ['creation', true],
    ['update', false]
  ])(
    'does not reuse an automatic file license for collection rights on %s',
    async (_label, isNewDocument) => {
      renderSubmission(
        {
          type: 'Collection',
          parent: null,
          authorizationDocument: null,
          license: null
        },
        { isNewDocument }
      );
      fireEvent.click(await screen.findByTestId('document-type-5'));
      await waitFor(() =>
        expect(screen.getByTestId('file-dropzone')).toHaveAttribute(
          'aria-disabled',
          'false'
        )
      );
      fireEvent.click(screen.getByTestId('document-type-4'));
      if (isNewDocument) {
        fireEvent.change(
          screen.getByTestId('document-title').querySelector('input'),
          { target: { value: 'New collection' } }
        );
        fireEvent.change(
          screen.getByTestId('document-description').querySelector('textarea'),
          { target: { value: 'Collection summary' } }
        );
      }
      await selectAuthorization();
      const submit = screen.getByTestId('document-submit');
      await waitFor(() => expect(submit).toBeDisabled());
      fireEvent.submit(submit.closest('form'));
      expect(apiPostForm).not.toHaveBeenCalled();
      expect(apiPutForm).not.toHaveBeenCalled();
      fireEvent.mouseDown(
        screen
          .getByTestId('document-license')
          .querySelector('[role="combobox"]')
      );
      fireEvent.click(await screen.findByTestId('document-license-option-2'));
      await waitFor(() => expect(submit).toBeEnabled());
      fireEvent.click(submit);
      const api = isNewDocument ? apiPostForm : apiPutForm;
      await waitFor(() => expect(api).toHaveBeenCalledOnce());
      const body = api.mock.calls[0][1];
      expect(body.get('license[id]')).toBe('2');
      expect(body.get('authorizationDocument[id]')).toBe('99');
      expect(body.get('option')).toBe(DOCUMENT_AUTHORIZE_TO_PUBLISH);
    }
  );

  it('preserves the existing photo date when saving other metadata', async () => {
    renderSubmission({
      type: 'Image',
      parent: null,
      datePublication: '2005-04-12',
      files: [{ id: 9, fileName: 'photo.jpg', completePath: '/photo.jpg' }]
    });
    const submit = screen.getByRole('button', { name: 'Update' });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);
    await waitFor(() => expect(apiPutForm).toHaveBeenCalledOnce());
    const [, body] = apiPutForm.mock.calls[0];
    expect(body.get('datePublication')).toBe('2005-04-12');
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
