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
    parentDocument: pipe(
      pathOr([], ['parent', 'titles']),
      head,
      propOr('', 'text')
    )(data),
    pages: propOr('', 'pages', data),
    subjects: pipe(propOr([], 'subjects'), reject(isEmpty))(data),
    regions: pipe(propOr([], 'regions'), reject(isEmpty))(data)
  };
};

export const makeEntities = data => ({
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
  )
});
