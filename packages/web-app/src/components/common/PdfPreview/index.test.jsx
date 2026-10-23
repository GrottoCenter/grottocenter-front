import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import PdfPreview from './index';

const {
  mockDestroy,
  mockGetDocument,
  mockGlobalWorkerOptions,
  mockHasNativePdfViewer,
  pendingDocument
} = vi.hoisted(() => ({
  mockDestroy: vi.fn(),
  mockGetDocument: vi.fn(),
  mockGlobalWorkerOptions: {},
  mockHasNativePdfViewer: vi.fn(),
  pendingDocument: new Promise(() => {})
}));

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: mockGetDocument,
  GlobalWorkerOptions: mockGlobalWorkerOptions,
  version: '6.2.108'
}));
vi.mock('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url', () => ({
  default: '/assets/pdf.worker.min.mjs'
}));
vi.mock('@mui/icons-material', () => {
  const MockIcon = () => null;
  return {
    ChevronLeft: MockIcon,
    ChevronRight: MockIcon,
    PictureAsPdf: MockIcon,
    ZoomIn: MockIcon,
    ZoomOut: MockIcon
  };
});
vi.mock('@/hooks', () => ({
  useMeasuredWidth: () => [() => {}, 0]
}));
vi.mock('@/utils/pdfViewerSupport', () => ({
  hasNativePdfViewer: mockHasNativePdfViewer
}));

const messages = {
  'Page {current} of {total}': 'Page {current} of {total}',
  'Previous page': 'Previous page',
  'Next page': 'Next page',
  'Zoom in': 'Zoom in',
  'Zoom out': 'Zoom out',
  'Open PDF': 'Open PDF',
  'PDF preview unavailable.': 'PDF preview unavailable.',
  'Opens in a new tab': 'Opens in a new tab'
};

describe('PdfPreview', () => {
  beforeEach(() => {
    mockDestroy.mockReset();
    mockGetDocument.mockReset();
    mockHasNativePdfViewer.mockReturnValue(false);
    mockGetDocument.mockReturnValue({
      promise: pendingDocument,
      destroy: mockDestroy
    });
    delete mockGlobalWorkerOptions.workerSrc;
  });

  it('provides the versioned image-decoder directory to PDF.js', async () => {
    const { unmount } = render(
      <IntlProvider locale="en" messages={messages}>
        <PdfPreview src="https://example.org/document.pdf" />
      </IntlProvider>
    );

    await waitFor(() => {
      expect(mockGetDocument).toHaveBeenCalledWith({
        url: 'https://example.org/document.pdf',
        wasmUrl: '/assets/pdfjs/6.2.108/wasm/'
      });
    });
    expect(mockGlobalWorkerOptions.workerSrc).toBe(
      '/assets/pdf.worker.min.mjs'
    );

    unmount();
    expect(mockDestroy).toHaveBeenCalledOnce();
  });

  it('keeps the left edge reachable when a zoomed canvas overflows', () => {
    render(
      <IntlProvider locale="en" messages={messages}>
        <PdfPreview src="https://example.org/document.pdf" />
      </IntlProvider>
    );

    const canvas = screen.getByRole('img', { hidden: true });
    expect(canvas.parentElement).toHaveStyle({
      justifyContent: 'flex-start'
    });
    expect(canvas).toHaveStyle({ marginInline: 'auto' });
  });

  it('offers one direct link preserving the article page after a network failure', async () => {
    const src = 'https://example.org/issue.pdf?download=1#page=12';
    mockGetDocument.mockImplementation(() => ({
      promise: Promise.reject(new TypeError('Failed to fetch')),
      destroy: mockDestroy
    }));
    render(
      <IntlProvider locale="en" messages={messages}>
        <PdfPreview src={src} />
      </IntlProvider>
    );

    const link = await screen.findByRole('link', { name: 'Open PDF' });
    expect(link).toHaveAttribute('href', src);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent(
      'PDF preview unavailable.'
    );
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('provides the same direct link inside the native viewer fallback', () => {
    mockHasNativePdfViewer.mockReturnValue(true);
    const src = 'https://example.org/issue.pdf#page=12';
    const { container } = render(
      <IntlProvider locale="en" messages={messages}>
        <PdfPreview src={src} />
      </IntlProvider>
    );

    // JSDOM exposes object children but cannot simulate native PDF rendering.
    const viewer = container.querySelector('object');
    const link = screen.getByRole('link', { name: 'Open PDF' });
    expect(viewer).toContainElement(link);
    expect(link).toHaveAttribute('href', src);
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(mockGetDocument).not.toHaveBeenCalled();
  });

  it.each([
    ['#page=12&zoom=125', 12],
    ['#page=999', 20],
    ['#page=0', 1],
    ['#page=-1', 1],
    ['#page=1.5', 1],
    ['#page=invalid', 1],
    ['', 1]
  ])(
    'opens the requested page for %s within the PDF bounds',
    async (fragment, page) => {
      mockGetDocument.mockReturnValue({
        promise: Promise.resolve({ numPages: 20 }),
        destroy: mockDestroy
      });
      render(
        <IntlProvider locale="en" messages={messages}>
          <PdfPreview src={`https://example.org/document.pdf${fragment}`} />
        </IntlProvider>
      );

      expect(await screen.findByText(`Page ${page} of 20`)).toBeVisible();
      expect(
        screen.queryByRole('link', { name: 'Open PDF' })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Previous page' }).disabled
      ).toBe(page === 1);
      expect(screen.getByRole('button', { name: 'Next page' }).disabled).toBe(
        page === 20
      );
    }
  );

  it('resets to the new source page after navigating in the previous PDF', async () => {
    mockGetDocument.mockReturnValue({
      promise: Promise.resolve({ numPages: 20 }),
      destroy: mockDestroy
    });
    const preview = src => (
      <IntlProvider locale="en" messages={messages}>
        <PdfPreview src={src} />
      </IntlProvider>
    );
    const { rerender } = render(preview('https://example.org/a.pdf#page=12'));
    await screen.findByText('Page 12 of 20');
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('Page 13 of 20')).toBeVisible();

    rerender(preview('https://example.org/b.pdf#page=4'));
    expect(await screen.findByText('Page 4 of 20')).toBeVisible();
  });
});
