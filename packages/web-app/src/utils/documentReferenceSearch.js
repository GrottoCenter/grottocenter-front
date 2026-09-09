export const DOCUMENT_REFERENCE_FILTER_FIELDS = [
  'authors.nickname',
  'authorsOrganization.name',
  'editor.name'
];

export const buildDocumentsSearchUrl = filter => {
  const searchParams = new URLSearchParams();

  DOCUMENT_REFERENCE_FILTER_FIELDS.forEach(field => {
    const value = filter[field];
    if (value) searchParams.set(field, value);
  });

  const query = searchParams.toString();
  return query ? `/ui/documents?${query}` : '/ui/documents';
};

export const getDocumentReferenceFilter = searchParams =>
  Object.fromEntries(
    DOCUMENT_REFERENCE_FILTER_FIELDS.flatMap(field => {
      const value = searchParams.get(field);
      return value ? [[field, value]] : [];
    })
  );
