import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';

import { createTestQueryClient } from '@/test/renderWithProviders';
import { useDocumentsWithoutPdfOffset } from './useDocumentsWithoutPdfOffset';

vi.mock('@/store', () => ({
  default: { getState: () => ({ login: { authorizationHeader: {} } }) }
}));

// Relevant fields from the production GET /documents?documentType=Book list
// response, checked on 2026-11-01. Both offsets are explicit, including null;
// the list uses the same document/file converters as the details endpoint.
const listedDocument = {
  id: 130779,
  type: 'Book',
  identifierType: 'url',
  identifier: 'https://speleo-bg.org/content/uploads/2021/05/Pirin-2021.pdf',
  identifierPdfPageOffset: null,
  files: [
    {
      id: 6324,
      fileName: 'Pirin-2021.pdf',
      completePath:
        'https://grottocenter.blob.core.windows.net/documents/05845732976554752-Pirin-2021.pdf',
      pdfPageOffset: null
    }
  ]
};

afterEach(() => vi.unstubAllGlobals());

it.each([null, 0, -12])(
  'reads identifier and file offsets (%s) from the list HTTP payload',
  async offset => {
    const document = {
      ...listedDocument,
      identifierPdfPageOffset: offset,
      files: [{ ...listedDocument.files[0], pdfPageOffset: offset }]
    };
    const fetch = vi.fn(async url => {
      const isBook = new URL(url).searchParams.get('documentType') === 'Book';
      return new Response(
        JSON.stringify({ documents: isBook ? [document] : [] }),
        {
          headers: { 'Content-Range': `0-${isBook ? 1 : 0}/${isBook ? 1 : 0}` }
        }
      );
    });
    vi.stubGlobal('fetch', fetch);
    const queryClient = createTestQueryClient();
    const { result, unmount } = renderHook(
      () => useDocumentsWithoutPdfOffset(),
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        )
      }
    );

    await act(async () => {
      const scan = await result.current.refetch();
      expect(scan.isSuccess).toBe(true);
      expect(scan.data.progress).toEqual({ loaded: 1, total: 1 });
      expect(scan.data.documents).toEqual(offset === null ? [document] : []);
      if (offset === null) {
        expect(scan.data.documents[0]).toHaveProperty(
          'identifierPdfPageOffset',
          null
        );
        expect(scan.data.documents[0].files[0]).toHaveProperty(
          'pdfPageOffset',
          null
        );
      }
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    fetch.mock.calls.forEach(([url]) => {
      expect(new URL(url).pathname).toBe('/api/v1/documents');
      expect(new URL(url).searchParams.get('isValidated')).toBe('true');
    });
    unmount();
    queryClient.clear();
  }
);
