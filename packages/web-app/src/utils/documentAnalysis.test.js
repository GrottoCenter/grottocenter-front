import { normalizeDocumentAnalysis } from './documentAnalysis';

const analyze = publicationDate =>
  normalizeDocumentAnalysis({
    message: 'success',
    document_metadata: [
      { publication_date: publicationDate, descriptions: ['Summary'] }
    ]
  });

it.each(['2010', '2010-02', '2012-02-29'])(
  'preserves the supplied date precision %s',
  date => {
    expect(analyze(date)).toEqual({
      title: null,
      languages: [],
      descriptions: ['Summary'],
      datePublication: date
    });
  }
);

it.each([
  '2010-02-29',
  '2010-13',
  '0999',
  '9999',
  '2010-01-32',
  '2010/01/01',
  '',
  null,
  ['2010']
])('drops an unusable date %j while keeping the summary', date => {
  expect(analyze(date)).toEqual({
    title: null,
    languages: [],
    descriptions: ['Summary'],
    datePublication: null
  });
});

it('offers a date even when no summary is available', () => {
  expect(
    normalizeDocumentAnalysis({
      message: 'success',
      document_metadata: [{ publication_date: '2010' }]
    })
  ).toEqual({
    title: null,
    languages: [],
    descriptions: [],
    datePublication: '2010'
  });
});

it('normalizes the title and ISO language IDs of the principal document', () => {
  expect(
    normalizeDocumentAnalysis({
      message: 'success',
      document_metadata: [
        {
          title: '  Main title  ',
          languages: ['CAT', ' eng ', 'cat', null, 1, 'fr', '']
        },
        { title: 'Child title', languages: ['fra'] }
      ]
    })
  ).toEqual({
    title: 'Main title',
    languages: ['cat', 'eng'],
    descriptions: [],
    datePublication: null
  });
});

it.each([null, 123, ['Bad title'], ' ', 'x'.repeat(301)])(
  'does not propose an unusable or oversized title',
  title => {
    expect(
      normalizeDocumentAnalysis({
        message: 'success',
        document_metadata: [{ title, languages: null }]
      })
    ).toMatchObject({ title: null, languages: [] });
  }
);
