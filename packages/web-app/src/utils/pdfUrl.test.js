import { findDocumentPdfUrl, getPdfPageOffset, withPdfPage } from './pdfUrl';

describe('findDocumentPdfUrl', () => {
  const url = 'https://example.org/a.pdf';

  it('reads a URL identifier', () => {
    expect(findDocumentPdfUrl({ identifier: url, identifierType: 'url' })).toBe(
      url
    );
  });

  it.each([
    ['a bare URL', url, url],
    ['surrounding text', `Read ${url} please`, null],
    ['sentence punctuation', `See ${url}.`, null],
    ['query and fragment', `${url}?dl=1#page=12`, `${url}?dl=1#page=12`],
    [
      'a valid closing parenthesis',
      'https://example.org/a(1).pdf',
      'https://example.org/a(1).pdf'
    ],
    [
      'an uppercase extension',
      'https://example.org/a.PDF',
      'https://example.org/a.PDF'
    ],
    ['an HTTP link', 'http://example.org/a.pdf', 'http://example.org/a.pdf'],
    ['a non-HTTP protocol', 'data:application/pdf,example.pdf', null],
    ['an FTP link', 'ftp://example.org/a.pdf', null],
    ['an invalid URL', 'invalid.pdf', null],
    ['a non-PDF URL', 'https://example.org/page.html', null],
    ['a host mentioning PDF', 'https://pdf.example.org/page', null]
  ])('handles %s in the identifier', (_label, identifier, expected) => {
    expect(findDocumentPdfUrl({ identifierType: 'url', identifier })).toBe(
      expected
    );
  });

  it.each(['url', 'URL', ' Url '])(
    'normalizes the identifier type %s',
    identifierType => {
      expect(
        findDocumentPdfUrl({ identifierType, identifier: `  ${url}  ` })
      ).toBe(url);
    }
  );

  it.each([
    {},
    { identifier: '10.1234/example', identifierType: 'doi' },
    { identifier: 'https://example.org/catalogue', identifierType: 'url' }
  ])(
    'ignores description links regardless of the identifier (%s)',
    identifier => {
      expect(
        findDocumentPdfUrl({ ...identifier, description: `See ${url}` })
      ).toBeNull();
    }
  );

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
  it.each([
    [29, 1, 30],
    [129, -126, 3],
    [29, 0, 29],
    [29, null, 29]
  ])(
    'converts printed page %i with offset %s to PDF page %i',
    (page, offset, target) => {
      expect(withPdfPage('https://example.org/a.pdf', page, offset)).toBe(
        `https://example.org/a.pdf#page=${target}`
      );
    }
  );
  it('keeps the original URL for a destination before the PDF starts', () => {
    expect(withPdfPage('https://example.org/a.pdf', 1, -2)).toBe(
      'https://example.org/a.pdf'
    );
  });
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

describe('getPdfPageOffset', () => {
  it('distinguishes an empty correspondence from an incomplete draft', () => {
    expect(getPdfPageOffset('', '')).toBeNull();
    expect(getPdfPageOffset('29', '')).toBeNaN();
    expect(getPdfPageOffset('1.5', '30')).toBeNaN();
  });
});
