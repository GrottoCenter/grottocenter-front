import {
  getChildDisplay,
  getChildLabel,
  getIssuesYearRange,
  getPublicationYear,
  hasOwnDescription,
  splitDateQualifier
} from './documentChildrenLabel';

const doc = (title, datePublication = null) => ({ title, datePublication });

describe('getPublicationYear', () => {
  it.each([
    ['2011', '2011'],
    ['2011-06', '2011'],
    ['2011-06-15', '2011'],
    ['2012-01-01T00:00:00.000Z', '2012']
  ])('reads the year out of %s', (input, expected) => {
    expect(getPublicationYear(input)).toBe(expected);
  });

  it.each([null, undefined, '', 'circa 1980', 'n.d.'])(
    'returns null for %s',
    input => {
      expect(getPublicationYear(input)).toBeNull();
    }
  );
});

describe('getChildLabel', () => {
  const COLLECTION = 'Scialet : bulletin du CDS Isère';

  it('drops the leading words the collection heading already shows', () => {
    expect(getChildLabel(doc('Scialet No 47 (2018)'), COLLECTION)).toBe(
      'No 47 (2018)'
    );
  });

  it('drops every shared leading word, not just the first', () => {
    expect(
      getChildLabel(
        doc('Bulletin trimestriel du Spéléo Club Pyrénéen n°1'),
        'Bulletin trimestriel du Spéléo Club Pyrénéen'
      )
    ).toBe('n°1');
  });

  it('leaves a title that shares no leading word untouched', () => {
    expect(getChildLabel(doc('Bulletin du CDS 38, n° 12'), COLLECTION)).toBe(
      'Bulletin du CDS 38, n° 12'
    );
  });

  it('stops at the first word that differs', () => {
    expect(getChildLabel(doc('Scialet spécial 2013'), COLLECTION)).toBe(
      'spécial 2013'
    );
  });

  it('ignores case and trailing punctuation when matching words', () => {
    expect(getChildLabel(doc('scialet: no 5 (1976)'), COLLECTION)).toBe(
      'no 5 (1976)'
    );
  });

  it('removes the separator the shared prefix leaves behind', () => {
    expect(
      getChildLabel(
        doc('Bulletin 1960 - SMSP (Société Méridionale)'),
        'Bulletin 1960'
      )
    ).toBe('SMSP (Société Méridionale)');
  });

  it('trims a trailing separator coming from the title itself', () => {
    expect(
      getChildLabel(
        doc('OCC Newsletters Vol 46 1-3 - Jan-Mar 2010 -'),
        'OCC Newsletters'
      )
    ).toBe('Vol 46 1-3 - Jan-Mar 2010');
  });

  it('keeps a hyphen that sits inside the label', () => {
    expect(getChildLabel(doc('X Vol 46 1-3'), 'X')).toBe('Vol 46 1-3');
  });

  it('never removes the last remaining word', () => {
    expect(getChildLabel(doc('Scialet'), COLLECTION)).toBe('Scialet');
  });

  it('falls back to the title when stripping would empty the label', () => {
    expect(getChildLabel(doc('A -'), 'A')).toBe('A -');
  });

  it.each([
    [null, ''],
    [undefined, ''],
    ['', ''],
    ['   ', '']
  ])('returns an empty label for a %s title', (title, expected) => {
    expect(getChildLabel(doc(title), COLLECTION)).toBe(expected);
  });

  it('tolerates a missing document or collection title', () => {
    expect(getChildLabel(undefined, COLLECTION)).toBe('');
    expect(getChildLabel(doc('Scialet No 47 (2018)'), undefined)).toBe(
      'Scialet No 47 (2018)'
    );
  });

  // The regression this whole helper was rewritten for: stripping a trailing
  // year broke bracketed dates and made distinct issues collide.
  describe('keeps the year inside the label', () => {
    it('does not break a bracketed date', () => {
      expect(
        getChildLabel(
          doc('Karst News Vol. 2, no 1 (Jan.-Mar. 2005)'),
          'Karst News'
        )
      ).toBe('Vol. 2, no 1 (Jan.-Mar. 2005)');
    });

    it('keeps two issues of the same month in different years distinct', () => {
      const collection = 'University of Bristol Spelaeological Society';
      const a = getChildLabel(
        doc('UBSS - Monthly Newsletter - February 1996'),
        collection
      );
      const b = getChildLabel(
        doc('UBSS - Monthly Newsletter - February 1993'),
        collection
      );
      expect(a).not.toBe(b);
    });

    it('leaves no orphan punctuation behind a year', () => {
      expect(getChildLabel(doc('X Τόμος XV α΄: 1978'), 'X')).toBe(
        'Τόμος XV α΄: 1978'
      );
      expect(getChildLabel(doc('X Τόμος XIX β΄1983 – 1989'), 'X')).toBe(
        'Τόμος XIX β΄1983 – 1989'
      );
    });
  });
});

describe('splitDateQualifier', () => {
  it.each([
    ['No 105 (Mars 2019)', 'No 105', 'Mars 2019'],
    ['No 47 (2018)', 'No 47', '2018'],
    ['Vol. 2, no 1 (Jan.-Mar. 2005)', 'Vol. 2, no 1', 'Jan.-Mar. 2005'],
    ['No 21 (janv.-mars 1996)', 'No 21', 'janv.-mars 1996'],
    ['No 97-98 [Janvier-Juin 2017]', 'No 97-98', 'Janvier-Juin 2017']
  ])('splits %s into designation and date', (label, primary, secondary) => {
    expect(splitDateQualifier(label)).toEqual({ primary, secondary });
  });

  it('leaves a bracketed group alone when it holds no year', () => {
    const label = 'SMSP (Société Méridionale de Spéléologie et de Préhistoire)';
    expect(splitDateQualifier(label)).toEqual({
      primary: label,
      secondary: null
    });
  });

  it('leaves a label with no bracketed group alone', () => {
    expect(splitDateQualifier('n°1')).toEqual({
      primary: 'n°1',
      secondary: null
    });
  });

  it('only considers a group in final position', () => {
    const label = '(2018) supplément au numéro courant';
    expect(splitDateQualifier(label)).toEqual({
      primary: label,
      secondary: null
    });
  });

  it('keeps the date when the label is nothing else', () => {
    expect(splitDateQualifier('(2018)')).toEqual({
      primary: '(2018)',
      secondary: null
    });
  });

  it('ignores a group holding a number that is not a year', () => {
    expect(splitDateQualifier('Tome 3 (144 p.)')).toEqual({
      primary: 'Tome 3 (144 p.)',
      secondary: null
    });
  });
});

describe('getChildDisplay', () => {
  it('prefers the title date qualifier over the bare publication year', () => {
    expect(
      getChildDisplay(
        doc('Spéléo Magazine No 105 (Mars 2019)', '2019'),
        'Spéléo Magazine'
      )
    ).toEqual({ primary: 'No 105', secondary: 'Mars 2019' });
  });

  it('falls back to the publication year when the title has no qualifier', () => {
    expect(
      getChildDisplay(
        doc('Bulletin trimestriel du Spéléo Club Pyrénéen n°1', '1945'),
        'Bulletin trimestriel du Spéléo Club Pyrénéen'
      )
    ).toEqual({ primary: 'n°1', secondary: '1945' });
  });

  it('splits a bracketed year even with no datePublication', () => {
    expect(getChildDisplay(doc('Scialet No 33 (2004)'), 'Scialet')).toEqual({
      primary: 'No 33',
      secondary: '2004'
    });
  });

  it('drops the second line when the designation is itself the date', () => {
    expect(
      getChildDisplay(
        doc('Speleofotografia 2012', '2012-01-01'),
        'Speleofotografia'
      )
    ).toEqual({ primary: '2012', secondary: null });
  });

  it('drops the second line when the designation already states the year', () => {
    expect(
      getChildDisplay(
        doc('UBSS - Monthly Newsletter - February 1996', '1996'),
        'University of Bristol Spelaeological Society'
      )
    ).toEqual({
      primary: 'UBSS - Monthly Newsletter - February 1996',
      secondary: null
    });
    expect(getChildDisplay(doc('Góry 1992, nr 4-5', '1992'), 'Góry')).toEqual({
      primary: '1992, nr 4-5',
      secondary: null
    });
  });

  it('shows no second line at all when there is no date anywhere', () => {
    expect(getChildDisplay(doc('Scialet No 12'), 'Scialet')).toEqual({
      primary: 'No 12',
      secondary: null
    });
  });

  it('never yields an empty designation', () => {
    for (const title of ['(2018)', 'A -', 'Scialet', '2012'])
      expect(getChildDisplay(doc(title, '2018'), 'Scialet').primary).not.toBe(
        ''
      );
  });
});

describe('hasOwnDescription', () => {
  it('hides a description that is a substring of the title', () => {
    expect(
      hasOwnDescription({
        title: 'Scialet No 47 (2018)',
        description: 'Scialet'
      })
    ).toBe(false);
  });

  it('ignores case and whitespace when comparing', () => {
    expect(
      hasOwnDescription({
        title: 'Scialet  No 47',
        description: '  scialet '
      })
    ).toBe(false);
  });

  it('shows a description that merely overlaps with the title', () => {
    expect(
      hasOwnDescription({
        title: 'Scialet No 47 (2018)',
        description: 'Scialet, bulletin du CDS Isère'
      })
    ).toBe(true);
  });

  it('shows a description that shares no text with the title', () => {
    expect(
      hasOwnDescription({
        title: 'No 47',
        description: 'Bulletin annuel'
      })
    ).toBe(true);
  });

  it.each([null, undefined, '', '   '])(
    'hides a %s description',
    description => {
      expect(hasOwnDescription({ title: 'Scialet', description })).toBe(false);
    }
  );

  it('tolerates a missing document', () => {
    expect(hasOwnDescription(undefined)).toBe(false);
  });
});

describe('getIssuesYearRange', () => {
  it('returns the earliest and latest publication year', () => {
    expect(
      getIssuesYearRange([
        { datePublication: '2005' },
        { datePublication: '1998-06' },
        { datePublication: '2012-01-01' }
      ])
    ).toEqual({ start: '1998', end: '2012' });
  });

  it('handles a single dated issue', () => {
    expect(getIssuesYearRange([{ datePublication: '2011' }])).toEqual({
      start: '2011',
      end: '2011'
    });
  });

  it('skips issues with no readable year', () => {
    expect(
      getIssuesYearRange([
        { datePublication: '2005' },
        { datePublication: 'n.d.' },
        { datePublication: null },
        { datePublication: '2010' }
      ])
    ).toEqual({ start: '2005', end: '2010' });
  });

  it('orders years correctly across the millennium boundary', () => {
    expect(
      getIssuesYearRange([
        { datePublication: '2001' },
        { datePublication: '1999' }
      ])
    ).toEqual({ start: '1999', end: '2001' });
  });

  it('returns null when nothing is dated', () => {
    expect(getIssuesYearRange([{ datePublication: null }])).toBeNull();
    expect(getIssuesYearRange([])).toBeNull();
  });

  it.each([null, undefined])('returns null for a %s list', input => {
    expect(getIssuesYearRange(input)).toBeNull();
  });
});

// Guards the property the previous implementation broke: nothing may vanish
// except the collection prefix. Every word of the title, minus the shared
// leading run, has to survive somewhere on the tile.
describe('information is never lost', () => {
  const cases = [
    ['Scialet : bulletin du CDS Isère', 'Scialet No 47 (2018)', '2018'],
    ['Karst News', 'Karst News Vol. 2, no 1 (Jan.-Mar. 2005)', '2005'],
    ['Spéléo Magazine', 'Spéléo Magazine No 21 (janv.-mars 1996)', '1996'],
    ['Góry (Kraków)', 'Góry 1992, nr 4-5', '1992'],
    ['Speleofotografia', 'Speleofotografia 2012', '2012-01-01'],
    ['OCC Newsletters', 'OCC Newsletters Vol 46 1-3 - Jan-Mar 2010 -', '2010'],
    ['Bulletin 1960', 'Bulletin 1960 - SMSP (Société Méridionale)', '1960'],
    ['Anything else', 'UBSS - Monthly Newsletter - February 1993', '1993']
  ];

  it.each(cases)('%s / %s', (collectionTitle, title, datePublication) => {
    const child = doc(title, datePublication);
    const { primary, secondary } = getChildDisplay(child, collectionTitle);
    const shown = `${primary} ${secondary ?? ''}`.toLowerCase();
    const label = getChildLabel(child, collectionTitle).toLowerCase();

    // Every word kept by the label — i.e. everything but the shared prefix —
    // is still readable on the tile.
    const significant = label
      .split(/\s+/)
      .map(word => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
      .filter(Boolean);
    for (const word of significant) expect(shown).toContain(word);
  });
});
