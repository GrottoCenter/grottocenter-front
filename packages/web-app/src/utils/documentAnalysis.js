import { format, isMatch } from 'date-fns';

export const DOCUMENT_AI_LIMITS = {
  dailyPerUser: 5,
  concurrentPerUser: 2,
  dailyTotal: 200,
  sizeMb: 50,
  pages: 300
};

const DATE_FORMATS = { 4: 'yyyy', 7: 'yyyy-MM', 10: 'yyyy-MM-dd' };

const normalizePublicationDate = value => {
  if (typeof value !== 'string') return null;
  const date = value.trim();
  const pattern = DATE_FORMATS[date.length];
  if (
    !pattern ||
    !/^\d{4}(-\d{2}){0,2}$/.test(date) ||
    !isMatch(date, pattern) ||
    date < '1000' ||
    date > format(new Date(), 'yyyy-MM-dd')
  ) {
    return null;
  }
  return date;
};

export const normalizeDocumentAnalysis = result => {
  if (
    result?.message !== 'success' ||
    !Array.isArray(result.document_metadata) ||
    !result.document_metadata[0] ||
    result.document_metadata[0].parent
  ) {
    throw new Error('Invalid analysis response');
  }
  // Only the uploaded document: subsequent articles may inherit its summary.
  const metadata = result.document_metadata[0];
  const descriptions = Array.isArray(metadata.descriptions)
    ? metadata.descriptions
    : [];
  return {
    descriptions: [
      ...new Set(
        descriptions
          .filter(value => typeof value === 'string')
          .map(value => value.trim())
          .filter(Boolean)
      )
    ],
    datePublication: normalizePublicationDate(metadata.publication_date)
  };
};
