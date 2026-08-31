import { DocumentTypes } from './documentTypeHelpers';

const REFERENCE_TYPES = new Set([DocumentTypes.ARTICLE, DocumentTypes.BOOK]);

const extractYear = date => {
  if (!date) return null;
  const match = String(date).match(/\d{4}/);
  return match ? match[0] : null;
};

const getAuthorNames = document =>
  [
    ...(document.authors ?? []).map(author => author.nickname),
    ...(document.authorsOrganization ?? []).map(author => author.name)
  ].filter(Boolean);

const getIdentifierType = identifierType => {
  if (typeof identifierType === 'string') return identifierType;
  return identifierType?.id ?? identifierType?.name ?? null;
};

const normalizeIdentifierType = identifierType =>
  String(getIdentifierType(identifierType) ?? '')
    .trim()
    .toLowerCase();

const formatIdentifier = document => {
  const type = normalizeIdentifierType(document.identifierType);
  const value = document.identifier?.trim();
  if (!value) return null;

  if (type === 'url') return `Available at: ${value}`;
  if (['doi', 'isbn', 'issn'].includes(type))
    return `${type.toUpperCase()} ${value}`;
  return value;
};

const formatPrefixedValue = (value, prefix, existingPrefix) => {
  if (!value) return null;
  const normalizedValue = String(value).trim();
  return existingPrefix.test(normalizedValue)
    ? normalizedValue
    : `${prefix}${normalizedValue}`;
};

const formatPages = pages =>
  formatPrefixedValue(pages, 'p. ', /^p(?:p)?\.?\s/i);

const formatIssue = issue => formatPrefixedValue(issue, 'no. ', /^no\.?\s*/i);

const getArticleMetadata = document => ({
  publicationTitle: document.oldBBS?.publicationOther ?? document.parent?.title,
  publicationDate: document.datePublication ?? null,
  issue: document.oldBBS?.publicationFascicule,
  pages: document.pages ?? document.oldBBS?.pages
});

const joinSegments = segments => {
  const cleaned = segments
    .map(segment => (segment == null ? '' : String(segment).trim()))
    .filter(Boolean)
    .map(segment => segment.replace(/\.+$/, ''));

  return cleaned.length > 0 ? `${cleaned.join('. ')}.` : null;
};

const hasCitationMetadata = document => {
  const commonMetadata =
    getAuthorNames(document).length > 0 ||
    extractYear(document.datePublication);

  if (document.type === DocumentTypes.ARTICLE) {
    const article = getArticleMetadata(document);
    return Boolean(commonMetadata || Object.values(article).some(Boolean));
  }

  return Boolean(
    commonMetadata || document.editor?.name || document.identifier
  );
};

/**
 * Builds an ISO 690 author-date reference from the available document metadata.
 * Returns null for other document types and for article/book payloads that only
 * carry a title, so callers can deliberately fall back to that bare title.
 */
export const formatDocumentReference = document => {
  if (
    !document ||
    !REFERENCE_TYPES.has(document.type) ||
    !hasCitationMetadata(document)
  )
    return null;

  const article =
    document.type === DocumentTypes.ARTICLE
      ? getArticleMetadata(document)
      : null;
  const authors = getAuthorNames(document);
  const year = extractYear(document.datePublication);
  const isOnline = normalizeIdentifierType(document.identifierType) === 'url';
  const title =
    isOnline && document.title ? `${document.title} [online]` : document.title;
  const segments =
    authors.length > 0
      ? [[authors.join('; '), year].filter(Boolean).join(', '), title]
      : [title, year];

  if (article) {
    const additionalDate =
      article.publicationDate?.length > 4 ? article.publicationDate : null;
    const numbering = [formatIssue(article.issue), formatPages(article.pages)]
      .filter(Boolean)
      .join(', ');

    segments.push(article.publicationTitle, additionalDate, numbering);
  } else {
    segments.push(document.editor?.name);
  }

  segments.push(formatIdentifier(document));

  return joinSegments(segments);
};

export const getDocumentReferenceLabel = document =>
  formatDocumentReference(document) ?? document?.title ?? null;
