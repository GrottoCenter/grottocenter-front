import { findDocumentPdfUrl, withPdfPage } from './pdfUrl';

describe('findDocumentPdfUrl', () => {
  const url = 'https://example.org/a.pdf';

  it('reads a URL identifier', () => {
    expect(findDocumentPdfUrl({ identifier: url, identifierType: 'url' })).toBe(
      url
    );
  });

  it.each([
    ['a bare URL', url, url],
    ['surrounding text', `Read ${url} please`, url],
    ['sentence punctuation', `See ${url}.`, url],
    ['query and fragment', `${url}?dl=1#page=12`, `${url}?dl=1#page=12`],
    ['a non-PDF URL', 'https://example.org/page.html', null],
    ['a host mentioning PDF', 'https://pdf.example.org/page', null]
  ])('handles %s in the description', (_label, description, expected) => {
    expect(findDocumentPdfUrl({ description })).toBe(expected);
  });

  it('prefers the URL identifier over the description', () => {
    expect(
      findDocumentPdfUrl({
        identifier: 'https://first.org/a.pdf',
        identifierType: 'url',
        description: 'https://second.org/b.pdf'
      })
    ).toBe('https://first.org/a.pdf');
  });

  it.each([undefined, null, {}])(
    'returns null without a source (%s)',
    document => {
      expect(findDocumentPdfUrl(document)).toBeNull();
    }
  );

  it.each(['doi', undefined])(
    'ignores non-URL identifier types (%s)',
    identifierType => {
      expect(
        findDocumentPdfUrl({
          identifier: url,
          identifierType
        })
      ).toBeNull();
    }
  );
});

describe('withPdfPage', () => {
  it('preserves the query and other viewer options while replacing the page', () => {
    expect(
      withPdfPage('https://example.org/issue.pdf?dl=1#page=4&zoom=125', 12)
    ).toBe('https://example.org/issue.pdf?dl=1#page=12&zoom=125');
  });

  it('also handles relative attachment paths', () => {
    expect(withPdfPage('/files/issue.pdf', 12)).toBe(
      '/files/issue.pdf#page=12'
    );
  });

  it.each([undefined, null, 0, -1, 1.5, Infinity])(
    'keeps the existing destination for an invalid page (%s)',
    page => {
      expect(withPdfPage('https://example.org/a.pdf#page=3', page)).toBe(
        'https://example.org/a.pdf#page=3'
      );
    }
  );

  it('does not create a URL when no PDF was found', () => {
    expect(withPdfPage(null, 12)).toBeNull();
  });
});
