// These are physical, one-based PDF pages, never publication page numbers.
export const parsePdfPages = (value, pageCount) => {
  if (!value?.trim())
    return pageCount == null
      ? null
      : Array.from({ length: pageCount }, (_, index) => index);
  const pages = new Set();
  for (const part of value.split(',')) {
    const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error('pdf.pagesError');
    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      start < 1 ||
      end < start ||
      (pageCount != null && end > pageCount)
    )
      throw new Error('pdf.pagesError');
    // Syntax validation does not expand an unbounded range before loading.
    if (pageCount != null)
      for (let page = start; page <= end; page++) pages.add(page - 1);
  }
  return pageCount == null ? null : [...pages].sort((a, b) => a - b);
};
