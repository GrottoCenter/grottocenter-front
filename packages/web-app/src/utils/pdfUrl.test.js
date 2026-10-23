import { findPdfUrl } from './pdfUrl';

describe('findPdfUrl', () => {
  it('returns a bare PDF url', () => {
    const url = 'https://cds38.org/wp/uploads/scialet-32.pdf';
    expect(findPdfUrl(url)).toBe(url);
  });

  it('extracts a PDF url from surrounding text', () => {
    expect(
      findPdfUrl('Compte rendu disponible sur https://example.org/a.pdf merci')
    ).toBe('https://example.org/a.pdf');
  });

  it('drops the punctuation closing the sentence', () => {
    expect(findPdfUrl('Voir https://example.org/a.pdf.')).toBe(
      'https://example.org/a.pdf'
    );
  });

  it('accepts a query string after the extension', () => {
    const url = 'https://example.org/a.pdf?dl=1';
    expect(findPdfUrl(url)).toBe(url);
  });

  it('scans sources in order', () => {
    expect(
      findPdfUrl('https://first.org/a.pdf', 'https://second.org/b.pdf')
    ).toBe('https://first.org/a.pdf');
  });

  it('skips nullish sources', () => {
    expect(findPdfUrl(null, undefined, 'https://example.org/a.pdf')).toBe(
      'https://example.org/a.pdf'
    );
  });

  it('ignores non-PDF urls', () => {
    expect(findPdfUrl('https://example.org/page.html')).toBeNull();
  });

  it('ignores a url whose host merely mentions pdf', () => {
    expect(findPdfUrl('https://pdf.example.org/page')).toBeNull();
  });

  it('returns null without any source', () => {
    expect(findPdfUrl()).toBeNull();
  });
});
