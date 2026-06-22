import Papa from 'papaparse';

/**
 * Parses a CSV/TSV/TXT file using PapaParse and returns a 2D array of raw strings.
 *
 * @param {File} file - The file to parse
 * @param {string} encoding - The character encoding to use (e.g. 'UTF-8', 'windows-1252')
 * @returns {Promise<string[][]>} - Resolves with a 2D array of raw strings (blank lines preserved)
 */
export const parseFile = (file, encoding) =>
  new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: false,
      encoding,
      complete: results => resolve(results.data),
      error: err => reject(err)
    });
  });
