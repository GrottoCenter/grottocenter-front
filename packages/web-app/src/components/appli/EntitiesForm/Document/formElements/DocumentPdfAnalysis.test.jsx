import { useContext } from 'react';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import { WritableStream } from 'node:stream/web';

import { apiPost } from '@/api/client';
import renderWithProviders from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import DocumentFormProvider, { DocumentFormContext } from '../Provider';
import { IS_INTACT, IS_NEW } from './AddFileForm/FileHelpers';
import PublicationDatePicker from './PublicationDatePicker';
import DocumentPdfAnalysis from './DocumentPdfAnalysis';

vi.mock('@/api/client', () => ({ apiPost: vi.fn() }));
const permissions = vi.hoisted(() => ({ isAuth: true, isModerator: false }));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => permissions
}));
vi.mock('@/hooks/queries/useLanguages', () => ({
  useLanguages: () => ({
    data: [
      { id: 'eng', refName: 'English' },
      { id: 'fra', refName: 'French' },
      { id: 'cat', refName: 'Catalan' }
    ],
    isPending: false
  })
}));

const file = new File(['%PDF first'], 'book.pdf', { type: 'application/pdf' });
const replacement = new File(['%PDF second'], 'book.pdf', {
  type: 'application/pdf'
});
const hostedFile = {
  id: 7,
  fileName: 'hosted.pdf',
  completePath: 'https://files.example.org/hosted.pdf'
};
const hostedReplacement = {
  ...hostedFile,
  completePath: 'https://files.example.org/replacement.pdf'
};
const entry = source => ({
  file: source,
  fileName: source.name,
  state: IS_NEW
});
const oversized = new File(['%PDF'], 'oversized.pdf', {
  type: 'application/pdf'
});
Object.defineProperty(oversized, 'size', { value: 60 * 1024 * 1024 + 1 });

const Form = () => {
  const { document, updateAttribute } = useContext(DocumentFormContext);
  return (
    <>
      <button
        type="button"
        onClick={() => updateAttribute('files', [entry(file)])}>
        Attach PDF
      </button>
      <button type="button" onClick={() => updateAttribute('files', [])}>
        Remove PDF
      </button>
      <button
        type="button"
        onClick={() => updateAttribute('files', [entry(replacement)])}>
        Replace PDF
      </button>
      <button
        type="button"
        onClick={() => updateAttribute('files', [entry(oversized)])}>
        Attach oversized PDF
      </button>
      <button
        type="button"
        onClick={() =>
          updateAttribute(
            'files',
            document.files.map(item => ({ ...item, pdfPageOffset: 2 }))
          )
        }>
        Adjust PDF page offset
      </button>
      <button
        type="button"
        onClick={() => updateAttribute('files', [hostedReplacement])}>
        Replace hosted PDF
      </button>
      <button
        type="button"
        onClick={() => updateAttribute('datePublication', '2015-03')}>
        Set existing date
      </button>
      <textarea
        aria-label="Summary"
        value={document.description}
        onChange={event => updateAttribute('description', event.target.value)}
      />
      <input
        aria-label="Title"
        data-testid="manual-title"
        value={document.title}
        onChange={event => updateAttribute('title', event.target.value)}
      />
      <output data-testid="main-language">{document.mainLanguage}</output>
      <PublicationDatePicker />
      <output data-testid="publication-date">{document.datePublication}</output>
      <output data-testid="attachment-state">
        {document.files.map(item => item.state).join(',')}
      </output>
      {document.files.map(item => (
        <DocumentPdfAnalysis key={item.fileName} file={item.file ?? item} />
      ))}
    </>
  );
};

const renderForm = initialValues =>
  renderWithProviders(
    <DocumentFormProvider initialValues={initialValues}>
      <Form />
    </DocumentFormProvider>,
    { messages }
  );
const answer = (descriptions, date = '2010', metadata = {}) =>
  new Response(
    JSON.stringify({
      message: 'success',
      document_metadata: [
        { descriptions, publication_date: date, ...metadata },
        { parent: 'Book', descriptions: ['Inherited summary'] }
      ]
    })
  );
const openConfirmation = () => {
  fireEvent.click(screen.getByText('Attach PDF'));
  fireEvent.click(screen.getByTestId('document-ai-analyze'));
};
const startAnalysis = () => {
  openConfirmation();
  fireEvent.click(screen.getByTestId('document-ai-confirm'));
};
const selectSummary = () =>
  fireEvent.click(
    screen.getByRole('checkbox', {
      name: messages['Summary of document content']
    })
  );
const selectDate = () =>
  fireEvent.click(
    screen.getByRole('checkbox', { name: messages['Publication Date'] })
  );

beforeEach(() => {
  vi.clearAllMocks();
  // JSDOM lacks Web Streams; Response bodies use Node's native implementation.
  vi.stubGlobal('WritableStream', WritableStream);
  Object.assign(permissions, { isAuth: true, isModerator: false });
  apiPost.mockResolvedValue({ token: 'documents-token' });
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () => answer(['AI summary']))
  );
});
afterEach(() => vi.unstubAllGlobals());

it('explains AI and all limits before requesting authorization or uploading', () => {
  renderForm();
  openConfirmation();
  expect(screen.getByRole('dialog')).toHaveTextContent(
    'Your account: 5 analyses per day, 2 at a time.'
  );
  expect(screen.getByRole('dialog')).toHaveTextContent(
    '200 analyses per day (provisional limit)'
  );
  expect(screen.getByRole('dialog')).toHaveTextContent('60 MB and 300 pages');
  expect(apiPost).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Close' })).toHaveClass(
    'MuiButton-outlined'
  );
});

it('explicitly selects summary and date and synchronizes the mounted date precision', async () => {
  renderForm();
  fireEvent.click(screen.getByText('Set existing date'));
  fireEvent.change(screen.getByLabelText('Summary'), {
    target: { value: 'Manual summary' }
  });
  startAnalysis();
  await screen.findByText('AI summary');
  expect(screen.getByTestId('document-ai-apply')).toBeDisabled();
  expect(screen.getByLabelText('Summary')).toHaveValue('Manual summary');
  expect(screen.getByTestId('publication-date')).toHaveTextContent('2015-03');
  expect(screen.queryByText('Inherited summary')).not.toBeInTheDocument();
  selectSummary();
  selectDate();
  expect(screen.getByTestId('document-ai-selection')).toHaveTextContent(
    '2 replacements'
  );
  fireEvent.click(screen.getByTestId('document-ai-apply'));
  expect(screen.getByLabelText('Summary')).toHaveValue('AI summary');
  expect(screen.getByTestId('publication-date')).toHaveTextContent('2010');
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Year', exact: true })
    ).toHaveAttribute('aria-pressed', 'true')
  );
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
});

it.each(['date', 'summary'])(
  'applies only the selected %s field',
  async field => {
    renderForm();
    fireEvent.click(screen.getByText('Set existing date'));
    fireEvent.change(screen.getByLabelText('Summary'), {
      target: { value: 'Manual summary' }
    });
    startAnalysis();
    await screen.findByText('AI summary');
    if (field === 'date') selectDate();
    else selectSummary();
    fireEvent.click(screen.getByTestId('document-ai-apply'));
    expect(screen.getByLabelText('Summary')).toHaveValue(
      field === 'date' ? 'Manual summary' : 'AI summary'
    );
    expect(screen.getByTestId('publication-date')).toHaveTextContent(
      field === 'date' ? '2010' : '2015-03'
    );
  }
);

it('applies only the selected title and language when these are the only suggestions', async () => {
  fetch.mockResolvedValue(
    answer([], null, { title: 'Suggested title', languages: ['cat'] })
  );
  renderForm({
    id: 12,
    type: 'Book',
    title: 'Original title',
    mainLanguage: 'fra',
    description: 'Original summary',
    datePublication: '2015'
  });
  startAnalysis();
  await screen.findByText('Suggested title');
  expect(screen.getByTestId('document-ai-apply')).toBeDisabled();
  expect(screen.getByTestId('manual-title')).toHaveValue('Original title');
  fireEvent.click(screen.getByRole('checkbox', { name: messages.Title }));
  fireEvent.click(
    screen.getByRole('checkbox', { name: messages['Document main language'] })
  );
  fireEvent.click(screen.getByTestId('document-ai-apply'));
  expect(screen.getByTestId('manual-title')).toHaveValue('Suggested title');
  expect(screen.getByTestId('main-language')).toHaveTextContent('cat');
  expect(screen.getByLabelText('Summary')).toHaveValue('Original summary');
  expect(screen.getByTestId('publication-date')).toHaveTextContent('2015');
});

it('chooses among recognized suggested languages and leaves the unselected title untouched', async () => {
  fetch.mockResolvedValue(
    answer([], null, {
      title: 'Unused title',
      languages: ['zzz', 'cat', 'eng']
    })
  );
  renderForm();
  startAnalysis();
  await screen.findByText('Unused title');
  fireEvent.mouseDown(
    screen.getByRole('combobox', { name: messages['Document main language'] })
  );
  fireEvent.click(screen.getByRole('option', { name: 'English' }));
  fireEvent.click(
    screen.getByRole('checkbox', { name: messages['Document main language'] })
  );
  fireEvent.click(screen.getByTestId('document-ai-apply'));
  expect(screen.getByTestId('manual-title')).toHaveValue('');
  expect(screen.getByTestId('main-language')).toHaveTextContent('eng');
});

it('does not offer unrecognized language IDs', async () => {
  fetch.mockResolvedValue(answer([], null, { languages: ['zzz'] }));
  renderForm();
  startAnalysis();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    messages['documentAi.empty']
  );
  expect(
    screen.queryByRole('checkbox', { name: messages['Document main language'] })
  ).not.toBeInTheDocument();
});

it('strikes through only selected replacements and keeps additions free of redundant statuses', async () => {
  fetch.mockResolvedValue(
    answer(['Suggested summary'], null, { title: 'Suggested title' })
  );
  renderForm({ title: 'Original title' });
  startAnalysis();
  const titleRow = await screen.findByTestId('document-ai-field-title');
  expect(
    within(titleRow).getByTestId('document-ai-current-value')
  ).toHaveTextContent('Original title');
  expect(
    within(titleRow).getByTestId('document-ai-proposed-value')
  ).toHaveTextContent('Suggested title');
  const summaryRow = screen.getByTestId('document-ai-field-description');
  expect(
    within(summaryRow).getByTestId('document-ai-current-text')
  ).toHaveTextContent('-');
  expect(screen.getByTestId('document-ai-selection')).toBeEmptyDOMElement();
  expect(titleRow.querySelector('del')).not.toBeInTheDocument();
  fireEvent.click(within(titleRow).getByRole('checkbox'));
  selectSummary();
  expect(titleRow.querySelector('del')).toHaveTextContent('Original title');
  expect(summaryRow.querySelector('del')).not.toBeInTheDocument();
  expect(titleRow).not.toHaveTextContent('Replacement');
  expect(summaryRow).not.toHaveTextContent('Addition');
  expect(screen.getByTestId('document-ai-selection')).toHaveTextContent(
    '2 fields selected'
  );
  expect(screen.getByTestId('document-ai-selection')).toHaveTextContent(
    '1 replacement'
  );
  fireEvent.click(within(titleRow).getByRole('checkbox'));
  expect(titleRow.querySelector('del')).not.toBeInTheDocument();
  expect(screen.getByTestId('document-ai-selection')).not.toHaveTextContent(
    'replacement'
  );
  fireEvent.click(screen.getByTestId('document-ai-apply'));
  expect(screen.getByTestId('manual-title')).toHaveValue('Original title');
  expect(screen.getByLabelText('Summary')).toHaveValue('Suggested summary');
});

it('labels identical results without offering a redundant overwrite', async () => {
  fetch.mockResolvedValue(
    answer(['Existing summary'], '2015', {
      title: 'Existing title',
      languages: ['eng']
    })
  );
  renderForm({
    title: 'Existing title',
    description: 'Existing summary',
    datePublication: '2015',
    mainLanguage: 'eng'
  });
  startAnalysis();
  const titleRow = await screen.findByTestId('document-ai-field-title');
  expect(
    within(titleRow).getByTestId('document-ai-current-value')
  ).toHaveTextContent('Existing title');
  expect(
    within(titleRow).getByTestId('document-ai-proposed-value')
  ).toHaveAttribute(
    'aria-label',
    `${messages['documentAi.proposedValue']}: ${messages['documentAi.identical']}`
  );
  expect(
    within(titleRow).getByTestId('document-ai-value-title')
  ).toHaveTextContent('-');
  expect(titleRow.querySelector('del')).not.toBeInTheDocument();
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  expect(screen.getByTestId('document-ai-selection')).toHaveTextContent(
    messages['documentAi.noChanges']
  );
  expect(screen.getByTestId('document-ai-apply')).toBeDisabled();
});

it('allows choosing a different language even if the first suggestion matches the current value', async () => {
  fetch.mockResolvedValue(answer([], null, { languages: ['eng', 'cat'] }));
  renderForm({ mainLanguage: 'eng' });
  startAnalysis();
  const languageRow = await screen.findByTestId(
    'document-ai-field-mainLanguage'
  );
  expect(within(languageRow).queryByRole('checkbox')).not.toBeInTheDocument();
  fireEvent.mouseDown(within(languageRow).getByRole('combobox'));
  fireEvent.click(screen.getByRole('option', { name: 'Catalan' }));
  fireEvent.click(within(languageRow).getByRole('checkbox'));
  expect(screen.getByTestId('document-ai-selection')).toHaveTextContent(
    '1 replacement'
  );
  fireEvent.mouseDown(within(languageRow).getByRole('combobox'));
  fireEvent.click(screen.getByRole('option', { name: 'English' }));
  expect(screen.getByTestId('document-ai-apply')).toBeDisabled();
  expect(screen.getByTestId('document-ai-selection')).toHaveTextContent(
    messages['documentAi.noChanges']
  );
});

it('uses outlined relaunch and a short apply label with icons', async () => {
  renderForm();
  startAnalysis();
  await screen.findByText('AI summary');
  const relaunch = screen.getByRole('button', {
    name: messages['documentAi.newAnalysis']
  });
  expect(relaunch).toHaveClass('MuiButton-outlined');
  expect(relaunch.querySelector('svg')).not.toBeNull();
  expect(screen.getByTestId('document-ai-apply')).toHaveTextContent('Apply');
  expect(
    screen.getByTestId('document-ai-apply').querySelector('svg')
  ).not.toBeNull();
  fireEvent.click(relaunch);
  await screen.findByTestId('document-ai-confirm');
  expect(apiPost).toHaveBeenCalledOnce();
});

it('refuses oversized PDFs before requesting a token', () => {
  renderForm();
  fireEvent.click(screen.getByText('Attach oversized PDF'));
  fireEvent.click(screen.getByTestId('document-ai-analyze'));
  expect(screen.getByTestId('document-ai-confirm')).toBeDisabled();
  expect(screen.getByRole('alert')).toHaveTextContent('60 MB');
  expect(apiPost).not.toHaveBeenCalled();
});

it.each(['removed', 'replaced'])(
  'ignores a late result after the PDF is %s',
  async action => {
    let resolve;
    fetch.mockReturnValue(
      new Promise(done => {
        resolve = done;
      })
    );
    renderForm();
    startAnalysis();
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    const { signal } = fetch.mock.calls[0][1];
    fireEvent.click(
      screen.getByText(action === 'removed' ? 'Remove PDF' : 'Replace PDF')
    );
    expect(signal.aborted).toBe(true);
    await act(async () => resolve(answer(['Too late'])));
    expect(screen.queryByText('Too late')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Summary')).toHaveValue('');
  }
);

it('stops waiting and ignores a late response', async () => {
  let resolve;
  fetch.mockReturnValue(
    new Promise(done => {
      resolve = done;
    })
  );
  renderForm();
  startAnalysis();
  await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
  await act(async () => resolve(answer(['Too late'])));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
  expect(
    screen.queryByTestId('document-ai-suggestions')
  ).not.toBeInTheDocument();
});

it.each(['Escape', 'backdrop'])(
  'ignores %s while pending but allows dismissal after completion',
  async action => {
    let resolve;
    fetch.mockReturnValue(
      new Promise(done => {
        resolve = done;
      })
    );
    renderForm();
    startAnalysis();
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    const { signal } = fetch.mock.calls[0][1];
    const dismiss = () => {
      const dialog = screen.getByRole('dialog');
      if (action === 'Escape') {
        fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
      } else {
        fireEvent.mouseDown(dialog.parentElement);
        fireEvent.click(dialog.parentElement);
      }
    };
    dismiss();
    expect(signal.aborted).toBe(false);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    await act(async () => resolve(answer(['AI summary'])));
    await screen.findByText('AI summary');
    dismiss();
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(signal.aborted).toBe(false);
  }
);

it.each([
  [401, 'documentAi.authError'],
  [413, 'documentAi.invalidPdf'],
  [422, 'documentAi.invalidPdf'],
  [429, 'documentAi.quota'],
  [503, 'documentAi.unavailable'],
  [504, 'documentAi.timeout']
])('reports %s inline and preserves input', async (status, key) => {
  fetch.mockResolvedValue(new Response('{}', { status }));
  renderForm();
  fireEvent.change(screen.getByLabelText('Summary'), {
    target: { value: 'Manual summary' }
  });
  startAnalysis();
  expect(await screen.findByRole('alert')).toHaveTextContent(messages[key]);
  expect(screen.getByLabelText('Summary')).toHaveValue('Manual summary');
});

it('reports a response with neither a summary nor a date', async () => {
  fetch.mockResolvedValue(answer([], null));
  renderForm();
  startAnalysis();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    messages['documentAi.empty']
  );
  expect(screen.queryByTestId('document-ai-apply')).not.toBeInTheDocument();
});

it('hides analysis when logged out', () => {
  permissions.isAuth = false;
  renderForm();
  fireEvent.click(screen.getByText('Attach PDF'));
  expect(screen.queryByTestId('document-ai')).not.toBeInTheDocument();
});

it('allows a regular user to analyze a newly attached PDF while editing', async () => {
  renderForm({ id: 12, type: 'Book', title: 'Book' });
  startAnalysis();
  await screen.findByText('AI summary');
  selectSummary();
  fireEvent.click(screen.getByTestId('document-ai-apply'));
  expect(screen.getByLabelText('Summary')).toHaveValue('AI summary');
});

it('analyzes an existing attachment and applies selected fields without replacing the file', async () => {
  fetch.mockImplementation(async url =>
    url === hostedFile.completePath
      ? new Response('%PDF stored')
      : answer(['AI summary'])
  );
  renderForm({
    id: 12,
    type: 'Book',
    title: 'Book',
    description: 'Existing summary',
    datePublication: '2015',
    files: [hostedFile]
  });
  fireEvent.click(screen.getByTestId('document-ai-analyze'));
  expect(fetch).not.toHaveBeenCalled();
  expect(screen.getByRole('dialog')).toHaveTextContent(hostedFile.fileName);
  fireEvent.click(screen.getByTestId('document-ai-confirm'));
  await screen.findByText('AI summary');
  selectDate();
  fireEvent.click(screen.getByTestId('document-ai-apply'));
  expect(screen.getByLabelText('Summary')).toHaveValue('Existing summary');
  expect(screen.getByTestId('publication-date')).toHaveTextContent('2010');
  expect(screen.getByTestId('attachment-state')).toHaveTextContent(IS_INTACT);
});

it('preserves hosted suggestions and selection after closing and editing the page offset', async () => {
  fetch.mockImplementation(async url =>
    url === hostedFile.completePath
      ? new Response('%PDF stored')
      : answer(['AI summary'])
  );
  renderForm({ files: [hostedFile] });
  fireEvent.click(screen.getByTestId('document-ai-analyze'));
  fireEvent.click(screen.getByTestId('document-ai-confirm'));
  await screen.findByText('AI summary');
  selectSummary();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
  fireEvent.click(screen.getByText('Adjust PDF page offset'));
  fireEvent.click(screen.getByTestId('document-ai-analyze'));
  expect(screen.getByText('AI summary')).toBeInTheDocument();
  expect(
    screen.getByRole('checkbox', {
      name: messages['Summary of document content']
    })
  ).toBeChecked();
  expect(apiPost).toHaveBeenCalledOnce();
  expect(fetch).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByTestId('document-ai-apply'));
  expect(screen.getByLabelText('Summary')).toHaveValue('AI summary');
});

it.each(['offset', 'replacement'])(
  'keeps a hosted analysis only when its URL is unchanged by a %s edit',
  async action => {
    let resolve;
    fetch.mockImplementation(url =>
      url === hostedFile.completePath
        ? Promise.resolve(new Response('%PDF stored'))
        : new Promise(done => {
            resolve = done;
          })
    );
    renderForm({ files: [hostedFile] });
    fireEvent.click(screen.getByTestId('document-ai-analyze'));
    fireEvent.click(screen.getByTestId('document-ai-confirm'));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    const { signal } = fetch.mock.calls[1][1];
    fireEvent.click(
      screen.getByText(
        action === 'offset' ? 'Adjust PDF page offset' : 'Replace hosted PDF'
      )
    );
    expect(signal.aborted).toBe(action === 'replacement');
    await act(async () => resolve(answer(['AI summary'])));
    if (action === 'offset') {
      await screen.findByText('AI summary');
      expect(apiPost).toHaveBeenCalledOnce();
      expect(fetch).toHaveBeenCalledTimes(2);
    } else {
      expect(screen.queryByText('AI summary')).not.toBeInTheDocument();
      expect(screen.getByTestId('document-ai-confirm')).toBeInTheDocument();
    }
  }
);
