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

import getAuthor from '../../util/getAuthor';

const getFirstName = (data, entity) =>
  pathOr(
    pipe(pathOr([], [entity, 'names']), head, propOr('', 'name'))(data),
    [entity, 'name'],
    data
  );

const getEntity = (data, entityName) => ({
  ...(data[entityName] && {
    entityName: {
      id: data[entityName]?.id,
      name: getFirstName(data, entityName)
    }
  })
});

export const makeOverview = data => ({
  author: getAuthor(data.author),
  creationDate: propOr('', 'dateInscription', data),
  authors: pipe(
    propOr([], 'authors'),
    map(auth => getAuthor(auth)),
    reject(isEmpty),
    defaultTo([])
  )(data),
  language: pathOr('unknown', ['mainLanguage', 'refName'], data),
  license: data.license,
  title: pipe(propOr([], 'titles'), head, propOr('', 'text'))(data),
  summary: pipe(propOr([], 'descriptions'), head, propOr('', 'text'))(data)
});

export const makeOrganizations = data => ({
  ...(data.editor && {
    editor: {
      id: data.editor?.id,
      name: data.editor?.name
    }
  }),
  ...(data.library && {
    library: {
      id: data.library?.id,
      name: data.library?.name
    }
  })
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

export const makeEntities = data => ({
  ...getEntity(data, 'cave'),
  ...getEntity(data, 'entrance'),
  ...getEntity(data, 'massif'),
  files: {
    fileNames: pipe(propOr([], 'files'), map(propOr('', 'fileName')))(data),
    fileLinks: pipe(
      propOr([], 'files'),
      map(file => ({ href: propOr('', 'completePath', file) }))
    )(data)
  },
  authorizationDocument: pipe(
    pathOr([], ['authorizationDocument', 'titles']),
    head,
    propOr('', 'text')
  )(data)
});

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
