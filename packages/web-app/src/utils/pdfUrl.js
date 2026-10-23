/**
 * Some documents carry no attached file but link to a PDF hosted elsewhere —
 * either in their `identifier` field (when `identifierType` is 'url') or, for
 * older records, somewhere inside their free-text description.
 */

// Deliberately permissive: any http(s) run of non-space characters. The `.pdf`
// test below is what actually filters, so a loose match costs nothing.
const URL_REGEX = /https?:\/\/[^\s<>"']+/gi;

// A URL closing a sentence swallows its punctuation ("… see http://x.org/a.pdf.").
const TRAILING_PUNCTUATION_REGEX = /[.,;:!?)\]}]+$/;

// Test the pathname rather than the whole URL: query strings and fragments are
// common on these links (…/a.pdf?dl=1) and would defeat a naive endsWith.
const isPdfUrl = url => {
  try {
    return new URL(url).pathname.toLowerCase().endsWith('.pdf');
  } catch {
    return false;
  }
};

/**
 * First PDF link found in the given texts, or null. Sources are scanned in the
 * order given, so the caller decides which field takes precedence.
 * @param {...(string|null|undefined)} texts - Strings to scan, nullish ones skipped
 * @returns {string|null} The PDF URL, or null when none is found
 */
export const findPdfUrl = (...texts) =>
  texts
    .filter(Boolean)
    .flatMap(text => text.match(URL_REGEX) ?? [])
    .map(url => url.replace(TRAILING_PUNCTUATION_REGEX, ''))
    .find(isPdfUrl) ?? null;
