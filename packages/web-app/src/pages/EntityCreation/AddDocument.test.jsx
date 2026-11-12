import { StrictMode, useContext } from 'react';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { apiGet, apiPost, apiPostForm } from '@/api/client';
import { getDocumentDetailsUrl } from '@/conf/apiRoutes';
import { renderWithProviders } from '@/test/renderWithProviders';
import { DocumentFormContext } from '@/components/appli/EntitiesForm/Document/Provider';
import messages from '@/../public/lang/en.json';
import AddDocument from './AddDocument';

const FormState = () => {
  const { document, isNewDocument, updateAttribute } =
    useContext(DocumentFormContext);
  return (
    <>
      <output data-testid="state">
        {JSON.stringify({ ...document, isNewDocument })}
      </output>
      <button
        type="button"
        onClick={() =>
          updateAttribute('editor', { id: 22, name: 'My publisher' })
        }>
        Change publisher
      </button>
    </>
  );
};

vi.mock('@/api/client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPostForm: vi.fn(),
  apiGetWithRange: vi.fn(),
  apiPutForm: vi.fn(),
  apiDelete: vi.fn(),
  apiPut: vi.fn()
}));

// Observe the real form state without replacing its selector or submission flow.
vi.mock('@/components/common/Layouts/Fixed/FixedContent', () => ({
  default: ({ title, content }) => (
    <main>
      <h1>{title}</h1>
      {content}
      <FormState />
    </main>
  )
}));
vi.mock('@mui/icons-material', () => {
  const Icon = () => null;
  return {
    Article: Icon,
    ChevronLeft: Icon,
    ChevronRight: Icon,
    EventAvailable: Icon,
    Image: Icon,
    InsertDriveFile: Icon,
    PictureAsPdf: Icon,
    TableChart: Icon,
    ZoomIn: Icon,
    ZoomOut: Icon
  };
});

const permission = { id: 90, title: 'Publication permission' };
const license = { id: 2, name: 'CC-BY' };
const parent = {
  id: 10,
  type: 'Issue',
  title: 'Test journal',
  mainLanguage: 'fra',
  license: 'CC-BY',
  datePublication: '2025-03-01',
  editor: { id: 20, name: 'Publisher' },
  library: { id: 21, name: 'Library' },
  authorizationDocument: permission
};
const replacement = {
  id: 11,
  title: 'Replacement issue',
  type: 'Issue',
  mainLanguage: 'eng'
};

const state = () => JSON.parse(screen.getByTestId('state').textContent);
const parentInput = () =>
  screen.getByTestId('document-parent').querySelector('input');
const clearParent = async user => {
  await user.click(parentInput());
  await user.click(
    within(screen.getByTestId('document-parent')).getByRole('button', {
      name: 'Clear'
    })
  );
};
const renderPage = (
  url = '/ui/entity/add/document?type=Article&parentId=10'
) => {
  const router = createMemoryRouter(
    [{ path: '/ui/entity/add/document', element: <AddDocument /> }],
    { initialEntries: [url] }
  );
  const result = renderWithProviders(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
    {
      messages,
      preloadedState: {
        login: {
          authTokenDecoded: {
            id: 1,
            nickname: 'Caver',
            groups: [{ name: 'User' }],
            exp: Date.now() / 1000 + 3600
          }
        }
      }
    }
  );
  return { ...result, router };
};

beforeEach(() => {
  vi.clearAllMocks();
  apiGet.mockImplementation(async url => {
    if (url === `${getDocumentDetailsUrl}10`) return parent;
    if (url === `${getDocumentDetailsUrl}11`) return replacement;
    if (url === `${getDocumentDetailsUrl}90`) return permission;
    return {
      languages: [
        { id: 'fra', part1: 'fr', refName: 'French' },
        { id: 'eng', part1: 'en', refName: 'English' }
      ],
      licenses: [license],
      documentTypes: [
        { id: 1, name: 'Collection' },
        { id: 2, name: 'Issue' },
        { id: 3, name: 'Article' },
        { id: 4, name: 'Report' }
      ],
      fileFormats: [],
      identifierTypes: [],
      subjects: []
    };
  });
  apiPost.mockResolvedValue({ results: [parent, replacement] });
});

it.each([
  ['Article', 'article'],
  ['Issue', 'issue']
])(
  'initializes a new %s once and matches manual parent inheritance',
  async (type, label) => {
    const selectedParent = {
      ...parent,
      type: type === 'Issue' ? 'Collection' : 'Issue'
    };
    const originalGet = apiGet.getMockImplementation();
    apiGet.mockImplementation(url =>
      url === `${getDocumentDetailsUrl}10`
        ? Promise.resolve(selectedParent)
        : originalGet(url)
    );
    apiPost.mockResolvedValue({ results: [selectedParent, replacement] });
    const { router } = renderPage(
      `/ui/entity/add/document?type=${type}&parentId=10`
    );
    await screen.findByRole('heading', {
      name: `Add an ${label} to Test journal`
    });
    await waitFor(() =>
      expect(state().authorizationDocument).toEqual(permission)
    );
    const inherited = state();
    expect(inherited).toMatchObject({
      type,
      id: null,
      isNewDocument: true,
      title: type === 'Issue' ? parent.title : '',
      description: '',
      datePublication: '',
      mainLanguage: 'fra',
      mainLanguageName: 'French',
      license,
      editor: parent.editor,
      library: parent.library,
      parent: { id: 10, title: parent.title }
    });
    expect(apiPostForm).not.toHaveBeenCalled();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Change publisher' }));
    expect(state().editor.name).toBe('My publisher');
    await act(async () => router.navigate('/ui/entity/add/document'));
    expect(state()).toMatchObject({
      type: -1,
      parent: null,
      editor: null,
      title: ''
    });
    await user.click(
      await screen.findByTestId(`document-type-${type === 'Article' ? 3 : 2}`)
    );
    await user.type(parentInput(), 'Test');
    await user.click(
      await screen.findByRole('option', { name: /Test journal/ })
    );
    await waitFor(() =>
      expect(state().authorizationDocument).toEqual(permission)
    );
    expect(state()).toMatchObject(inherited);
  }
);

it.each(['clear', 'replace', 'type', 'edit', 'generic'])(
  'ignores obsolete initialization after %s during delayed loading',
  async action => {
    let resolveParent;
    const originalGet = apiGet.getMockImplementation();
    apiGet.mockImplementation(url =>
      url === `${getDocumentDetailsUrl}10`
        ? new Promise(resolve => {
            resolveParent = resolve;
          })
        : originalGet(url)
    );
    const { router } = renderPage();
    await waitFor(() => expect(resolveParent).toBeDefined());
    const user = userEvent.setup();
    if (action === 'clear') await clearParent(user);
    if (action === 'replace') {
      await user.type(parentInput(), 'Replacement');
      await user.click(
        await screen.findByRole('option', { name: /Replacement issue/ })
      );
      await waitFor(() => expect(state().parent.id).toBe(11));
    }
    if (action === 'type')
      await user.click(await screen.findByTestId('document-type-4'));
    if (action === 'edit') {
      await user.click(
        screen.getByRole('button', { name: 'Change publisher' })
      );
      fireEvent.change(
        screen.getByTestId('document-title').querySelector('input'),
        { target: { value: 'My article' } }
      );
    }
    if (action === 'generic')
      await act(async () => router.navigate('/ui/entity/add/document'));
    await act(async () => resolveParent(parent));
    if (action === 'edit') {
      await waitFor(() =>
        expect(state().authorizationDocument).toEqual(permission)
      );
      expect(state()).toMatchObject({
        title: 'My article',
        editor: { name: 'My publisher' }
      });
    } else {
      expect(state().authorizationDocument).toBeNull();
      expect(state().editor).toBeNull();
      expect(state().parent?.id ?? null).toBe(action === 'replace' ? 11 : null);
    }
  }
);

it.each(['untouched', 'custom', 'cleared'])(
  'preserves %s issue-title edits while the collection loads',
  async action => {
    const pending = Promise.withResolvers();
    const originalGet = apiGet.getMockImplementation();
    apiGet.mockImplementation(url =>
      url === `${getDocumentDetailsUrl}10` ? pending.promise : originalGet(url)
    );
    renderPage('/ui/entity/add/document?type=Issue&parentId=10');
    const title = screen.getByTestId('document-title').querySelector('input');
    if (action !== 'untouched') {
      fireEvent.change(title, { target: { value: 'My issue' } });
      if (action === 'cleared')
        fireEvent.change(title, { target: { value: '' } });
    }
    await act(async () => pending.resolve({ ...parent, type: 'Collection' }));
    await waitFor(() => expect(state().parent?.title).toBe(parent.title));
    const expected = {
      untouched: parent.title,
      custom: 'My issue',
      cleared: ''
    };
    expect(title).toHaveValue(expected[action]);
  }
);

it.each([false, true])(
  'updates only the untouched collection prefill when choosing another collection (custom: %s)',
  async hasCustomTitle => {
    const originalGet = apiGet.getMockImplementation();
    apiGet.mockImplementation(async url => {
      const result = await originalGet(url);
      return [10, 11].some(id => url === `${getDocumentDetailsUrl}${id}`)
        ? { ...result, type: 'Collection' }
        : result;
    });
    apiPost.mockResolvedValue({
      results: [{ ...replacement, type: 'Collection' }]
    });
    renderPage('/ui/entity/add/document?type=Issue&parentId=10');
    const title = screen.getByTestId('document-title').querySelector('input');
    await waitFor(() => expect(title).toHaveValue(parent.title));
    if (hasCustomTitle) {
      fireEvent.change(title, { target: { value: `${parent.title} - 42` } });
    }
    const user = userEvent.setup();
    await clearParent(user);
    expect(title).toHaveValue(hasCustomTitle ? `${parent.title} - 42` : '');
    await user.type(parentInput(), 'Replacement');
    await user.click(
      await screen.findByRole('option', { name: /Replacement issue/ })
    );
    await waitFor(() => expect(state().parent?.title).toBe(replacement.title));
    expect(title).toHaveValue(
      hasCustomTitle ? `${parent.title} - 42` : replacement.title
    );
  }
);

it('resolves reference data before inheriting and never replays initialization on refetch', async () => {
  let resolveLicenses;
  const originalGet = apiGet.getMockImplementation();
  apiGet.mockImplementation(url =>
    url.includes('/licenses')
      ? new Promise(resolve => {
          resolveLicenses = resolve;
        })
      : originalGet(url)
  );
  const { queryClient } = renderPage();
  await waitFor(() => expect(resolveLicenses).toBeDefined());
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Change publisher' }));
  await act(async () => resolveLicenses({ licenses: [license] }));
  await waitFor(() => expect(state().license).toEqual(license));
  expect(state().editor.name).toBe('My publisher');
  apiGet.mockImplementation(originalGet);
  await act(async () => queryClient.invalidateQueries());
  expect(state().editor.name).toBe('My publisher');
  expect(
    apiGet.mock.calls.filter(([url]) => url === `${getDocumentDetailsUrl}10`)
  ).toHaveLength(1);
});

it('ignores a late authorization response after clearing the contextual parent', async () => {
  let resolvePermission;
  const originalGet = apiGet.getMockImplementation();
  apiGet.mockImplementation(url =>
    url === `${getDocumentDetailsUrl}90`
      ? new Promise(resolve => {
          resolvePermission = resolve;
        })
      : originalGet(url)
  );
  renderPage();
  await waitFor(() => expect(resolvePermission).toBeDefined());
  await clearParent(userEvent.setup());
  await act(async () => resolvePermission(permission));
  expect(state().parent).toBeNull();
  expect(state().authorizationDocument).toBeNull();
});

const fillRequiredFields = async user => {
  fireEvent.change(
    screen.getByTestId('document-title').querySelector('input'),
    { target: { value: 'My article' } }
  );
  fireEvent.change(document.querySelector('textarea'), {
    target: { value: 'An article summary' }
  });
  apiPost.mockResolvedValueOnce({
    results: [{ id: 2, nickname: 'Test author', _type: 'persons' }]
  });
  await user.type(
    screen.getByTestId('document-authors').querySelector('input'),
    'Test'
  );
  await user.click(await screen.findByRole('option', { name: /Test author/ }));
};

it.each([404, 403, 'network'])(
  'clears an unresolved contextual parent on %s and allows a replacement',
  async status => {
    const pending = Promise.withResolvers();
    const originalGet = apiGet.getMockImplementation();
    apiGet.mockImplementation(url =>
      url === `${getDocumentDetailsUrl}10` ? pending.promise : originalGet(url)
    );
    const loggedError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      renderPage();
      const user = userEvent.setup();
      await waitFor(() => expect(state().parent?.id).toBe(10));
      await fillRequiredFields(user);
      // An invisible URL ID must not enable submission while still loading.
      expect(screen.getByTestId('document-submit')).toBeDisabled();
      await act(async () => pending.reject(new Error(String(status))));
      await waitFor(() => expect(state().parent).toBeNull());
      expect(parentInput()).toHaveValue('');
      expect(parentInput()).toBeRequired();
      expect(screen.getByTestId('document-submit')).toBeDisabled();
      expect(apiPostForm).not.toHaveBeenCalled();

      await user.type(parentInput(), 'Replacement');
      await user.click(
        await screen.findByRole('option', { name: /Replacement issue/ })
      );
      await waitFor(() =>
        expect(screen.getByTestId('document-submit')).toBeEnabled()
      );
      expect(state().parent).toMatchObject({
        id: 11,
        title: replacement.title
      });
    } finally {
      loggedError.mockRestore();
    }
  }
);

it.each([
  ['Article', 'Collection', false],
  ['Article', 'Book', false],
  ['Issue', 'Issue', false],
  ['Article', 'Issue', true],
  ['Issue', 'Collection', true]
])(
  'rejects a contextual %s parent of type %s (deleted: %s) before inheritance',
  async (type, parentType, isDeleted) => {
    const originalGet = apiGet.getMockImplementation();
    apiGet.mockImplementation(url =>
      url === `${getDocumentDetailsUrl}10`
        ? Promise.resolve({ ...parent, type: parentType, isDeleted })
        : originalGet(url)
    );
    renderPage(`/ui/entity/add/document?type=${type}&parentId=10`);
    await waitFor(() => expect(state().parent).toBeNull());
    expect(parentInput()).toHaveValue('');
    expect(parentInput()).toBeRequired();
    expect(state().editor).toBeNull();
    expect(state().authorizationDocument).toBeNull();
    expect(screen.getByTestId('document-submit')).toBeDisabled();
    expect(apiPostForm).not.toHaveBeenCalled();
    expect(
      apiGet.mock.calls.some(([url]) => url === `${getDocumentDetailsUrl}90`)
    ).toBe(false);
  }
);

it('preserves the resolved parent when its authorization cannot be loaded', async () => {
  const originalGet = apiGet.getMockImplementation();
  apiGet.mockImplementation(url =>
    url === `${getDocumentDetailsUrl}90`
      ? Promise.reject(new Error('Permission unavailable'))
      : originalGet(url)
  );
  const loggedError = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    renderPage();
    await waitFor(() => expect(loggedError).toHaveBeenCalled());
    expect(state().parent).toMatchObject({ id: 10, title: parent.title });
    expect(parentInput()).toHaveValue(parent.title);
  } finally {
    loggedError.mockRestore();
  }
});

it('ignores a contextual failure after a replacement was selected', async () => {
  const pending = Promise.withResolvers();
  const originalGet = apiGet.getMockImplementation();
  apiGet.mockImplementation(url =>
    url === `${getDocumentDetailsUrl}10` ? pending.promise : originalGet(url)
  );
  renderPage();
  const user = userEvent.setup();
  await user.type(parentInput(), 'Replacement');
  await user.click(
    await screen.findByRole('option', { name: /Replacement issue/ })
  );
  await waitFor(() => expect(state().parent?.title).toBe(replacement.title));
  await act(async () => pending.reject(new Error('Old parent unavailable')));
  expect(state().parent).toMatchObject({ id: 11, title: replacement.title });
  expect(parentInput()).toHaveValue(replacement.title);
});
