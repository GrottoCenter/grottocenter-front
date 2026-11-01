import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { apiGet, apiGetWithRange, apiPutForm } from '@/api/client';
import { getLicensesUrl, putDocumentUrl } from '@/conf/apiRoutes';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import DocumentSubmission from './index';
import { DOCUMENT_AUTHORIZE_TO_PUBLISH } from './formElements/AddFileForm/FileHelpers';

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
    expect(
      screen.getByRole('button', {
        name: 'Drop files here or click to select'
      })
    ).toHaveAttribute('aria-disabled', 'false')
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

  it('submits a new file with the stored license and inferred authorization without reselecting the parent', async () => {
    const { container, onSuccess } = renderSubmission();
    await addFile(container);

    const authorization = screen.getByRole('radio', {
      name: messages[
        'There is an authorization to publish from the author on Grottocenter'
      ]
    });
    expect(authorization).toBeChecked();
    expect(authorization).toBeDisabled();
    expect(
      screen.getByRole('combobox', { name: 'Authorization from authors' })
    ).toHaveValue(permission.title);
    expect(screen.getByText('Original author')).toBeInTheDocument();

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

  it('keeps an unknown existing license instead of applying the default', async () => {
    const { container } = renderSubmission({ license: 'Historical license' });
    await addFile(container);
    expect(screen.getByText('Historical license')).toBeInTheDocument();
    const submit = screen.getByRole('button', { name: 'Update' });
    expect(submit).toBeDisabled();
    fireEvent.submit(submit.closest('form'));
    expect(apiPutForm).not.toHaveBeenCalled();
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
