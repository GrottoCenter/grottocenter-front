import { TEXT_LENGTH_LIMITS } from './textLengthLimits';
import { normalizePublicationDate } from './documentDate';

// Mirrors grottocenter-ai/AI_Serveur/config/settings.py defaults, not live
// configuration. Update together until the service exposes a limits endpoint.
export const DOCUMENT_AI_LIMITS = {
  dailyPerUser: 5, // USER_DAILY_LIMIT
  concurrentPerUser: 2, // USER_MAX_CONCURRENT
  dailyTotal: 200, // GLOBAL_DAILY_LIMIT (provisional)
  sizeMb: 60, // MAX_FILE_SIZE_MB
  pages: 300 // MAX_PAGES
};

// The service labels its limit MB but converts it using 1024 * 1024 bytes.
// Display sizeMb as configured (60 MB); use the exact byte limit for validation.
export const DOCUMENT_AI_MAX_FILE_SIZE =
  DOCUMENT_AI_LIMITS.sizeMb * 1024 * 1024;

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
  const title = typeof metadata.title === 'string' ? metadata.title.trim() : '';
  const languages = Array.isArray(metadata.languages) ? metadata.languages : [];
  const descriptions = Array.isArray(metadata.descriptions)
    ? metadata.descriptions
    : [];
  return {
    title: title && title.length <= TEXT_LENGTH_LIMITS.TITLE ? title : null,
    languages: [
      ...new Set(
        languages
          .filter(value => typeof value === 'string')
          .map(value => value.trim().toLowerCase())
          .filter(value => /^[a-z]{3}$/.test(value))
      )
    ],
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
