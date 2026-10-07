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
});
