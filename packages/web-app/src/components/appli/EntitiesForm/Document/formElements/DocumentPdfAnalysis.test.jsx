import { useContext } from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';

import { apiPost } from '@/api/client';
import renderWithProviders from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import DocumentFormProvider, { DocumentFormContext } from '../Provider';
import { IS_NEW } from './AddFileForm/FileHelpers';
import PublicationDatePicker from './PublicationDatePicker';
import DocumentPdfAnalysis from './DocumentPdfAnalysis';

vi.mock('@/api/client', () => ({ apiPost: vi.fn() }));
const permissions = vi.hoisted(() => ({ isAuth: true, isModerator: true }));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => permissions
}));

const file = new File(['%PDF first'], 'book.pdf', { type: 'application/pdf' });
const replacement = new File(['%PDF second'], 'book.pdf', {
  type: 'application/pdf'
});
const entry = source => ({
  file: source,
  fileName: source.name,
  state: IS_NEW
});
const oversized = new File(['%PDF'], 'oversized.pdf', {
  type: 'application/pdf'
});
Object.defineProperty(oversized, 'size', { value: 50000001 });

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
        onClick={() => updateAttribute('datePublication', '2015-03')}>
        Set existing date
      </button>
      <textarea
        aria-label="Summary"
        value={document.description}
        onChange={event => updateAttribute('description', event.target.value)}
      />
      <PublicationDatePicker />
      <output data-testid="publication-date">{document.datePublication}</output>
      {document.files.map(item => (
        <DocumentPdfAnalysis key={item.fileName} file={item.file} />
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
const answer = (descriptions, date = '2010') =>
  new Response(
    JSON.stringify({
      message: 'success',
      document_metadata: [
        { descriptions, publication_date: date },
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
  Object.assign(permissions, { isAuth: true, isModerator: true });
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
  expect(screen.getByRole('dialog')).toHaveTextContent('50 MB and 300 pages');
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
  expect(screen.getByRole('alert')).toHaveTextContent(
    messages['documentAi.replace']
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
  expect(screen.getByRole('alert')).toHaveTextContent('50 MB');
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

it.each([
  [false, true],
  [true, false]
])('hides analysis when auth=%s and moderator=%s', (isAuth, isModerator) => {
  Object.assign(permissions, { isAuth, isModerator });
  renderForm();
  fireEvent.click(screen.getByText('Attach PDF'));
  expect(screen.queryByTestId('document-ai')).not.toBeInTheDocument();
});

it('hides analysis when editing an existing document', () => {
  renderForm({ id: 12, type: 'Book', title: 'Book' });
  fireEvent.click(screen.getByText('Attach PDF'));
  expect(screen.queryByTestId('document-ai')).not.toBeInTheDocument();
});
