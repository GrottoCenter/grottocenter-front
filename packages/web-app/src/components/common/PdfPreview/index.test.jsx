import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import PdfPreview from './index';

const {
  mockDestroy,
  mockGetDocument,
  mockGlobalWorkerOptions,
  pendingDocument
} = vi.hoisted(() => ({
  mockDestroy: vi.fn(),
  mockGetDocument: vi.fn(),
  mockGlobalWorkerOptions: {},
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
    ZoomIn: MockIcon,
    ZoomOut: MockIcon
  };
});
vi.mock('@/hooks', () => ({
  useMeasuredWidth: () => [() => {}, 0]
}));
vi.mock('@/utils/pdfViewerSupport', () => ({
  hasNativePdfViewer: () => false
}));

const messages = {
  'Page {current} of {total}': 'Page {current} of {total}',
  'Previous page': 'Previous page',
  'Next page': 'Next page',
  'Zoom in': 'Zoom in',
  'Zoom out': 'Zoom out'
};

describe('PdfPreview', () => {
  beforeEach(() => {
    mockDestroy.mockReset();
    mockGetDocument.mockReset();
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
