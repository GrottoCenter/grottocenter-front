import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import PropTypes from 'prop-types';

import { apiPostForm, apiPutForm } from '@/api/client';
import { DocumentTypes } from '@/utils/documentTypeHelpers';
import { createTestQueryClient } from '@/test/renderWithProviders';
import {
  IS_INTACT,
  IS_MODIFIED,
  IS_NEW
} from '@/components/appli/EntitiesForm/Document/formElements/AddFileForm/FileHelpers';
import { useCreateDocument, useUpdateDocument } from './useDocumentForm';

vi.mock('@/api/client', () => ({
  apiPostForm: vi.fn(),
  apiPutForm: vi.fn()
}));

const renderMutation = hook => {
  const queryClient = createTestQueryClient();
  const Wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.propTypes = { children: PropTypes.node.isRequired };
  return renderHook(hook, { wrapper: Wrapper });
};

const newFile = (name, pdfPageOffset, type = 'application/pdf') => ({
  file: new File(['content'], name, { type }),
  fileName: name,
  state: IS_NEW,
  pdfPageOffset
});

describe('document PDF pagination uploads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiPostForm.mockResolvedValue({ document: { id: 42 } });
    apiPutForm.mockResolvedValue({ id: 42 });
  });

  it.each([
    ['creation', useCreateDocument, apiPostForm],
    ['update', useUpdateDocument, apiPutForm]
  ])(
    'preserves zero offsets and file order on %s',
    async (_label, hook, api) => {
      const { result } = renderMutation(hook);
      await act(async () =>
        result.current.mutateAsync({
          id: 42,
          type: DocumentTypes.BOOK,
          files: [
            newFile('unmapped.pdf', null),
            newFile('zero.pdf', 0),
            newFile('shifted.pdf', -126)
          ]
        })
      );

      const formData = api.mock.calls[0][1];
      expect(formData.getAll('files').map(file => file.name)).toEqual([
        'unmapped.pdf',
        'zero.pdf',
        'shifted.pdf'
      ]);
      expect(formData.get('newFilesMetadata[0][pdfPageOffset]')).toBe('');
      expect(formData.get('newFilesMetadata[1][pdfPageOffset]')).toBe('0');
      expect(formData.get('newFilesMetadata[2][pdfPageOffset]')).toBe('-126');
      expect(
        [0, 1, 2].map(index =>
          formData.get(`newFilesMetadata[${index}][fileName]`)
        )
      ).toEqual(['unmapped.pdf', 'zero.pdf', 'shifted.pdf']);
      const keys = [...formData.keys()];
      const firstFile = keys.indexOf('files');
      expect(keys.slice(firstFile)).toEqual(['files', 'files', 'files']);
    }
  );

  it('keeps mixed uploads aligned after an intact file and sends every text field first', async () => {
    const { result } = renderMutation(useUpdateDocument);
    await act(async () =>
      result.current.mutateAsync({
        id: 42,
        type: DocumentTypes.BOOK,
        files: [
          { id: 1, fileName: 'intact.pdf', state: IS_INTACT },
          newFile('map.jpg', undefined, 'image/jpeg'),
          newFile('lpu339_anonyme.pdf', 3),
          {
            id: 2,
            fileName: 'modified.pdf',
            state: IS_MODIFIED,
            pdfPageOffset: 0
          }
        ]
      })
    );

    const formData = apiPutForm.mock.calls[0][1];
    expect(formData.getAll('files').map(file => file.name)).toEqual([
      'map.jpg',
      'lpu339_anonyme.pdf'
    ]);
    expect(formData.get('newFilesMetadata[0][fileName]')).toBe('map.jpg');
    expect(formData.get('newFilesMetadata[0][pdfPageOffset]')).toBe('');
    expect(formData.get('newFilesMetadata[1][fileName]')).toBe(
      'lpu339_anonyme.pdf'
    );
    expect(formData.get('newFilesMetadata[1][pdfPageOffset]')).toBe('3');
    expect(formData.has('newFilesMetadata[2][fileName]')).toBe(false);
    expect(formData.get('modifiedFiles[0][id]')).toBe('2');
    const keys = [...formData.keys()];
    expect(keys.slice(keys.indexOf('files'))).toEqual(['files', 'files']);
  });

  it('indexes only uploaded files and explicitly clears existing offsets', async () => {
    const { result } = renderMutation(useUpdateDocument);
    await act(async () =>
      result.current.mutateAsync({
        id: 42,
        type: DocumentTypes.BOOK,
        identifierPdfPageOffset: null,
        files: [
          { id: 1, fileName: 'intact.pdf', state: IS_INTACT },
          {
            id: 2,
            fileName: 'cleared.pdf',
            state: IS_MODIFIED,
            pdfPageOffset: null
          },
          newFile('zero.pdf', 0)
        ]
      })
    );

    const formData = apiPutForm.mock.calls[0][1];
    expect(formData.getAll('files').map(file => file.name)).toEqual([
      'zero.pdf'
    ]);
    expect(formData.get('newFilesMetadata[0][pdfPageOffset]')).toBe('0');
    expect(formData.has('newFilesMetadata[1][pdfPageOffset]')).toBe(false);
    expect(formData.get('modifiedFiles[0][id]')).toBe('2');
    expect(formData.get('modifiedFiles[0][pdfPageOffset]')).toBe('');
    expect(formData.get('identifierPdfPageOffset')).toBe('');
  });
});
