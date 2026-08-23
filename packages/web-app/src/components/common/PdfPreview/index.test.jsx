import { render, screen, waitFor } from '@testing-library/react';
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

vi.mock('pdfjs-dist', () => ({
  getDocument: mockGetDocument,
  GlobalWorkerOptions: mockGlobalWorkerOptions,
  version: '6.2.108'
}));
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({
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
  'Page {current} of {total}': 'Page {current} of {total}'
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
});
