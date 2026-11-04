import { useContext } from 'react';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiGet, apiPost } from '@/api/client';
import { getDocumentDetailsUrl } from '@/conf/apiRoutes';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import DocumentFormProvider, { DocumentFormContext } from '../Provider';
import { DOCUMENT_AUTHORIZE_TO_PUBLISH } from './AddFileForm/FileHelpers';
import ParentDocumentSelect from './ParentDocumentSelect';

vi.mock('@/api/client', () => ({ apiGet: vi.fn(), apiPost: vi.fn() }));

const license = { id: 2, name: 'CC-BY' };
const permission = {
  id: 90,
  type: 'Authorization To Publish',
  title: 'Permission'
};
const firstParent = {
  id: 10,
  type: 'Issue',
  title: 'First journal',
  description: 'A journal description',
  _type: 'documents'
};
const secondParent = {
  id: 11,
  type: 'Issue',
  title: 'Second journal',
  _type: 'documents'
};
const details = {
  ...firstParent,
  mainLanguage: 'fra',
  license: 'CC-BY',
  editor: { id: 20, name: 'Inherited publisher' },
  library: { id: 21, name: 'Inherited library' },
  authorizationDocument: permission
};

const Form = () => {
  const { document } = useContext(DocumentFormContext);
  return (
    <>
      <ParentDocumentSelect
        labelText="Parent document"
        searchLabelText="Search for a document"
        helperContent="Select the containing document."
        required
      />
      <output data-testid="document-state">{JSON.stringify(document)}</output>
    </>
  );
};

const renderForm = (overrides = {}) =>
  renderWithProviders(
    <DocumentFormProvider
      initialValues={{
        id: 7,
        type: 'Article',
        title: 'Current article',
        mainLanguage: 'eng',
        editor: { id: 1, name: 'Original publisher' },
        parent: null,
        ...overrides
      }}>
      <Form />
    </DocumentFormProvider>,
    { messages }
  );

const getDocument = () =>
  JSON.parse(screen.getByTestId('document-state').textContent);
const input = () => screen.getByRole('combobox', { name: /Parent document/ });
const search = async query => {
  const user = userEvent.setup();
  await user.clear(input());
  await user.type(input(), query);
  return user;
};

beforeEach(() => {
  vi.clearAllMocks();
  apiPost.mockResolvedValue({ results: [firstParent, secondParent] });
  apiGet.mockImplementation(async url => {
    if (url.includes('/languages'))
      return {
        languages: [
          { id: 'eng', refName: 'English' },
          { id: 'fra', refName: 'French' }
        ]
      };
    if (url.includes('/licenses')) return { licenses: [license] };
    if (url === `${getDocumentDetailsUrl}90`) return permission;
    if (url === `${getDocumentDetailsUrl}11`)
      return { ...secondParent, mainLanguage: 'eng' };
    return details;
  });
});

it('displays an existing parent without inheriting its metadata again', async () => {
  renderForm({ parent: firstParent });
  await waitFor(() => expect(input()).toHaveValue(firstParent.title));
  expect(input()).not.toHaveValue(expect.stringContaining('[Issue]'));
  expect(screen.getByTestId('NewspaperIcon')).toBeInTheDocument();
  expect(getDocument().editor.name).toBe('Original publisher');
  expect(
    apiGet.mock.calls.some(([url]) => url.startsWith(getDocumentDetailsUrl))
  ).toBe(false);
});

it.each([undefined, null, ''])(
  'can open the suggestions for a parent with title %s',
  async title => {
    renderForm({ parent: { id: 10, type: 'Issue', title } });
    await userEvent.setup().click(input());
    const option = await screen.findByRole('option', { name: /10/ });
    expect(within(option).getByTestId('NewspaperIcon')).toBeInTheDocument();
    expect(input()).toHaveValue('');
    expect(getDocument().parent.id).toBe(10);
  }
);

it.each([
  ['Article', 'Issue', 'NewspaperIcon'],
  ['Issue', 'Collection', 'BookmarksIcon']
])(
  'searches allowed parents for %s, excludes itself and uses the type icon',
  async (type, parentType, icon) => {
    apiPost.mockResolvedValue({
      results: [
        { ...firstParent, type: parentType },
        { ...firstParent, id: '7', title: 'Current document' }
      ]
    });
    renderForm({ type });
    const user = await search('First');
    const option = await screen.findByRole('option', { name: /First journal/ });
    expect(option).not.toHaveTextContent(`[${parentType}]`);
    expect(within(option).getByTestId(icon)).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: /Current document/ })
    ).not.toBeInTheDocument();
    expect(apiPost).toHaveBeenCalledWith(expect.any(String), {
      query: 'First',
      entities: ['documents'],
      filter: { type: parentType }
    });
    await user.keyboard('{ArrowDown}{Enter}');
    await waitFor(() =>
      expect(getDocument().authorizationDocument).toEqual(permission)
    );
    expect(getDocument().parent.id).toBe(10);
    expect(getDocument().mainLanguage).toBe('fra');
    expect(getDocument().mainLanguageName).toBe('French');
    expect(getDocument().license).toEqual(license);
    expect(getDocument().editor).toEqual(details.editor);
    expect(getDocument().library).toEqual(details.library);
    expect(getDocument().selectOptionAuthorizationDocument).toBe(
      DOCUMENT_AUTHORIZE_TO_PUBLISH
    );
  }
);

it('ignores a pending detail response after the parent is cleared', async () => {
  const defaultGet = apiGet.getMockImplementation();
  let resolveParent;
  apiGet.mockImplementation(url =>
    url === `${getDocumentDetailsUrl}10`
      ? new Promise(resolve => {
          resolveParent = resolve;
        })
      : defaultGet(url)
  );
  renderForm();
  const user = await search('First');
  await user.click(
    await screen.findByRole('option', { name: /First journal/ })
  );
  await waitFor(() => expect(resolveParent).toBeDefined());
  await user.click(
    within(screen.getByTestId('document-parent')).getByRole('button', {
      name: 'Clear'
    })
  );
  await act(async () => resolveParent(details));
  expect(getDocument().parent).toBeNull();
  expect(input()).toHaveValue('');
  expect(input()).toBeRequired();
  expect(getDocument().editor.name).toBe('Original publisher');
  expect(getDocument().mainLanguage).toBe('eng');
});

it('ignores a previous parent authorization when another parent is chosen', async () => {
  const defaultGet = apiGet.getMockImplementation();
  let resolvePermission;
  apiGet.mockImplementation(url =>
    url === `${getDocumentDetailsUrl}90`
      ? new Promise(resolve => {
          resolvePermission = resolve;
        })
      : defaultGet(url)
  );
  renderForm();
  const user = await search('First');
  await user.click(
    await screen.findByRole('option', { name: /First journal/ })
  );
  await waitFor(() => expect(resolvePermission).toBeDefined());
  await search('Second');
  await user.click(
    await screen.findByRole('option', { name: /Second journal/ })
  );
  await waitFor(() => expect(getDocument().parent.id).toBe(11));
  await act(async () => resolvePermission(permission));
  await waitFor(() => expect(getDocument().editor).toBeNull());
  expect(getDocument().authorizationDocument).toBeNull();
  expect(getDocument().selectOptionAuthorizationDocument).toBeNull();
  expect(getDocument().mainLanguage).toBe('eng');
});
