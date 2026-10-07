import fc from 'fast-check';

import {
  getDocumentSubmissionKind,
  getDocumentChanges,
  prepareDocumentPreview,
  prepareDocumentEdit
} from './documentModeration';

const current = {
  id: 7,
  dateInscription: '2026-01-01T00:00:00Z',
  isValidated: false,
  title: 'Old title',
  description: 'Old description',
  authors: [
    { id: 1, nickname: 'Alice' },
    { id: 2, nickname: 'Bob' }
  ],
  entrances: [{ id: 42, name: 'Entrance' }],
  files: [
    { id: 1, fileName: 'old.pdf', completePath: '/old.pdf' },
    { id: 2, fileName: 'delete.pdf', completePath: '/delete.pdf' },
    { id: 3, fileName: 'keep.pdf', completePath: '/keep.pdf' }
  ]
};

describe('document moderation', () => {
  it('keeps a document new until its first moderation decision', () => {
    expect(getDocumentSubmissionKind(current)).toBe('creation');
    expect(getDocumentSubmissionKind({ ...current, validator: null })).toBe(
      'creation'
    );
    expect(getDocumentSubmissionKind(undefined)).toBe('unknown');
    expect(getDocumentSubmissionKind({})).toBe('unknown');
  });

  it('counts previously accepted or refused documents as modified', () => {
    // A pending edit resets these flags for both previous decisions. Their
    // shared validator is sufficient under the agreed UI convention.
    expect(
      getDocumentSubmissionKind({
        ...current,
        isValidated: false,
        dateValidation: null,
        validator: { id: 9, nickname: 'Moderator' }
      })
    ).toBe('modification');
  });

  it('compares explicit text additions/deletions without inventing omitted changes', () => {
    expect(getDocumentChanges(current, { title: null, pages: '12' })).toEqual([
      { field: 'title', label: 'Title', oldText: 'Old title', newText: '' },
      { field: 'pages', label: 'Pages', oldText: '', newText: '12' }
    ]);
  });

  it('compares author membership, not order or renamed labels', () => {
    expect(
      getDocumentChanges(current, { authors: [...current.authors].reverse() })
    ).toEqual([]);
    const changes = getDocumentChanges(current, {
      authors: [
        { id: 1, nickname: 'Alice' },
        { id: 3, nickname: 'Charlie' }
      ]
    });
    expect(changes[0]).toMatchObject({
      oldText: 'Alice · Bob',
      newText: 'Alice · Charlie'
    });
    expect(getDocumentChanges(current, { authors: [] })).toEqual([]);
  });

  it('reconstructs files and keeps uneditable associations without mutating either payload', () => {
    const proposed = {
      title: 'New title',
      entrances: [],
      files: [current.files[2]],
      newFiles: [{ id: 4, fileName: 'new.pdf', completePath: '/new.pdf' }],
      modifiedFiles: [{ id: 1, fileName: 'renamed.pdf' }],
      deletedFiles: [{ id: 2, fileName: 'delete.pdf' }]
    };
    const preview = prepareDocumentPreview(current, proposed);
    expect(preview.files.map(file => file.id)).toEqual([3, 1, 4]);
    expect(preview.files[1]).toMatchObject({
      fileName: 'renamed.pdf',
      completePath: '/old.pdf'
    });
    expect(preview.entrances).toEqual(current.entrances);
    expect(current.files[0].fileName).toBe('old.pdf');
    expect(proposed.modifiedFiles[0]).not.toHaveProperty('completePath');
    expect(
      getDocumentChanges(current, proposed).filter(
        change => change.label === 'Files'
      )
    ).toHaveLength(3);
  });

  it('retains pending rename and deletion states when reopening the edit form', () => {
    const edited = prepareDocumentEdit(current, {
      files: [current.files[2]],
      modifiedFiles: [{ id: 1, fileName: 'renamed.pdf' }],
      deletedFiles: [{ id: 2 }]
    });
    expect(edited.files.find(file => file.id === 1).state).toBe('IS_MODIFIED');
    expect(edited.files.find(file => file.id === 2).state).toBe('IS_DELETED');
  });

  it('resolves matching organization names for the preview, diff and edit form', () => {
    const base = {
      ...current,
      authorsOrganization: [{ id: 3714, name: 'Known organization' }],
      editor: { id: 3715, name: 'Known editor' },
      library: { id: 3716, name: 'Known library' }
    };
    const proposed = {
      authorsOrganization: [
        { id: '3714', name: null },
        { id: 4000, name: null },
        { id: 4001, name: 'Proposed organization' }
      ],
      editor: { id: '3715', name: null },
      library: { id: 3716, name: null }
    };
    [prepareDocumentPreview, prepareDocumentEdit].forEach(prepare => {
      const result = prepare(base, proposed);
      expect(result.authorsOrganization.map(author => author.name)).toEqual([
        'Known organization',
        '4000',
        'Proposed organization'
      ]);
      expect(result.editor.name).toBe('Known editor');
      expect(result.library.name).toBe('Known library');
    });
    expect(getDocumentChanges(base, proposed)).toEqual([
      {
        field: 'authorsOrganization',
        label: 'Authors',
        oldText: 'Known organization',
        newText: 'Known organization · 4000 · Proposed organization'
      }
    ]);
    expect(proposed.authorsOrganization[0].name).toBeNull();
  });

  it('preserves supplied names and does not borrow names for different organization ids', () => {
    const base = {
      ...current,
      editor: { id: 1, name: 'Old editor' },
      library: { id: 2, name: 'Old library' }
    };
    expect(prepareDocumentPreview(base, {}).editor).toEqual(base.editor);
    expect(prepareDocumentPreview(base, {}).library).toEqual(base.library);
    const result = prepareDocumentPreview(base, {
      editor: { id: 1, name: 'Supplied editor' },
      library: { id: 3, name: null }
    });
    expect(result.editor.name).toBe('Supplied editor');
    expect(result.library.name).toBe('3');
    expect(
      prepareDocumentPreview(base, { editor: null, library: null })
    ).toMatchObject({ editor: null, library: null });
  });

  it('preserves original image metadata when toFile supplies empty rename metadata', () => {
    const image = {
      id: 1,
      fileName: 'old.png',
      completePath: '/original.png',
      thumbnails: { small: '/small.png', medium: '/medium.png' },
      dateInscription: '2026-01-01',
      isValidated: true
    };
    const proposed = {
      modifiedFiles: [
        {
          id: '1',
          fileName: 'renamed.png',
          completePath: '/documents/undefined',
          thumbnails: null,
          dateInscription: undefined,
          isValidated: undefined
        }
      ]
    };
    const base = { ...current, files: [image] };
    expect(prepareDocumentPreview(base, proposed).files).toEqual([
      { ...image, fileName: 'renamed.png' }
    ]);
    expect(prepareDocumentEdit(base, proposed).files).toEqual([
      { ...image, fileName: 'renamed.png', state: 'IS_MODIFIED' }
    ]);
    expect(proposed.modifiedFiles[0].thumbnails).toBeNull();
  });

  it('compares subjects, geographic coverage, all languages and the creator comment', () => {
    const base = {
      subjects: [{ id: '1', subject: 'General' }],
      iso3166: [{ iso: 'FR', name: 'France' }],
      languages: ['eng', 'fra'],
      creatorComment: 'Old comment'
    };
    const proposed = {
      subjects: [{ id: '2', subject: 'Geology' }],
      iso3166: [{ iso: 'ES', name: 'España' }],
      languages: ['eng', 'spa'],
      creatorComment: null
    };
    expect(getDocumentChanges(base, proposed)).toEqual([
      {
        field: 'creatorComment',
        label: 'Creator comment',
        oldText: 'Old comment',
        newText: ''
      },
      {
        field: 'subjects',
        label: 'Subjects',
        oldText: '1 General',
        newText: '2 Geology'
      },
      {
        field: 'iso3166',
        label: 'Geographic coverage',
        oldText: 'France (FR)',
        newText: 'España (ES)'
      },
      {
        field: 'languages',
        label: 'Languages',
        oldText: 'eng · fra',
        newText: 'eng · spa'
      }
    ]);
    expect(
      getDocumentChanges(base, { subjects: [], iso3166: [], languages: [] })
    ).toEqual([]);
    expect(
      getDocumentChanges(base, {
        ...base,
        subjects: [{ id: '1', subject: 'Renamed subject' }],
        iso3166: [{ iso: 'FR', name: 'Renamed country' }],
        languages: [...base.languages].reverse()
      })
    ).toEqual([]);
  });

  it('reconstructs arbitrary disjoint kept, renamed, deleted and new file sets', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            fileName: fc.string(),
            state: fc.constantFrom('keep', 'rename', 'delete', 'new')
          }),
          { maxLength: 30 }
        ),
        entries => {
          const files = entries.map((entry, id) => ({
            id,
            fileName: entry.fileName,
            completePath: `/files/${id}`,
            thumbnails: { small: `/thumbnails/${id}` }
          }));
          const base = {
            files: files.filter((_file, id) => entries[id].state !== 'new')
          };
          const proposed = {
            files: base.files,
            newFiles: files.filter((_file, id) => entries[id].state === 'new'),
            modifiedFiles: files
              .filter((_file, id) => entries[id].state === 'rename')
              .map(file => ({
                id: String(file.id),
                fileName: `${file.fileName}-renamed`,
                completePath: '/undefined',
                thumbnails: null
              })),
            deletedFiles: files
              .filter((_file, id) => entries[id].state === 'delete')
              .map(file => ({ id: String(file.id) }))
          };
          const before = JSON.stringify({ base, proposed });
          const result = prepareDocumentPreview(base, proposed).files;
          const expected = files
            .filter((_file, id) => entries[id].state !== 'delete')
            .map(file => ({
              ...file,
              fileName:
                entries[file.id].state === 'rename'
                  ? `${file.fileName}-renamed`
                  : file.fileName
            }));
          expect(result).toHaveLength(expected.length);
          expect(result).toEqual(expect.arrayContaining(expected));
          expect(JSON.stringify({ base, proposed })).toBe(before);
        }
      ),
      { numRuns: 100 }
    );
  });
});
