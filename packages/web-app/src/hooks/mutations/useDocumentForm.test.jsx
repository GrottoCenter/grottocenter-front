import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import PropTypes from 'prop-types';

import { apiPostForm, apiPutForm } from '@/api/client';
import { DocumentTypes } from '@/utils/documentTypeHelpers';
import { createTestQueryClient } from '@/test/renderWithProviders';
import {
  IS_INTACT,
  IS_DELETED,
  IS_MODIFIED,
  IS_NEW,
  DOCUMENT_AUTHORIZE_TO_PUBLISH
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
    vi.resetAllMocks();
    apiPostForm.mockResolvedValue({ document: { id: 42 } });
    apiPutForm.mockResolvedValue({ id: 42 });
  });

  it.each([
    ['creation', useCreateDocument, apiPostForm],
    ['update', useUpdateDocument, apiPutForm]
  ])(
    'sends collection rights without any file on %s',
    async (_label, hook, api) => {
      const { result } = renderMutation(hook);
      await act(async () =>
        result.current.mutateAsync({
          id: 42,
          type: DocumentTypes.COLLECTION,
          license: { id: 2, name: 'CC-BY' },
          authorizationDocument: { id: 99 },
          selectOptionAuthorizationDocument: DOCUMENT_AUTHORIZE_TO_PUBLISH,
          files: [newFile('excluded.pdf')]
        })
      );
      const formData = api.mock.calls[0][1];
      expect(formData.get('license[id]')).toBe('2');
      expect(formData.get('authorizationDocument[id]')).toBe('99');
      expect(formData.get('option')).toBe(DOCUMENT_AUTHORIZE_TO_PUBLISH);
      expect(formData.has('selectOptionAuthorizationDocument')).toBe(false);
      expect(formData.has('files')).toBe(false);
      expect(
        [...formData.keys()].some(key => key.startsWith('newFilesMetadata'))
      ).toBe(false);
    }
  );

  it.each([
    ['creation', useCreateDocument, apiPostForm],
    ['update', useUpdateDocument, apiPutForm]
  ])(
    'distinguishes automatic, enabled and disabled panoramas on %s',
    async (_label, hook, api) => {
      const { result } = renderMutation(hook);
      await act(async () =>
        result.current.mutateAsync({
          id: 42,
          type: DocumentTypes.BOOK,
          files: [
            newFile('auto.jpg', undefined, 'image/jpeg'),
            { ...newFile('on.png', undefined, 'image/png'), isPanorama: true },
            newFile('zero.pdf', 0),
            {
              ...newFile('off.webp', undefined, 'image/webp'),
              isPanorama: false
            }
          ]
        })
      );
      const formData = api.mock.calls[0][1];
      expect(formData.has('newFilesMetadata[0][isPanorama]')).toBe(false);
      expect(formData.get('newFilesMetadata[1][isPanorama]')).toBe('true');
      expect(formData.get('newFilesMetadata[2][pdfPageOffset]')).toBe('0');
      expect(formData.has('newFilesMetadata[2][isPanorama]')).toBe(false);
      expect(formData.get('newFilesMetadata[3][isPanorama]')).toBe('false');
      expect(formData.getAll('files').map(file => file.name)).toEqual([
        'auto.jpg',
        'on.png',
        'zero.pdf',
        'off.webp'
      ]);
    }
  );

  it('preserves untouched flags and sends explicit existing-file changes, including false', async () => {
    const { result } = renderMutation(useUpdateDocument);
    await act(async () =>
      result.current.mutateAsync({
        id: 42,
        type: DocumentTypes.BOOK,
        files: [
          { id: 1, fileName: 'intact.jpg', state: IS_INTACT, isPanorama: true },
          { id: 2, fileName: 'off.jpg', state: IS_MODIFIED, isPanorama: false },
          { id: 3, fileName: 'on.jpg', state: IS_MODIFIED, isPanorama: true },
          { id: 4, fileName: 'renamed.jpg', state: IS_MODIFIED },
          { ...newFile('new.jpg', undefined, 'image/jpeg'), isPanorama: false }
        ]
      })
    );
    const formData = apiPutForm.mock.calls[0][1];
    expect(formData.get('modifiedFiles[0][id]')).toBe('2');
    expect(formData.get('modifiedFiles[0][isPanorama]')).toBe('false');
    expect(formData.get('modifiedFiles[1][isPanorama]')).toBe('true');
    expect(formData.has('modifiedFiles[2][isPanorama]')).toBe(false);
    expect(formData.has('modifiedFiles[3][id]')).toBe(false);
    expect(formData.get('newFilesMetadata[0][isPanorama]')).toBe('false');
  });

  it('omits unrelated false booleans from nested document and existing-file metadata', async () => {
    const { result } = renderMutation(useUpdateDocument);
    await act(async () =>
      result.current.mutateAsync({
        id: 42,
        type: DocumentTypes.BOOK,
        authors: [{ id: 1, isDeleted: false }],
        subjects: [{ id: 2, isValidated: false }],
        license: { id: 3, isDeleted: false },
        files: [
          {
            id: 4,
            fileName: 'modified.jpg',
            state: IS_MODIFIED,
            isPanorama: false,
            isDeleted: false,
            isValidated: false
          },
          {
            id: 5,
            fileName: 'deleted.jpg',
            state: IS_DELETED,
            isDeleted: false,
            isValidated: false
          }
        ]
      })
    );
    const formData = apiPutForm.mock.calls[0][1];
    expect(formData.get('authors[0][id]')).toBe('1');
    expect(formData.get('subjects[0][id]')).toBe('2');
    expect(formData.get('license[id]')).toBe('3');
    expect(formData.get('deletedFiles[0][id]')).toBe('5');
    expect(
      [...formData.entries()].filter(([, value]) => value === 'false')
    ).toEqual([['modifiedFiles[0][isPanorama]', 'false']]);
  });

  it.each([
    [
      'creation',
      useCreateDocument,
      apiPostForm,
      'newFilesMetadata[1][isPanorama]'
    ],
    ['update', useUpdateDocument, apiPutForm, 'modifiedFiles[0][isPanorama]']
  ])(
    'keeps structured %s errors attached to the submitted file',
    async (_label, hook, api, field) => {
      const allFiles = [
        { id: 1, fileName: 'unchanged.jpg', state: IS_INTACT },
        newFile('first.jpg', undefined, 'image/jpeg'),
        { ...newFile('bad.jpg', undefined, 'image/jpeg'), isPanorama: true },
        { id: 2, fileName: 'stored.jpg', state: IS_MODIFIED, isPanorama: true }
      ];
      const files =
        hook === useCreateDocument
          ? allFiles.filter(file => file.state === IS_NEW)
          : allFiles;
      api.mockRejectedValueOnce(
        Object.assign(new Error('invalid'), {
          status: 400,
          body: { code: 'E_INCOMPATIBLE_PANORAMA', metadata: { field } }
        })
      );
      const { result } = renderMutation(hook);
      let error;
      await act(async () => {
        try {
          await result.current.mutateAsync({
            id: 42,
            type: DocumentTypes.IMAGE,
            files
          });
        } catch (caught) {
          error = caught;
        }
      });
      expect(error.fileError.file).toBe(
        field.startsWith('modifiedFiles') ? allFiles[3] : allFiles[2]
      );
      expect(error.errorMessages).toEqual(['E_INCOMPATIBLE_PANORAMA']);
      expect(error.body.metadata.field).toBe(field);
    }
  );

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
