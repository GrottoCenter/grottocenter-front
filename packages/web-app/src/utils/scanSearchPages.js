// Sequential reads let cancellation stop before issuing the next page.
export const scanSearchPages = async ({
  getPage,
  signal,
  onProgress,
  requireUniqueIds = false,
  incompleteMessage
}) => {
  const records = [];
  let total = 0;
  let pageNumber = 1;
  const ids = new Set();
  onProgress({ loaded: records.length, total });
  while (pageNumber === 1 || records.length < total) {
    signal.throwIfAborted();
    // Each page depends on the preceding page's total and cancellation state.
    // eslint-disable-next-line no-await-in-loop
    const page = await getPage({ pageParam: pageNumber, signal });
    signal.throwIfAborted();
    if (
      !Array.isArray(page.results) ||
      !Number.isInteger(page.totalResults) ||
      page.totalResults < 0 ||
      (requireUniqueIds && pageNumber > 1 && page.totalResults !== total)
    ) {
      throw new Error(incompleteMessage);
    }
    total = page.totalResults;
    if (!page.results.length && records.length < total) {
      throw new Error(incompleteMessage);
    }
    for (const record of page.results) {
      const id = String(record.id);
      // A repeated ID means offset pagination shifted while we were scanning.
      // Do not claim completeness when another person may have been skipped.
      if (requireUniqueIds && (record.id == null || ids.has(id))) {
        throw new Error(incompleteMessage);
      }
      ids.add(id);
      records.push(record);
    }
    onProgress({ loaded: records.length, total });
    pageNumber += 1;
  }
  return records;
};
