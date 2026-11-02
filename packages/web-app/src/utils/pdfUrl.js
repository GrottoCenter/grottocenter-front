import { normalizeIdentifierType } from './documentIdentifier';

export const isPdfUrl = url => {
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
export const isPdfPageOffsetValid = offset =>
  offset == null ||
  (Number.isInteger(offset) && Math.abs(offset) <= 2147483647);

// Empty fields remove the mapping; an incomplete/invalid draft blocks saving.
export const getPdfPageOffset = (printedPage, pdfPage) => {
  if (printedPage === '' && pdfPage === '') return null;
  const printed = Number(printedPage);
  const pdf = Number(pdfPage);
  if (
    !Number.isSafeInteger(printed) ||
    !Number.isSafeInteger(pdf) ||
    printed < 1 ||
    pdf < 1 ||
    printed > 2147483647 ||
    pdf > 2147483647
  )
    return NaN;
  return pdf - printed;
};

export const withPdfPage = (url, page, offset = null) => {
  if (!url || !Number.isSafeInteger(page) || page < 1) return url;
  if (!isPdfPageOffsetValid(offset)) return url;
  const target = page + (offset ?? 0);
  if (!Number.isSafeInteger(target) || target < 1) return url;
  const [base, fragment] = url.split('#');
  const options = new URLSearchParams(fragment);
  options.set('page', target);
  return `${base}#${options}`;
};
