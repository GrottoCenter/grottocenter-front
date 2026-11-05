import { useContext } from 'react';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { apiPost } from '@/api/client';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import { AUTOCOMPLETE_DEBOUNCE_DELAY } from '@/conf/config';
import OrganizationSelect from '@/components/appli/OrganizationSelect';
import DocumentFormProvider, { DocumentFormContext } from './Document/Provider';
import AuthorsSection from './Document/formElements/AuthorsSection';

const state = vi.hoisted(() => ({
  online: true,
  matches: [],
  rejectSearch: false,
  onSuccess: vi.fn()
}));
vi.mock('@/api/client', () => ({ apiPost: vi.fn() }));
vi.mock('@/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useOnlineStatus: () => state.online,
  useUserProperties: () => ({ id: 1, nickname: 'Existing author' }),
  useNotification: () => ({ onSuccess: state.onSuccess }),
  useLanguages: () => ({
    isSuccess: true,
    data: [{ id: 'eng', refName: 'English' }]
  })
}));
vi.mock('./utils/CoordinateFormSection', () => ({ default: () => null }));

const parentSubmit = vi.fn(event => event.preventDefault());
const Form = () => {
  const { document, updateAttribute, allowEntityCreation } =
    useContext(DocumentFormContext);
  return (
    <form data-testid="document-form" onSubmit={parentSubmit}>
      <input
        aria-label="Document title"
        value={document.title}
        onChange={event => updateAttribute('title', event.target.value)}
      />
      <AuthorsSection />
      <OrganizationSelect
        value={document.editor}
        onChange={organization => updateAttribute('editor', organization)}
        label="Publisher"
        placeholder="Search publishers"
        allowCreation={allowEntityCreation}
        defaultType="EDITION"
        creationTestId="create-editor-search-button"
      />
      <OrganizationSelect
        value={document.library}
        onChange={organization => updateAttribute('library', organization)}
        label="Library"
        placeholder="Search libraries"
        allowCreation={allowEntityCreation}
        defaultType="LIBRARY"
        creationTestId="create-library-search-button"
      />
      <output data-testid="document-state">{JSON.stringify(document)}</output>
    </form>
  );
};

const renderForm = (allowEntityCreation = true) =>
  renderWithProviders(
    <MemoryRouter>
      <DocumentFormProvider
        allowEntityCreation={allowEntityCreation}
        initialValues={{
          id: 7,
          title: 'Document in progress',
          authors: [{ id: 1, nickname: 'Existing author' }],
          files: [{ id: 9, fileName: 'kept.pdf' }]
        }}>
        <Form />
      </DocumentFormProvider>
    </MemoryRouter>,
    {
      messages,
      preloadedState: {
        intl: { locale: 'en', AVAILABLE_LANGUAGES: { en: { id: 'eng' } } }
      }
    }
  );

const getDocument = () =>
  JSON.parse(screen.getByTestId('document-state').textContent);
const getDialog = () => within(screen.getByTestId('related-entity-dialog'));
const submit = () =>
  fireEvent.click(
    getDialog().getByRole('button', { name: 'Create and select' })
  );
const openAuthor = async (type = 'author') => {
  const user = userEvent.setup();
  const input = screen.getByRole('combobox', { name: 'Authors' });
  await user.click(input);
  if (input.value.trim().length < 2) await user.type(input, 'New author');
  if (input.getAttribute('aria-expanded') === 'false')
    await user.keyboard('{ArrowDown}');
  await user.click(
    await screen.findByRole('option', {
      name: type === 'author' ? 'Create an author' : 'Create an organization'
    })
  );
  await screen.findByTestId('related-entity-dialog');
};
const openOrganization = async context => {
  const user = userEvent.setup();
  const input = screen.getByRole('combobox', {
    name: context === 'editor' ? 'Publisher' : 'Library'
  });
  await user.click(input);
  if (input.value.trim().length < 2) await user.type(input, 'New organization');
  if (input.getAttribute('aria-expanded') === 'false')
    await user.keyboard('{ArrowDown}');
  await user.click(
    await screen.findByTestId(`create-${context}-search-button`)
  );
  await screen.findByTestId('related-entity-dialog');
};
const selectType = label => {
  fireEvent.mouseDown(
    getDialog().getByRole('combobox', { name: /Organization type/ })
  );
  fireEvent.click(screen.getByRole('option', { name: label }));
};
const writes = () =>
  apiPost.mock.calls.filter(([url]) => !url.endsWith('/search'));

beforeEach(() => {
  vi.clearAllMocks();
  state.online = true;
  state.matches = [];
  state.rejectSearch = false;
  apiPost.mockImplementation(async (url, body) => {
    if (url.endsWith('/search')) {
      if (state.rejectSearch) throw new Error('Search unavailable');
      return { results: state.matches };
    }
    if (url.endsWith('/cavers'))
      return {
        id: 42,
        nickname: `${body.name} ${body.surname}`,
        type: 'AUTHOR'
      };
    return { id: 42, name: body.name.text, type: body.type };
  });
});

it.each([
  ['Authors', 'create-author-search-button', 'persons'],
  ['Publisher', 'create-editor-search-button', 'organizations'],
  ['Library', 'create-library-search-button', 'organizations']
])(
  'offers creation in %s after a two-character search completes',
  async (label, testId, entityType) => {
    let resolveSearch;
    apiPost.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveSearch = resolve;
        })
    );
    renderForm();
    const user = userEvent.setup();
    const input = screen.getByRole('combobox', { name: label });
    await user.click(input);
    expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
    expect(screen.getByText('Type at least 2 character(s)')).toBeVisible();
    await user.type(input, ' L ');
    // Let the real debounce expire to verify that whitespace cannot reach the
    // search threshold. No request should be made for this one-letter input.
    await act(
      () =>
        new Promise(resolve => {
          setTimeout(resolve, AUTOCOMPLETE_DEBOUNCE_DELAY + 50);
        })
    );
    expect(apiPost).not.toHaveBeenCalled();
    expect(screen.queryByTestId(testId)).not.toBeInTheDocument();

    await user.clear(input);
    await user.type(input, ' Li ');
    await waitFor(() => expect(resolveSearch).toBeDefined());
    expect(apiPost).toHaveBeenCalledWith(
      expect.stringContaining('/search'),
      expect.objectContaining({ query: 'Li' })
    );
    expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
    await act(async () =>
      resolveSearch({
        results: [{ id: 88, name: 'Li', nickname: 'Li', _type: entityType }]
      })
    );
    expect(await screen.findByTestId(testId)).toBeVisible();
    expect(screen.getByRole('option', { name: /Li 88/ })).toBeVisible();
    if (entityType === 'persons')
      expect(
        screen.getByTestId('create-author-organization-search-button')
      ).toBeVisible();

    // An old response must not enable creation for an unfinished new query,
    // nor after the user deletes text back below the threshold.
    await user.type(input, 'x');
    expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
    await user.clear(input);
    await user.type(input, ' L ');
    expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
    expect(writes()).toHaveLength(0);
  }
);

it('keeps creation available when the selection search fails', async () => {
  state.rejectSearch = true;
  renderForm();
  await userEvent
    .setup()
    .type(screen.getByRole('combobox', { name: 'Authors' }), 'Li');
  expect(
    await screen.findByTestId('create-author-search-button')
  ).toBeVisible();
  expect(
    screen.getByTestId('create-author-organization-search-button')
  ).toBeVisible();
  expect(writes()).toHaveLength(0);
});

it('prefills the author surname from the search, allows correction and adds it without submitting the document', async () => {
  renderForm();
  const authorsInput = screen.getByRole('combobox', { name: 'Authors' });
  await userEvent.setup().type(authorsInput, 'Jane Doe');
  await openAuthor();
  expect(getDialog().getByText('Searched name: Jane Doe')).toBeVisible();
  expect(getDialog().getByLabelText(/First name/)).toHaveValue('');
  expect(getDialog().getByLabelText(/Surname/)).toHaveValue('Jane Doe');
  expect(screen.getByTestId('document-form').querySelector('form')).toBeNull();
  submit();
  await waitFor(() =>
    expect(getDialog().getByLabelText(/First name/)).toHaveFocus()
  );
  expect(writes()).toHaveLength(0);
  fireEvent.change(getDialog().getByLabelText(/First name/), {
    target: { value: '  ' }
  });
  fireEvent.change(getDialog().getByLabelText(/Surname/), {
    target: { value: 'Doe' }
  });
  submit();
  await waitFor(() =>
    expect(getDialog().getByLabelText(/First name/)).toHaveAttribute(
      'aria-invalid',
      'true'
    )
  );
  expect(writes()).toHaveLength(0);
  fireEvent.change(getDialog().getByLabelText(/First name/), {
    target: { value: ' Jane ' }
  });
  await userEvent
    .setup()
    .type(getDialog().getByLabelText(/Surname/), '{Enter}');
  await waitFor(() =>
    expect(
      screen.queryByTestId('related-entity-dialog')
    ).not.toBeInTheDocument()
  );
  expect(writes()).toEqual([
    [expect.stringContaining('/cavers'), { name: 'Jane', surname: 'Doe' }]
  ]);
  expect(getDocument().authors.map(author => author.id)).toEqual([1, 42]);
  expect(getDocument().title).toBe('Document in progress');
  expect(getDocument().files[0].fileName).toBe('kept.pdf');
  expect(parentSubmit).not.toHaveBeenCalled();
  await waitFor(() => expect(authorsInput).toHaveFocus());
});

it.each([
  ['editor', 'EDITION'],
  ['library', 'LIBRARY']
])(
  'creates from %s with an editable default type and no country',
  async (context, expectedType) => {
    renderForm();
    await userEvent.setup().type(
      screen.getByRole('combobox', {
        name: context === 'editor' ? 'Publisher' : 'Library'
      }),
      'New club'
    );
    await openOrganization(context);
    expect(getDialog().getByLabelText(/Organization name/)).toHaveValue(
      'New club'
    );
    expect(
      getDialog().getByTestId('organization-type-field').querySelector('input')
    ).toHaveValue(expectedType);
    expect(
      getDialog().getByRole('combobox', { name: /Country/ })
    ).not.toHaveAttribute('aria-required', 'true');
    selectType('Caving group');
    submit();
    await waitFor(() =>
      expect(
        screen.queryByTestId('related-entity-dialog')
      ).not.toBeInTheDocument()
    );
    expect(writes()).toEqual([
      [
        expect.stringContaining('/organizations'),
        expect.objectContaining({
          name: { text: 'New club', language: 'eng' },
          type: 'SPELEOLOGY',
          country: { id: null }
        })
      ]
    ]);
    expect(getDocument()[context].id).toBe(42);
    expect(getDocument().authors).toEqual([
      { id: 1, nickname: 'Existing author' }
    ]);
    expect(
      screen.getByRole('combobox', {
        name: context === 'editor' ? 'Publisher' : 'Library'
      })
    ).toHaveValue('New club');
    expect(parentSubmit).not.toHaveBeenCalled();
  }
);

it('requires an explicit type for an organization author without looking for duplicates in the dialog', async () => {
  renderForm();
  await openAuthor('organization');
  fireEvent.change(getDialog().getByLabelText(/Organization name/), {
    target: { value: 'New organization' }
  });
  submit();
  await waitFor(() =>
    expect(
      getDialog().getByRole('combobox', { name: /Organization type/ })
    ).toHaveFocus()
  );
  expect(writes()).toHaveLength(0);
  expect(
    getDialog().queryByTestId('entity-name-suggestions')
  ).not.toBeInTheDocument();
  expect(getDialog().queryByLabelText('Email')).not.toBeInTheDocument();
  expect(
    getDialog().queryByRole('button', { name: 'Additional information' })
  ).not.toBeInTheDocument();
  selectType('Other');
  submit();
  await waitFor(() =>
    expect(getDocument().authorsOrganization).toHaveLength(1)
  );
});

it('validates the URL, retains values on rejection and retries', async () => {
  const successfulPost = apiPost.getMockImplementation();
  let hasRejected = false;
  apiPost.mockImplementation(async (url, body) => {
    if (url.endsWith('/organizations') && !hasRejected) {
      hasRejected = true;
      throw Object.assign(new Error('Private detail'), { status: 500 });
    }
    return successfulPost(url, body);
  });
  renderForm();
  await openOrganization('editor');
  fireEvent.change(getDialog().getByLabelText(/Organization name/), {
    target: { value: 'Organization retained' }
  });
  fireEvent.change(getDialog().getByLabelText('URL'), {
    target: { value: 'invalid' }
  });
  submit();
  expect(await getDialog().findByText('The URL must be valid.')).toBeVisible();
  await waitFor(() => expect(getDialog().getByLabelText('URL')).toHaveFocus());
  expect(writes()).toHaveLength(0);
  fireEvent.change(getDialog().getByLabelText('URL'), {
    target: { value: 'https://example.org' }
  });
  submit();
  await getDialog().findByText('A server error occurred');
  expect(getDialog().getByLabelText(/Organization name/)).toHaveValue(
    'Organization retained'
  );
  expect(screen.queryByText('Private detail')).not.toBeInTheDocument();
  submit();
  await waitFor(() =>
    expect(
      screen.queryByTestId('related-entity-dialog')
    ).not.toBeInTheDocument()
  );
  expect(getDocument().editor.id).toBe(42);
});

it('cancels a dirty creation directly and opens the next creation fresh', async () => {
  renderForm();
  await openAuthor();
  fireEvent.change(getDialog().getByLabelText(/First name/), {
    target: { value: 'Unsaved' }
  });
  fireEvent.click(getDialog().getByRole('button', { name: 'Cancel' }));
  await waitFor(() =>
    expect(
      screen.queryByTestId('related-entity-dialog')
    ).not.toBeInTheDocument()
  );
  expect(screen.queryByText('Discard changes?')).not.toBeInTheDocument();
  expect(getDocument().authors).toHaveLength(1);
  await openAuthor();
  expect(getDialog().getByLabelText(/First name/)).toHaveValue('');
});

it('opens creation directly with the arrow keys and Enter without selecting an action or submitting the document', async () => {
  renderForm();
  const user = userEvent.setup();
  await user.type(
    screen.getByRole('combobox', { name: 'Publisher' }),
    'Keyboard publisher'
  );
  await screen.findByTestId('create-editor-search-button');
  await user.keyboard('{ArrowDown}{Enter}');
  expect(getDialog().getByLabelText(/Organization name/)).toHaveValue(
    'Keyboard publisher'
  );
  expect(getDocument().editor).toBeNull();
  expect(parentSubmit).not.toHaveBeenCalled();
});

it('offers both creation actions only in the authors list and opens the second one with the keyboard', async () => {
  renderForm();
  expect(
    screen.queryByRole('button', { name: /^Create/ })
  ).not.toBeInTheDocument();
  const user = userEvent.setup();
  await user.type(
    screen.getByRole('combobox', { name: 'Authors' }),
    'New club'
  );
  expect(
    await screen.findByRole('option', { name: 'Create an author' })
  ).toBeVisible();
  expect(
    await screen.findByRole('option', { name: 'Create an organization' })
  ).toBeVisible();
  await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
  expect(getDialog().getByLabelText(/Organization name/)).toHaveValue(
    'New club'
  );
  expect(getDocument().authorsOrganization).toHaveLength(0);
  expect(writes()).toHaveLength(0);
  expect(parentSubmit).not.toHaveBeenCalled();
});

it('still selects an existing author with the keyboard', async () => {
  state.matches = [
    { id: 88, nickname: 'Jane Doe', _type: 'persons', type: 'AUTHOR' }
  ];
  renderForm();
  const user = userEvent.setup();
  await user.type(screen.getByRole('combobox', { name: 'Authors' }), 'Jane');
  await screen.findByRole('option', { name: /Jane Doe/ });
  await user.keyboard('{ArrowDown}{Enter}');
  expect(getDocument().authors.map(author => author.id)).toEqual([1, 88]);
  expect(screen.queryByTestId('related-entity-dialog')).not.toBeInTheDocument();
  expect(writes()).toHaveLength(0);
});

it('keeps the selected publisher during an unfinished replacement search', async () => {
  state.matches = [
    { id: 88, name: 'Existing publisher', _type: 'organizations' }
  ];
  renderForm();
  const user = userEvent.setup();
  const input = screen.getByRole('combobox', { name: 'Publisher' });
  await user.type(input, 'Existing');
  await user.click(
    await screen.findByRole('option', { name: /Existing publisher/ })
  );
  await waitFor(() => expect(input).toHaveValue('Existing publisher'));
  await user.type(input, ' replacement');
  expect(input).toHaveValue('Existing publisher replacement');
  expect(getDocument().editor.id).toBe(88);
  await user.tab();
  expect(input).toHaveValue('Existing publisher');
  expect(getDocument().editor.id).toBe(88);
  expect(writes()).toHaveLength(0);
});

it('blocks repeated submission and closure while pending', async () => {
  const successfulPost = apiPost.getMockImplementation();
  let resolveCreation;
  apiPost.mockImplementation((url, body) =>
    url.endsWith('/organizations')
      ? new Promise(resolve => {
          resolveCreation = resolve;
        })
      : successfulPost(url, body)
  );
  renderForm();
  await openOrganization('library');
  fireEvent.change(getDialog().getByLabelText(/Organization name/), {
    target: { value: 'Pending organization' }
  });
  submit();
  await waitFor(() => expect(writes()).toHaveLength(1));
  expect(
    getDialog().getByRole('button', { name: 'Create and select' })
  ).toBeDisabled();
  expect(getDialog().getByRole('button', { name: 'Cancel' })).toBeDisabled();
  fireEvent.click(getDialog().getByRole('button', { name: 'Cancel' }));
  fireEvent.submit(screen.getByTestId('related-entity-dialog'));
  expect(screen.getByTestId('related-entity-dialog')).toBeVisible();
  await act(async () =>
    resolveCreation({ id: 42, name: 'Pending organization', type: 'LIBRARY' })
  );
  expect(writes()).toHaveLength(1);
});

it('prevents direct offline submission', async () => {
  state.online = false;
  renderForm();
  await openOrganization('editor');
  fireEvent.change(getDialog().getByLabelText(/Organization name/), {
    target: { value: 'Offline organization' }
  });
  expect(
    getDialog().getByRole('button', { name: 'Create and select' })
  ).toBeDisabled();
  await act(async () =>
    fireEvent.submit(screen.getByTestId('related-entity-dialog'))
  );
  expect(writes()).toHaveLength(0);
});

it('allows existing selections without creation controls in moderation', async () => {
  state.matches = [
    { id: 88, name: 'Existing organization', _type: 'organizations' }
  ];
  renderForm(false);
  await userEvent
    .setup()
    .click(screen.getByRole('combobox', { name: 'Authors' }));
  expect(
    screen.queryByTestId('create-author-search-button')
  ).not.toBeInTheDocument();
  expect(
    screen.queryByTestId('create-author-organization-search-button')
  ).not.toBeInTheDocument();
  await userEvent
    .setup()
    .type(screen.getByRole('combobox', { name: 'Publisher' }), 'Existing');
  expect(
    screen.queryByTestId('create-editor-search-button')
  ).not.toBeInTheDocument();
  fireEvent.click(
    await screen.findByRole('option', { name: /Existing organization/ })
  );
  expect(getDocument().editor.id).toBe(88);
  expect(writes()).toHaveLength(0);
});
