// Initial ceilings bound browser work; they are not a guarantee for every phone.
// Keep the limits together so device measurements can refine this policy.
export const PDF_LIMITS = {
  resourceBytes: 64 * 1024 * 1024,
  imagePixels: 24_000_000,
  totalImagePixels: 48_000_000,
  pages: 200
};

export const checkPdfLimit = (value, maximum) => {
  if (!Number.isFinite(value) || value > maximum)
    throw new Error('pdf.resourceLimit');
};

export const PDF_ERROR_IDS = new Set([
  'pdf.annotationError',
  'pdf.resourceLimit'
]);
