import {
  buildDocumentsSearchUrl,
  getDocumentReferenceFilter
} from './documentReferenceSearch';

describe('document reference search URLs', () => {
  it('round-trips the supported document relation filters', () => {
    const filter = {
      'authorsOrganization.name': 'Clan des Tritons & friends'
    };
    const url = buildDocumentsSearchUrl(filter);
    const search = url.slice(url.indexOf('?') + 1);

    expect(getDocumentReferenceFilter(new URLSearchParams(search))).toEqual(
      filter
    );
  });

  it('ignores unrelated query parameters', () => {
    const searchParams = new URLSearchParams({
      'authors.nickname': 'Alice',
      title: 'Hidden title filter'
    });

    expect(getDocumentReferenceFilter(searchParams)).toEqual({
      'authors.nickname': 'Alice'
    });
  });

  it('returns the unfiltered documents page for an empty filter', () => {
    expect(buildDocumentsSearchUrl({})).toBe('/ui/documents');
  });
});
