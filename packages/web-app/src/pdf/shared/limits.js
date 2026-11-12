// Initial ceilings bound browser work; they are not a guarantee for every phone.
// Keep the limits together so device measurements can refine this policy.
export const PDF_LIMITS = {
  resourceBytes: 64 * 1024 * 1024,
  imagePixels: 24_000_000,
  // 250 MP: room for a few full-resolution photo dossiers (#1631). This is a policy
  // choice, not a measured device limit. JPEGs with orientation 1 are embedded as-is,
  // but PNGs and rotated JPEGs are decoded (~4 bytes per pixel), so this budget
  // still allows up to about 1 GB of transient memory.
  totalImagePixels: 250_000_000,
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
