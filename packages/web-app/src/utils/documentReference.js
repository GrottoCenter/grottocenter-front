import { DocumentTypes } from './documentTypeHelpers';

const STANDALONE_REFERENCE_TYPES = new Set([
  DocumentTypes.BOOK,
  DocumentTypes.COLLECTION,
  DocumentTypes.ISSUE
]);
const REFERENCE_TYPES = new Set([
  DocumentTypes.ARTICLE,
  ...STANDALONE_REFERENCE_TYPES
]);
const DEFAULT_LABELS = {
  availableAt: 'Available at:',
  online: 'online'
};

const extractYear = date => {
  if (!date) return null;
  const match = String(date).match(/\d{4}/);
  return match ? match[0] : null;
};

const getPersonAuthorName = author =>
  author.name && author.surname
    ? `${author.name} ${author.surname}`
    : author.nickname;

const getAuthorNames = document =>
  [
    ...(document.authors ?? []).map(getPersonAuthorName),
    ...(document.authorsOrganization ?? []).map(author => author.name)
  ].filter(Boolean);

const isPublisherSoleCorporateAuthor = document => {
  const personAuthors = (document.authors ?? []).filter(getPersonAuthorName);
  const organizationAuthors = (document.authorsOrganization ?? []).filter(
    author => author.name
  );

  // ISO 690 recommends retaining a known publisher, but it does not require
  // repeating the same organization in two roles. Omit that redundant segment
  // only when the API IDs prove the publisher is the sole corporate author;
  // comparing display names would incorrectly merge distinct organizations.
  return (
    personAuthors.length === 0 &&
    organizationAuthors.length === 1 &&
    document.editor?.id != null &&
    organizationAuthors[0].id === document.editor.id
  );
};

const getIdentifierType = identifierType => {
  if (typeof identifierType === 'string') return identifierType;
  return identifierType?.id ?? identifierType?.name ?? null;
};

const normalizeIdentifierType = identifierType =>
  String(getIdentifierType(identifierType) ?? '')
    .trim()
    .toLowerCase();

const formatIdentifier = (document, labels) => {
  const type = normalizeIdentifierType(document.identifierType);
  const value = document.identifier?.trim();
  if (!value) return null;

  if (type === 'url') return `${labels.availableAt} ${value}`;
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
  issue: document.oldBBS?.publicationFascicule,
  pages: document.pages ?? document.oldBBS?.pages
});

const createPart = (text, isItalic = false) => {
  if (text == null) return null;
  const cleanedText = String(text).trim().replace(/\.+$/, '');
  return cleanedText ? { text: cleanedText, isItalic } : null;
};

const createSegment = (...parts) => parts.filter(Boolean);

const joinSegments = segments => {
  const cleaned = segments.filter(segment => segment.length > 0);
  if (cleaned.length === 0) return null;

  return cleaned.flatMap((segment, index) => [
    ...segment,
    {
      text: index === cleaned.length - 1 ? '.' : '. ',
      isItalic: false
    }
  ]);
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
 * Returns null for other document types and for supported payloads that only
 * carry a title, so callers can deliberately fall back to that bare title.
 */
export const formatDocumentReferenceParts = (
  document,
  labels = DEFAULT_LABELS
) => {
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
  const title = createSegment(
    createPart(document.title, true),
    isOnline && document.title
      ? { text: ` [${labels.online}]`, isItalic: false }
      : null
  );
  const segments =
    authors.length > 0
      ? [
          createSegment(
            createPart([authors.join('; '), year].filter(Boolean).join(', '))
          ),
          title
        ]
      : [title, createSegment(createPart(year))];

  if (article) {
    const numbering = [formatIssue(article.issue), formatPages(article.pages)]
      .filter(Boolean)
      .join(', ');

    // This formatter uses the ISO 690 author-date form, so the publication year
    // is already placed after the author. Repeating the same date as YYYY-MM
    // after the periodical title adds no distinct source information; the issue
    // title/number identifies the publication more usefully and concisely.
    segments.push(
      createSegment(createPart(article.publicationTitle, true)),
      createSegment(createPart(numbering))
    );
  } else if (!isPublisherSoleCorporateAuthor(document)) {
    segments.push(createSegment(createPart(document.editor?.name)));
  }

  segments.push(createSegment(createPart(formatIdentifier(document, labels))));

  return joinSegments(segments);
};

export const formatDocumentReference = (document, labels = DEFAULT_LABELS) =>
  formatDocumentReferenceParts(document, labels)
    ?.map(part => part.text)
    .join('') ?? null;

export const getDocumentReferenceLabel = document =>
  formatDocumentReference(document) ?? document?.title ?? null;
