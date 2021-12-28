import {
  defaultTo,
  pipe,
  pathOr,
  map,
  propOr,
  reject,
  isEmpty,
  head
} from 'ramda';

export const makeOverview = data => ({
  createdBy: pathOr('', ['author', 'nickname'], data),
  creationDate: pathOr('', ['dateInscription'], data),
  authors: pipe(
    propOr([], 'authors'),
    map(propOr('', 'nickname')),
    reject(isEmpty),
    defaultTo([])
  )(data),
  language: pathOr('unknown', ['mainLanguage', 'refName'], data),
  license: pathOr('unknown', ['license'], data),
  title: pipe(
    propOr([], 'titles'),
    head,
    propOr('No title provided', 'text')
  )(data),
  summary: pipe(propOr([], 'descriptions'), head, propOr('', 'text'))(data)
});

export const makeOrganizations = data => ({
  editor: pathOr('', ['editor', 'name'], data),
  library: pathOr('', ['library', 'name'], data)
});

export const makeDetails = data => {
  const formatedIdentfier = pathOr(null, ['identifierType', 'id'], data)
    ? `${propOr(
        '',
        'identifier',
        data
      )} (${data.identifierType.id.toUpperCase()})`
    : propOr('', 'identifier', data);
  return {
    authorComment: propOr('', 'authorComment', data),
    identifier: formatedIdentfier,
    bbsReference: propOr('', 'refBbs', data),
    documentType: pathOr('', ['type', 'name'], data),
    publicationDate: propOr('', 'datePublication', data),
    oldPublication: propOr('', 'publication', data),
    oldPublicationFascicule: propOr('', 'publicationFasciculeBBSOld', data),
    pages: propOr('', 'pages', data),
    subjects: pipe(propOr([], 'subjects'), reject(isEmpty))(data),
    regions: pipe(propOr([], 'regions'), reject(isEmpty))(data)
  };
};

export const makeEntities = data => {
  return {
    massif: pathOr(
      pipe(pathOr([], ['massif', 'names']), head, pathOr('', ['name']))(data),
      ['massif', 'name'],
      data
    ),
    cave: pathOr(
      pipe(pathOr([], ['cave', 'names']), head, pathOr('', ['name']))(data),
      ['cave', 'name'],
      data
    ),
    entrance: pathOr(
      pipe(pathOr([], ['entrance', 'names']), head, pathOr('', ['name']))(data),
      ['entrance', 'name'],
      data
    ),
    files: {
      fileNames: pipe(pathOr([], ['files']), map(propOr('', 'fileName')))(data),
      fileLinks: pipe(
        pathOr([], ['files']),
        map(file => ({ href: propOr('', 'completePath', file) }))
      )(data)
    },
    authorizationDocument: pipe(
      pathOr([], ['authorizationDocument', 'titles']),
      head,
      pathOr('', ['text'])
    )(data)
  };
};

export const makeDocumentParent = data => {
  const result = { title: '', url: '' };
  const parent = propOr(null, 'parent', data);
  if (parent) {
    result.title = pipe(propOr([], 'titles'), head, propOr('', 'text'))(parent);
    result.url = `/ui/documents/${parent.id}`;
  }
  return result;
};

export const makeDocumentChildren = (data, locale) => {
  const makeChild = doc => ({
    id: doc.id,
    url: `/ui/documents/${doc.id}`,
    title: pipe(
      propOr([], 'titles'),
      head,
      propOr('No title provided', 'text')
    )(doc),
    childrenData: doc.children ? doc.children.map(c => makeChild(c)) : null
  });

  const children = data.map(childDoc => makeChild(childDoc));

  return children.sort((c1, c2) =>
    c1.title.localeCompare(c2.title, locale, { numeric: true })
  );
};
