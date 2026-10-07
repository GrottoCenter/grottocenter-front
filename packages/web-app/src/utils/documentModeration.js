import {
  IS_DELETED,
  IS_MODIFIED
} from '@/components/appli/EntitiesForm/Document/formElements/AddFileForm/FileHelpers';

// UI convention: a document is new until its first moderation decision.
// Corrections before that decision remain a creation, reviewed in full.
// The API also sets validator on refusal, so a refused document submitted
// again after correction intentionally counts as modified, even if it has
// never been accepted. Read validator from the base detail: pending snapshots
// omit it, and edits reset isValidated/dateValidation but retain validator.
export const getDocumentSubmissionKind = current => {
  if (!current?.dateInscription) return 'unknown';
  return current.validator ? 'modification' : 'creation';
};

const getProposedDocumentFiles = (current, proposed) => {
  const changedIds = new Set(
    [
      ...(proposed.modifiedFiles ?? []),
      ...(proposed.deletedFiles ?? []),
      ...(proposed.newFiles ?? [])
    ].map(file => String(file.id))
  );
  return [
    ...(proposed.files ?? []).filter(file => !changedIds.has(String(file.id))),
    ...(proposed.modifiedFiles ?? []).map(file => {
      const old = (current.files ?? []).find(
        item => String(item.id) === String(file.id)
      );
      return {
        ...old,
        ...file,
        // A rename only carries id/fileName; its download is still the old file.
        completePath: old?.completePath ?? file.completePath
      };
    }),
    ...(proposed.newFiles ?? [])
  ];
};

export const prepareDocumentPreview = (current, proposed) => ({
  ...current,
  ...proposed,
  // These relations and metadata are not editable through the submission form,
  // and populateJSON returns empty relations for them in the pending detail.
  creator: current.creator,
  dateInscription: current.dateInscription,
  dateReviewed: current.dateReviewed,
  entrances: current.entrances,
  cave: current.cave,
  authors: (proposed.authors ?? []).map(author => ({
    ...author,
    nickname: author.nickname || String(author.id)
  })),
  authorsOrganization: (proposed.authorsOrganization ?? []).map(author => ({
    ...author,
    name: author.name || String(author.id)
  })),
  files: getProposedDocumentFiles(current, proposed)
});

export const prepareDocumentEdit = (current, proposed) => {
  const preview = prepareDocumentPreview(current, proposed);
  return {
    ...preview,
    files: [
      ...preview.files.map(file => ({
        ...file,
        state: (proposed.modifiedFiles ?? []).some(
          modified => String(modified.id) === String(file.id)
        )
          ? IS_MODIFIED
          : undefined
      })),
      ...(proposed.deletedFiles ?? []).map(file => ({
        ...(current.files ?? []).find(
          old => String(old.id) === String(file.id)
        ),
        ...file,
        state: IS_DELETED
      }))
    ]
  };
};

const TEXT_FIELDS = [
  ['title', 'Title'],
  ['description', 'Description'],
  ['type', 'Document type'],
  ['datePublication', 'Publication Date'],
  ['identifier', 'Identifier'],
  ['identifierType', 'Identifier type'],
  ['pages', 'Pages'],
  ['issue', 'Issue'],
  ['license', 'License'],
  ['mainLanguage', 'Title and description language']
];

const sortedAuthors = authors =>
  [...authors].sort((a, b) => String(a.id).localeCompare(String(b.id)));

const authorNames = authors =>
  authors.map(author => author.nickname || author.name || String(author.id));

// Only compare the known, directly supplied fields. In particular, an empty
// populated collection can also mean "omitted" in a partial API submission,
// so do not report a whole author collection as deleted on that evidence.
export const getDocumentChanges = (current, proposed) => {
  const changes = TEXT_FIELDS.flatMap(([field, label]) => {
    if (!Object.hasOwn(proposed, field)) return [];
    const oldText = String(current[field] ?? '');
    const newText = String(proposed[field] ?? '');
    return oldText === newText ? [] : [{ field, label, oldText, newText }];
  });

  ['authors', 'authorsOrganization'].forEach(field => {
    if (!proposed[field]?.length || !Array.isArray(current[field])) return;
    const oldAuthors = sortedAuthors(current[field]);
    const newAuthors = sortedAuthors(proposed[field]);
    if (
      oldAuthors.map(author => String(author.id)).join(',') ===
      newAuthors.map(author => String(author.id)).join(',')
    )
      return;
    changes.push({
      field,
      label: 'Authors',
      oldText: authorNames(oldAuthors).join(' · '),
      newText: authorNames(newAuthors).join(' · ')
    });
  });

  [
    ['parent', 'Parent document'],
    ['editor', 'Editor'],
    ['library', 'Library']
  ].forEach(([field, label]) => {
    // null can mean an omitted relation in populateJSON; keep this diff modest.
    if (!proposed[field]?.id) return;
    if (String(current[field]?.id) === String(proposed[field].id)) return;
    const old = current[field];
    const next = proposed[field];
    changes.push({
      field,
      label,
      oldText: old ? String(old.title || old.name || old.id) : '',
      newText: String(next.title || next.name || next.id)
    });
  });

  ['newFiles', 'modifiedFiles', 'deletedFiles'].forEach(field => {
    (proposed[field] ?? []).forEach(file => {
      const old = (current.files ?? []).find(
        item => String(item.id) === String(file.id)
      );
      changes.push({
        field: `${field}-${file.id}`,
        label: 'Files',
        oldText:
          field === 'newFiles' ? '' : old?.fileName || file.fileName || '',
        newText: field === 'deletedFiles' ? '' : file.fileName || ''
      });
    });
  });
  return changes;
};
