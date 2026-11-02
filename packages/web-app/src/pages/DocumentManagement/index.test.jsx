import {
  act,
  fireEvent,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import { apiGetWithRange } from '@/api/client';
import { useOnlineStatus, usePermissions } from '@/hooks';
import DocumentManagement from './index';

const device = vi.hoisted(() => ({ isMobile: false }));
vi.mock('react-device-detect', async importOriginal => ({
  ...(await importOriginal()),
  get isMobile() {
    return device.isMobile;
  }
}));
vi.mock('@/api/client', () => ({ apiGetWithRange: vi.fn() }));
vi.mock('@/hooks', async importOriginal => ({
  ...(await importOriginal()),
  usePermissions: vi.fn(),
  useOnlineStatus: vi.fn()
}));

const pdf = {
  id: 10,
  fileName: 'Bulletin.PDF',
  completePath: 'https://example.org/bulletin.pdf'
};
const document = { id: 1, title: 'Bulletin', type: 'Book', files: [pdf] };
const makePage = (documents, total = documents.length) => ({
  data: { documents },
  contentRange: `0-${documents.length}/${total}`
});
const getBookPage = vi.fn();
const makeCataloguePage = (url, total, isMatch = () => true) => {
  const params = new URL(url).searchParams;
  const skip = Number(params.get('skip'));
  const limit = Number(params.get('limit'));
  return makePage(
    Array.from({ length: Math.min(limit, total - skip) }, (_, index) => {
      const id = skip + index + 1;
      return isMatch(id) ? { ...document, id } : { id, type: 'Book' };
    }),
    total
  );
};
const renderManagement = () =>
  renderWithProviders(
    <MemoryRouter initialEntries={['/ui/documents/management']}>
      <Routes>
        <Route
          path="/ui/documents/management"
          element={<DocumentManagement />}
        />
        <Route path="/ui/dashboard" element={<p>Dashboard</p>} />
      </Routes>
    </MemoryRouter>,
    { messages }
  );

const renderAnalysis = () => {
  const view = renderManagement();
  fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
  return view;
};

beforeEach(() => {
  device.isMobile = false;
  vi.resetAllMocks();
  apiGetWithRange.mockImplementation((url, options) =>
    new URL(url).searchParams.get('documentType') === 'Book'
      ? getBookPage(url, options)
      : Promise.resolve(makePage([]))
  );
  usePermissions.mockReturnValue({ isAuth: true, isModerator: true });
  useOnlineStatus.mockReturnValue(true);
  localStorage.removeItem('documentManagement.ignoredPdfOffsets');
});

it('waits for an explicit analysis before requesting any documents', () => {
  renderManagement();
  expect(apiGetWithRange).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Analyze' })).toBeEnabled();
  expect(screen.queryByTestId('documents-scan-progress')).toBeNull();
});

it('lists only PDFs missing their own offset and preserves zero and negative offsets', async () => {
  getBookPage.mockResolvedValue(
    makePage([
      document,
      {
        id: 2,
        title: 'External PDF',
        type: 'Book',
        identifierType: 'URL',
        identifier: 'https://example.org/LINK.PDF?download=1#page=2'
      },
      { id: 3, title: 'Zero offset', files: [{ ...pdf, pdfPageOffset: 0 }] },
      {
        id: 4,
        title: 'Negative offset',
        identifierType: 'url',
        identifier: 'https://example.org/book.pdf',
        identifierPdfPageOffset: -12
      },
      {
        id: 5,
        title: 'Not a PDF',
        files: [{ ...pdf, fileName: 'map.jpg' }],
        identifierType: 'url',
        identifier: 'https://example.org/'
      },
      { id: 6, title: 'Deleted', isDeleted: true, files: [pdf] },
      {
        id: 7,
        title: 'Mixed',
        type: 'Issue',
        identifierType: 'url',
        identifier: 'https://example.org/mapped.pdf',
        identifierPdfPageOffset: 0,
        files: [
          pdf,
          { ...pdf, id: 11, fileName: 'mapped.pdf', pdfPageOffset: 4 }
        ]
      }
    ])
  );
  renderAnalysis();

  const row = await screen.findByTestId('document-offset-row-1');
  expect(within(row).getByRole('link', { name: 'Bulletin' })).toHaveAttribute(
    'href',
    '/ui/documents/1'
  );
  expect(within(row).getByRole('link', { name: 'Bulletin' })).toHaveAttribute(
    'target',
    '_blank'
  );
  expect(within(row).getByRole('img', { name: 'Book' })).toBeInTheDocument();
  expect(within(row).queryByText('Book', { selector: 'p' })).toBeNull();
  expect(within(row).queryByRole('link', { name: 'Bulletin.PDF' })).toBeNull();
  expect(
    within(row).getByRole('link', { name: 'Edit document' })
  ).toHaveAttribute('href', '/ui/documents/1/edit');
  expect(
    within(row).getByRole('link', { name: 'Edit document' })
  ).toHaveAttribute('target', '_blank');
  expect(screen.getByTestId('document-offset-row-2')).toBeInTheDocument();
  const mixed = screen.getByTestId('document-offset-row-7');
  expect(within(mixed).getAllByRole('link')).toHaveLength(2);
  [3, 4, 5, 6].forEach(id =>
    expect(screen.queryByTestId(`document-offset-row-${id}`)).toBeNull()
  );
  expect(screen.getByTestId('documents-scan-progress')).toHaveTextContent(
    'Documents scanned: 7 of 7 · 3 results'
  );
  expect(screen.getByTestId('documents-type-breakdown')).toHaveTextContent(
    'Issue: 1 · Book: 2'
  );
});

it('keeps document and edit links in-app on mobile', async () => {
  device.isMobile = true;
  getBookPage.mockResolvedValue(makePage([document]));
  renderAnalysis();
  const row = await screen.findByTestId('document-offset-row-1');
  const links = within(row).getAllByRole('link');
  expect(links.map(link => link.getAttribute('href'))).toEqual([
    '/ui/documents/1',
    '/ui/documents/1/edit'
  ]);
  links.forEach(link => {
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('title', 'Opens in a new tab');
  });
});

it('continues past pages with no matches and stops at the reported total', async () => {
  getBookPage
    .mockResolvedValueOnce(makePage([{ id: 2, title: 'No PDF' }], 2))
    .mockResolvedValueOnce(makePage([document], 2));
  renderAnalysis();
  await screen.findByTestId('document-offset-row-1');
  expect(getBookPage).toHaveBeenCalledTimes(2);
  expect(new URL(getBookPage.mock.calls[1][0]).searchParams.get('skip')).toBe(
    '1'
  );
  expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
});

it('hides partial results on failure and retries the complete analysis', async () => {
  getBookPage
    .mockResolvedValueOnce(makePage([document], 2))
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce(makePage([document, { ...document, id: 2 }], 2));
  renderAnalysis();
  await screen.findByRole('button', { name: 'Retry' });
  expect(screen.queryByTestId('document-offset-row-1')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await screen.findByTestId('document-offset-row-2');
  expect(screen.getByTestId('document-offset-row-1')).toBeInTheDocument();
  expect(getBookPage).toHaveBeenCalledTimes(3);
});

it('shows an empty state after scanning the entire list', async () => {
  getBookPage.mockResolvedValue(makePage([{ id: 2, title: 'No PDF' }]));
  renderAnalysis();
  expect(
    await screen.findByText('No PDFs without a page offset.')
  ).toBeInTheDocument();
});

it('does not present a truncated scan as a completed analysis', async () => {
  getBookPage
    .mockResolvedValueOnce(makePage([document], 2))
    .mockResolvedValueOnce({ data: { documents: [] }, contentRange: null });
  renderAnalysis();
  await screen.findByRole('button', { name: 'Retry' });
  expect(screen.queryByTestId('document-offset-row-1')).toBeNull();
  expect(screen.queryByTestId('documents-scan-progress')).toBeNull();
});

it('handles the empty response without a Content-Range header', async () => {
  getBookPage.mockResolvedValue({
    data: { documents: [] },
    contentRange: null
  });
  renderAnalysis();
  await screen.findByText('No PDFs without a page offset.');
  expect(screen.getByTestId('documents-scan-progress')).toHaveTextContent(
    'Documents scanned: 0 of 0'
  );
});

it('keeps scanning full pages if Content-Range is not exposed', async () => {
  getBookPage
    .mockResolvedValueOnce({
      data: { documents: Array.from({ length: 100 }, (_, id) => ({ id })) },
      contentRange: null
    })
    .mockResolvedValueOnce({
      data: { documents: [document] },
      contentRange: null
    });
  renderAnalysis();
  await screen.findByTestId('document-offset-row-1');
  expect(getBookPage).toHaveBeenCalledTimes(2);
  expect(screen.getByTestId('documents-scan-progress')).toHaveTextContent(
    'Documents scanned: 101 of 101'
  );
});

it('cancels the current scan request on leaving the page', async () => {
  apiGetWithRange.mockImplementation(() => new Promise(() => {}));
  const { unmount } = renderAnalysis();
  await waitFor(() => expect(apiGetWithRange).toHaveBeenCalledTimes(2));
  const { signal } = apiGetWithRange.mock.calls[0][1];
  unmount();
  expect(signal.aborted).toBe(true);
});

it('filters requests on the server to issues and books only', async () => {
  getBookPage.mockResolvedValue(makePage([]));
  renderAnalysis();
  await screen.findByText('No PDFs without a page offset.');
  expect(
    apiGetWithRange.mock.calls.map(([url]) =>
      new URL(url).searchParams.get('documentType')
    )
  ).toEqual(['Issue', 'Book']);
});

it('paginates each type independently and combines their totals', async () => {
  apiGetWithRange.mockImplementation(url => {
    const params = new URL(url).searchParams;
    const type = params.get('documentType');
    if (type === 'Issue') {
      const id = params.get('skip') === '0' ? 1 : 2;
      return Promise.resolve(makePage([{ ...document, id }], 2));
    }
    return Promise.resolve(makePage([{ ...document, id: 3 }]));
  });
  renderAnalysis();
  await screen.findByTestId('document-offset-row-2');
  expect(screen.getByTestId('documents-scan-progress')).toHaveTextContent(
    'Documents scanned: 3 of 3 · 3 results'
  );
  expect(apiGetWithRange).toHaveBeenCalledTimes(3);
  const lastRequest = new URL(apiGetWithRange.mock.calls[2][0]);
  expect(lastRequest.searchParams.get('documentType')).toBe('Issue');
  expect(lastRequest.searchParams.get('skip')).toBe('1');
});

it('collects all matches in a thousand-document chunk and continues at the saved position', async () => {
  getBookPage.mockImplementation(url =>
    Promise.resolve(makeCataloguePage(url, 1001))
  );
  renderAnalysis();
  await screen.findByTestId('document-offset-row-20');
  expect(screen.queryByRole('button', { name: 'Analyze' })).toBeNull();
  expect(screen.queryByTestId('document-offset-row-21')).toBeNull();
  expect(screen.getByTestId('documents-scan-progress')).toHaveTextContent(
    'Documents scanned: 1000 of 1001'
  );
  expect(screen.getByTestId('documents-scan-progress')).toHaveTextContent(
    '1,000 results'
  );
  expect(getBookPage).toHaveBeenCalledTimes(10);
  fireEvent.click(screen.getByRole('button', { name: 'Continue analysis' }));
  await screen.findByRole('button', { name: 'Analyze' });
  expect(screen.getByTestId('documents-scan-progress')).toHaveTextContent(
    'Documents scanned: 1001 of 1001'
  );
  expect(getBookPage).toHaveBeenCalledTimes(11);
  expect(
    new URL(getBookPage.mock.calls.at(-1)[0]).searchParams.get('skip')
  ).toBe('1000');
  expect(
    screen.queryByRole('button', { name: 'Continue analysis' })
  ).toBeNull();
});

it('automatically skips an empty thousand-document chunk before returning matches', async () => {
  getBookPage.mockImplementation(url =>
    Promise.resolve(makeCataloguePage(url, 2001, id => id === 1500))
  );
  renderAnalysis();
  await screen.findByTestId('document-offset-row-1500');
  expect(getBookPage).toHaveBeenCalledTimes(20);
  expect(screen.getByTestId('documents-scan-progress')).toHaveTextContent(
    'Documents scanned: 2000 of 2001'
  );
  expect(screen.queryByText('No PDFs without a page offset.')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Continue analysis' }));
  await screen.findByRole('button', { name: 'Analyze' });
  expect(
    new URL(getBookPage.mock.calls.at(-1)[0]).searchParams.get('skip')
  ).toBe('2000');
  expect(screen.getByTestId('documents-scan-progress')).toHaveTextContent(
    'Documents scanned: 2001 of 2001'
  );
});

it('analyzes the entire catalogue without pausing after matching chunks', async () => {
  getBookPage.mockImplementation(url =>
    Promise.resolve(
      makeCataloguePage(url, 2001, id => [1, 1001, 2001].includes(id))
    )
  );
  renderManagement();
  fireEvent.click(screen.getByRole('button', { name: 'Analyze all' }));
  await screen.findByTestId('document-offset-row-2001');
  expect(screen.getByTestId('document-offset-row-1')).toBeInTheDocument();
  expect(screen.getByTestId('document-offset-row-1001')).toBeInTheDocument();
  expect(screen.getByTestId('documents-scan-progress')).toHaveTextContent(
    'Documents scanned: 2001 of 2001'
  );
  expect(getBookPage).toHaveBeenCalledTimes(21);
  expect(
    screen.queryByRole('button', { name: 'Continue analysis' })
  ).toBeNull();
});

it('analyzes all remaining documents without rescanning a completed chunk', async () => {
  getBookPage.mockImplementation(url =>
    Promise.resolve(
      makeCataloguePage(url, 2001, id => [1, 1001, 2001].includes(id))
    )
  );
  renderAnalysis();
  await screen.findByTestId('document-offset-row-1');
  expect(getBookPage).toHaveBeenCalledTimes(10);
  fireEvent.click(screen.getByRole('button', { name: 'Analyze all' }));
  await screen.findByTestId('document-offset-row-2001');
  expect(
    getBookPage.mock.calls.map(([url]) =>
      Number(new URL(url).searchParams.get('skip'))
    )
  ).toEqual(Array.from({ length: 21 }, (_, index) => index * 100));
});

it('cancels a full scan, keeps completed chunks and stops requesting more pages', async () => {
  let finishPage;
  getBookPage.mockImplementation(url => {
    const skip = Number(new URL(url).searchParams.get('skip'));
    if (skip < 1000)
      return Promise.resolve(makeCataloguePage(url, 2001, id => id === 1));
    return new Promise(resolve => {
      finishPage = resolve;
    });
  });
  renderManagement();
  fireEvent.click(screen.getByRole('button', { name: 'Analyze all' }));
  await waitFor(() => expect(getBookPage).toHaveBeenCalledTimes(11));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await screen.findByRole('button', { name: 'Analyze all' });
  await act(async () => {
    finishPage(makePage([{ ...document, id: 1001 }], 2001));
  });
  expect(screen.getByTestId('document-offset-row-1')).toBeInTheDocument();
  expect(screen.queryByTestId('document-offset-row-1001')).toBeNull();
  expect(getBookPage).toHaveBeenCalledTimes(11);
  expect(screen.getByTestId('documents-scan-progress')).toHaveTextContent(
    'Documents scanned: 1000 of 2001'
  );
});

it('retries a failed full scan in full mode from the last completed chunk', async () => {
  let hasFailed = false;
  getBookPage.mockImplementation(url => {
    const skip = Number(new URL(url).searchParams.get('skip'));
    if (skip === 1000 && !hasFailed) {
      hasFailed = true;
      return Promise.reject(new Error('Offline'));
    }
    return Promise.resolve(
      makeCataloguePage(url, 2001, id => [1, 1001, 2001].includes(id))
    );
  });
  renderManagement();
  fireEvent.click(screen.getByRole('button', { name: 'Analyze all' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
  await screen.findByTestId('document-offset-row-2001');
  expect(
    getBookPage.mock.calls.filter(
      ([url]) => new URL(url).searchParams.get('skip') === '0'
    )
  ).toHaveLength(1);
  expect(
    screen.queryByRole('button', { name: 'Continue analysis' })
  ).toBeNull();
});

it('automatically reaches the end when every chunk has no matches', async () => {
  getBookPage.mockImplementation(url =>
    Promise.resolve(makeCataloguePage(url, 1500, () => false))
  );
  renderAnalysis();
  await screen.findByText('No PDFs without a page offset.');
  expect(getBookPage).toHaveBeenCalledTimes(15);
  expect(screen.getByTestId('documents-scan-progress')).toHaveTextContent(
    'Documents scanned: 1500 of 1500'
  );
  expect(
    screen.queryByRole('button', { name: 'Continue analysis' })
  ).toBeNull();
});

it('continues automatically when a chunk only contains ignored documents', async () => {
  localStorage.setItem('documentManagement.ignoredPdfOffsets', '1000');
  getBookPage.mockImplementation(url =>
    Promise.resolve(
      makeCataloguePage(url, 2000, id => [1000, 1500].includes(id))
    )
  );
  renderAnalysis();
  await screen.findByTestId('document-offset-row-1500');
  expect(screen.queryByTestId('document-offset-row-1000')).toBeNull();
  expect(getBookPage).toHaveBeenCalledTimes(20);
  fireEvent.click(screen.getByRole('button', { name: 'Show ignored' }));
  expect(screen.getByTestId('document-offset-row-1000')).toBeInTheDocument();
});

it('counts actual documents across types and shortens the last request to stay within a thousand', async () => {
  apiGetWithRange.mockImplementation(url => {
    const type = new URL(url).searchParams.get('documentType');
    if (type === 'Book') return getBookPage(url);
    return Promise.resolve(
      makePage(type === 'Issue' ? [{ ...document, id: 9000 }] : [])
    );
  });
  getBookPage.mockImplementation(url =>
    Promise.resolve(makeCataloguePage(url, 1001, () => false))
  );
  renderAnalysis();
  await screen.findByTestId('document-offset-row-9000');
  expect(screen.getByTestId('documents-scan-progress')).toHaveTextContent(
    'Documents scanned: 1000 of 1002'
  );
  const lastRequest = new URL(getBookPage.mock.calls.at(-1)[0]);
  expect(lastRequest.searchParams.get('skip')).toBe('900');
  expect(lastRequest.searchParams.get('limit')).toBe('99');
  fireEvent.click(screen.getByRole('button', { name: 'Continue analysis' }));
  await screen.findByRole('button', { name: 'Analyze' });
  expect(
    new URL(getBookPage.mock.calls.at(-1)[0]).searchParams.get('skip')
  ).toBe('999');
  expect(screen.getByTestId('documents-scan-progress')).toHaveTextContent(
    'Documents scanned: 1002 of 1002'
  );
});

it('retries a failed continuation at the saved position and retains earlier results', async () => {
  let hasFailed = false;
  getBookPage.mockImplementation(url => {
    const skip = Number(new URL(url).searchParams.get('skip'));
    if (skip < 1000)
      return Promise.resolve(makeCataloguePage(url, 1001, id => id === 1));
    if (!hasFailed) {
      hasFailed = true;
      return Promise.reject(new Error('Offline'));
    }
    return Promise.resolve(makeCataloguePage(url, 1001));
  });
  renderAnalysis();
  await screen.findByTestId('document-offset-row-1');
  fireEvent.click(screen.getByRole('button', { name: 'Continue analysis' }));
  await screen.findByRole('button', { name: 'Retry' });
  expect(screen.getByTestId('document-offset-row-1')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await screen.findByTestId('document-offset-row-1001');
  expect(
    getBookPage.mock.calls
      .slice(-3)
      .map(([url]) => new URL(url).searchParams.get('skip'))
  ).toEqual(['900', '1000', '1000']);
});

it('cancels a continuation without advancing its cursor or losing earlier results', async () => {
  let finishPage;
  getBookPage.mockImplementation(url => {
    const skip = Number(new URL(url).searchParams.get('skip'));
    if (skip < 1000)
      return Promise.resolve(makeCataloguePage(url, 1001, id => id === 1));
    return new Promise(resolve => {
      finishPage = resolve;
    });
  });
  renderAnalysis();
  await screen.findByTestId('document-offset-row-1');
  fireEvent.click(screen.getByRole('button', { name: 'Continue analysis' }));
  await waitFor(() => expect(getBookPage).toHaveBeenCalledTimes(11));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await screen.findByRole('button', { name: 'Continue analysis' });
  await act(async () => {
    finishPage(makePage([{ ...document, id: 1001 }], 1001));
  });
  expect(screen.queryByTestId('document-offset-row-1001')).toBeNull();
  expect(screen.getByTestId('documents-scan-progress')).toHaveTextContent(
    'Documents scanned: 1000 of 1001'
  );
  getBookPage.mockImplementation(url =>
    Promise.resolve(makeCataloguePage(url, 1001))
  );
  fireEvent.click(screen.getByRole('button', { name: 'Continue analysis' }));
  await screen.findByTestId('document-offset-row-1001');
  expect(
    getBookPage.mock.calls
      .slice(-3)
      .map(([url]) => new URL(url).searchParams.get('skip'))
  ).toEqual(['900', '1000', '1000']);
});

it('persists ignored documents and restores them with Show ignored', async () => {
  getBookPage.mockResolvedValue(makePage([document]));
  const { unmount } = renderAnalysis();
  const row = await screen.findByTestId('document-offset-row-1');
  fireEvent.click(within(row).getByRole('button', { name: 'Ignore' }));
  expect(screen.queryByTestId('document-offset-row-1')).toBeNull();
  expect(localStorage.getItem('documentManagement.ignoredPdfOffsets')).toBe(
    '1'
  );
  unmount();
  renderAnalysis();
  await screen.findByText('No PDFs without a page offset.');
  expect(screen.queryByTestId('document-offset-row-1')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Show ignored' }));
  expect(screen.getByTestId('document-offset-row-1')).toBeInTheDocument();
});

it('cancels without showing partial or late results and can analyze again', async () => {
  let finishPage;
  getBookPage
    .mockResolvedValueOnce(makePage([document], 2))
    .mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finishPage = resolve;
        })
    );
  renderAnalysis();
  await waitFor(() => expect(getBookPage).toHaveBeenCalledTimes(2));
  const { signal } = getBookPage.mock.calls[1][1];
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(signal.aborted).toBe(true);
  await screen.findByText('Analysis cancelled. No partial results are shown.');
  finishPage(makePage([{ ...document, id: 2 }], 2));
  expect(screen.queryByTestId('document-offset-row-1')).toBeNull();
  expect(screen.queryByTestId('document-offset-row-2')).toBeNull();
  getBookPage.mockResolvedValue(makePage([document]));
  fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
  await screen.findByTestId('document-offset-row-1');
});

it('rescans from the first page and removes documents corrected in another tab', async () => {
  getBookPage
    .mockResolvedValueOnce(makePage([document]))
    .mockResolvedValueOnce(
      makePage([{ ...document, files: [{ ...pdf, pdfPageOffset: 0 }] }])
    );
  renderAnalysis();
  await screen.findByTestId('document-offset-row-1');
  fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
  await screen.findByText('No PDFs without a page offset.');
  expect(screen.queryByTestId('document-offset-row-1')).toBeNull();
  expect(
    getBookPage.mock.calls.map(([url]) => new URL(url).searchParams.get('skip'))
  ).toEqual(['0', '0']);
});

it.each([
  { isAuth: true, isModerator: false },
  { isAuth: false, isModerator: true }
])(
  'does not fetch documents without moderator access: %j',
  async permissions => {
    usePermissions.mockReturnValue(permissions);
    renderManagement();
    await waitFor(() =>
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    );
    expect(apiGetWithRange).not.toHaveBeenCalled();
  }
);
