const URL_REGEX = /https?:\/\/[^\s<>"']+/gi;
// Exclude sentence punctuation when extracting a link from a description.
const TRAILING_PUNCTUATION_REGEX = /[.,;:!?)\]}]+$/;

const isPdfUrl = url => {
  try {
    // Query strings and viewer fragments may follow the extension.
    return new URL(url).pathname.toLowerCase().endsWith('.pdf');
  } catch {
    return false;
  }
};

// Prefer a URL identifier to links embedded in the document description.
export const findDocumentPdfUrl = document =>
  [
    document?.identifierType === 'url' ? document.identifier : null,
    document?.description
  ]
    .flatMap(text => text?.match(URL_REGEX) ?? [])
    .map(url => url.replace(TRAILING_PUNCTUATION_REGEX, ''))
    .find(isPdfUrl) ?? null;

// Keep query strings and other viewer options when targeting an article page.
export const withPdfPage = (url, page) => {
  if (!url || !Number.isSafeInteger(page) || page < 1) return url;
  const [base, fragment] = url.split('#');
  const options = new URLSearchParams(fragment);
  options.set('page', page);
  return `${base}#${options}`;
};
