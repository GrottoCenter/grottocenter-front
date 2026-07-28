import { DocumentTypes } from './documentTypeHelpers';

// Builds an ISO 690 style citation string for a document.
//
// The GrottoCenter data model is looser than ISO 690, so every field is
// optional and the citation is assembled from whatever is available:
//   ARTICLE: Author(s), Year. Article title. Journal. Volume/number, pages
//   BOOK:    Author(s), Year. Book title. Publisher. Collection. ISBN
// (Edition and City have no dedicated fields — the publisher name usually
//  embeds the city already, e.g. "Denoël (Paris)".)
//
// Author first/last names are not stored separately: the person `nickname`
// already holds the "LASTNAME, Firstname" form, so it is used verbatim.

const REFERENCE_TYPES = new Set([DocumentTypes.ARTICLE, DocumentTypes.BOOK]);

export const hasIso690Reference = doc => !!doc && REFERENCE_TYPES.has(doc.type);

const extractYear = date => {
  if (!date) return null;
  const match = String(date).match(/\d{4}/);
  return match ? match[0] : null;
};

const getAuthorNames = doc =>
  [
    ...(doc.authors ?? []).map(a => a.nickname),
    ...(doc.authorsOrganization ?? []).map(o => o.name)
  ].filter(Boolean);

const getIsbn = doc =>
  String(doc.identifierType ?? '').toLowerCase() === 'isbn'
    ? doc.identifier
    : null;

// Joins non-empty segments with ". ", avoiding double periods, and ends the
// whole citation with a single period.
const joinSegments = segments => {
  const cleaned = segments
    .map(segment => (segment == null ? '' : String(segment).trim()))
    .filter(Boolean)
    .map(segment => segment.replace(/\.$/, ''));
  if (cleaned.length === 0) return null;
  return `${cleaned.join('. ')}.`;
};

export const formatDocumentReference = doc => {
  if (!hasIso690Reference(doc)) return null;

  const authors = getAuthorNames(doc);
  const year = extractYear(doc.datePublication);
  // "LASTNAME, Firstname; LASTNAME, Firstname, Year"
  const lead = [authors.join('; '), year].filter(Boolean).join(', ');

  const segments = [lead, doc.title];

  if (doc.type === DocumentTypes.ARTICLE) {
    // Journal / periodical name: the parent document, else the BBS-legacy
    // publication field, else the holding library as a last resort.
    segments.push(
      doc.parent?.title ?? doc.oldBBS?.publicationOther ?? doc.library?.name
    );
    segments.push([doc.issue, doc.pages].filter(Boolean).join(', '));
  } else {
    segments.push(doc.editor?.name);
    segments.push(doc.parent?.title);
    segments.push(getIsbn(doc));
  }

  return joinSegments(segments);
};
