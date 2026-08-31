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

const getIsbn = document =>
  String(getIdentifierType(document.identifierType) ?? '').toLowerCase() ===
  'isbn'
    ? document.identifier
    : null;

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
    return Boolean(
      commonMetadata ||
      document.parent?.title ||
      document.oldBBS?.publicationOther ||
      document.library?.name ||
      document.issue ||
      document.oldBBS?.publicationFascicule ||
      document.pages ||
      document.oldBBS?.pages
    );
  }

  return Boolean(
    commonMetadata ||
    document.editor?.name ||
    document.parent?.title ||
    getIsbn(document)
  );
};

/**
 * Builds the best ISO 690-style reference supported by the document model.
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

  const authors = getAuthorNames(document);
  const year = extractYear(document.datePublication);
  const lead = [authors.join('; '), year].filter(Boolean).join(', ');
  const segments = [lead, document.title];

  if (document.type === DocumentTypes.ARTICLE) {
    segments.push(
      document.parent?.title ??
        document.oldBBS?.publicationOther ??
        document.library?.name
    );
    segments.push(
      [
        document.issue ?? document.oldBBS?.publicationFascicule,
        document.pages ?? document.oldBBS?.pages
      ]
        .filter(Boolean)
        .join(', ')
    );
  } else {
    segments.push(document.editor?.name);
    segments.push(document.parent?.title);
    segments.push(getIsbn(document));
  }

  return joinSegments(segments);
};

export const getDocumentReferenceLabel = document =>
  formatDocumentReference(document) ?? document?.title ?? null;
