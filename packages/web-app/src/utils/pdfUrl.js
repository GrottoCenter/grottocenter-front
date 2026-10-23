import { normalizeIdentifierType } from './documentIdentifier';

const isPdfUrl = url => {
  try {
    // Query strings and viewer fragments may follow the extension.
    const parsedUrl = new URL(url);
    return (
      ['http:', 'https:'].includes(parsedUrl.protocol) &&
      parsedUrl.pathname.toLowerCase().endsWith('.pdf')
    );
  } catch {
    return false;
  }
};

// Descriptions may cite other publications and cannot identify this PDF.
export const findDocumentPdfUrl = document => {
  if (normalizeIdentifierType(document?.identifierType) !== 'url') return null;
  const url = document.identifier?.trim();
  return isPdfUrl(url) ? url : null;
};

// Keep query strings and other viewer options when targeting an article page.
export const withPdfPage = (url, page) => {
  if (!url || !Number.isSafeInteger(page) || page < 1) return url;
  const [base, fragment] = url.split('#');
  const options = new URLSearchParams(fragment);
  options.set('page', page);
  return `${base}#${options}`;
};
