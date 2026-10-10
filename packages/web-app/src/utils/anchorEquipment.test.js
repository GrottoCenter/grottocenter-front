import fc from 'fast-check';
import {
  EQUIPMENT_TYPES,
  parseAnchorEquipment,
  parseRiggingEquipment
} from './anchorEquipment';
import cases from './__fixtures__/anchorEquipment.json';

describe('anchor equipment notation regressions', () => {
  it.each(cases)('$id: $anchor', ({ anchor, language, expected }) => {
    expect(parseAnchorEquipment(anchor, language)).toMatchObject(expected);
  });
});

describe('parseAnchorEquipment', () => {
  it.each([
    ['1G', 'fra', [1, 1, 1, 0, 0]],
    ['1dev/G', 'fra', [1, 1, 1, 0, 1]],
    ['2G (dont 1 pour déviation)', 'fra', [2, 2, 2, 0, 1]],
    ['2G avec 2 plaquettes', 'fra', [2, 2, 2, 0, 0]],
    ['2 × 3S + 2*2G', 'fra', [10, 10, 4, 0, 0]],
    ['two EB + one NA + 2 SA + redir/S', 'eng', [3, 3, 2, 2, 2]],
    ['zwei Spit + eine Schlinge', 'deu', [2, 2, 0, 0, 1]],
    ['dos mosquetones + una cinta tubular', 'spa', [0, 2, 0, 0, 1]],
    ['due moschettoni + uno spit', 'ita', [1, 3, 0, 0, 0]],
    ['dues sangles + dos químics', 'cat', [0, 2, 0, 0, 2]],
    ['2 NA + 3 DA + 1 SA + 1 EB', 'ja', [1, 1, 1, 1, 5]],
    ['3 mousquetons / 1 DEVIA', 'fra', [0, 4, 0, 0, 1]],
    ['4 mousquetons sur 2 x 2 broches', 'fra', [0, 4, 0, 0, 0]],
    ['2S avec 2 plaquettes + 1B', 'fra', [2, 3, 0, 0, 0]],
    ['2 carabiners on 2 EB + 1P', 'eng', [2, 3, 2, 0, 0]],
    ['2 AN avec 2 sangles', 'fra', [0, 0, 0, 0, 2]],
    ['2S\n1dev', 'fra', [2, 3, 0, 0, 1]],
    ['2S 1dev', 'fra', [2, 3, 0, 0, 1]],
    ['1dev/B + 1dev/P + 1dev/AF', 'fra', [0, 3, 0, 0, 3]],
    ['2AS + 3AN + 4AF', 'eng', [0, 0, 0, 2, 7]],
    ['2 expansion bolts', 'eng', [2, 2, 2, 0, 0]],
    ['1 natural anchor', 'eng', [0, 0, 0, 0, 1]],
    ['1 soft anchor', 'eng', [0, 0, 0, 1, 0]],
    ['2 drilled anchors', 'eng', [0, 0, 0, 0, 2]],
    ['2 bolt hangers', 'eng', [2, 0, 0, 0, 0]],
    ['one bolt hanger + two expansion bolts', 'eng', [3, 2, 2, 0, 0]]
  ])('counts %s (%s)', (text, language, vector) => {
    expect(parseAnchorEquipment(text, language)).toMatchObject({
      min: vector,
      max: vector
    });
  });

  it.each([undefined, null, 60, '', ' '])(
    'ignores empty/invalid input %s',
    text => {
      expect(parseAnchorEquipment(text)).toMatchObject({
        status: 'empty',
        max: [0, 0, 0, 0, 0]
      });
    }
  );

  it.each([
    '15 amarrages',
    '2 Pulse',
    '30 feet of webbing',
    '10 mm',
    'M8',
    '2 bolts',
    'bolt hangers',
    'expansion bolts',
    'natural anchors',
    'soft anchors',
    'drilled anchors',
    '99999999999999999999S'
  ])('does not invent a count for %s', text => {
    expect(parseAnchorEquipment(text).max).toEqual([0, 0, 0, 0, 0]);
  });

  it('keeps known counts when an unsupported system is also present', () => {
    expect(parseAnchorEquipment('2 EB + 3 Pulse', 'eng')).toEqual({
      min: [2, 2, 2, 0, 0],
      max: [2, 2, 2, 0, 0],
      status: 'partial'
    });
  });

  it('takes minimum and maximum for each category across three alternatives', () => {
    expect(parseAnchorEquipment('1AN ou 2S ou 3G')).toMatchObject({
      min: [0, 0, 0, 0, 0],
      max: [3, 3, 3, 0, 1]
    });
  });

  it.each([
    '2S + 2 plaquettes',
    '2 spits + 2 hangers',
    '1 S + plaquette',
    '2G + 2 plaquettes'
  ])('flags the possible inventory overlap in %s', text => {
    expect(parseAnchorEquipment(text).status).toBe('partial');
  });

  it('saturates unsafe sums and ignores an unsafe deviation subset', () => {
    expect(parseAnchorEquipment('9007199254740991S + 1S')).toEqual({
      min: [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 0, 0, 0],
      max: [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 0, 0, 0],
      status: 'partial'
    });
    expect(
      parseAnchorEquipment(`2G (dont ${'9'.repeat(400)} pour dev)`)
    ).toEqual({
      min: [2, 2, 2, 0, 0],
      max: [2, 2, 2, 0, 0],
      status: 'partial'
    });
  });
});

describe('parseRiggingEquipment', () => {
  it('sums independent ranges and explicit inventory across the sheet', () => {
    expect(
      parseRiggingEquipment([
        '2AF ou 2S',
        '1AF ou 1S',
        '3 mouskifs',
        '2G + 2AS',
        undefined,
        '?'
      ])
    ).toEqual({
      hangers: { min: 2, max: 5 },
      carabiners: { min: 5, max: 8 },
      expansionBolts: { min: 2, max: 2 },
      softAnchors: { min: 2, max: 2 },
      slings: { min: 0, max: 3 }
    });
  });

  it('keeps sheet totals independent and does not retain previous results', () => {
    const first = parseRiggingEquipment(['2S']);
    const second = parseRiggingEquipment(['1B']);
    expect(first.hangers.max).toBe(2);
    expect(second.hangers.max).toBe(0);
    expect(second.carabiners.max).toBe(1);
    expect(parseRiggingEquipment([]).carabiners.max).toBe(0);
  });
  it('saturates unsafe sheet totals', () => {
    const result = parseRiggingEquipment(['9007199254740991S', '1S']);
    expect(result.hangers).toEqual({
      min: Number.MAX_SAFE_INTEGER,
      max: Number.MAX_SAFE_INTEGER
    });
  });
});

describe('anchor equipment properties', () => {
  const language = fc.oneof(
    fc.constantFrom('fra', 'eng', 'deu', 'spa', 'ita', 'cat', 'ja', 'fr', 'en'),
    fc.string({ unit: 'binary', maxLength: 30 })
  );
  const token = fc.constantFrom(
    'S',
    'G',
    'AN',
    'AS',
    'AF',
    'dev/G',
    'bolt hangers',
    'expansion bolts',
    'soft anchors',
    'natural anchors',
    'drilled anchors',
    'Pulse',
    '9007199254740991S',
    '9007199254740990G',
    '😀',
    '\n',
    'é',
    '三',
    '(',
    ')',
    ' ou ',
    ' or ',
    ' oder ',
    ' + ',
    ' avec ',
    ' (dont ',
    ' pour dev)'
  );
  const hugeQuantity = fc
    .integer({ min: 16, max: 400 })
    .map(n => `${'9'.repeat(n)}S`);
  const anchor = fc.oneof(
    fc.string({ unit: 'binary', maxLength: 2000 }),
    hugeQuantity,
    fc
      .array(fc.oneof(token, fc.nat({ max: 999 }).map(String)), {
        maxLength: 40
      })
      .map(parts => parts.join('')),
    fc
      .tuple(fc.nat({ max: 999 }), fc.nat({ max: 999 }), fc.nat({ max: 999 }))
      .map(([a, b, c]) => `(${a}S ou (${b}AF or ${c}G))`)
  );
  const assertBounds = (min, max) => {
    expect(Number.isSafeInteger(min)).toBe(true);
    expect(Number.isSafeInteger(max)).toBe(true);
    expect(min).toBeGreaterThanOrEqual(0);
    expect(min).toBeLessThanOrEqual(max);
  };

  it('never throws and keeps safe, nonnegative ordered bounds for arbitrary text and languages', () => {
    fc.assert(
      fc.property(anchor, language, (text, lang) => {
        const result = parseAnchorEquipment(text, lang);
        EQUIPMENT_TYPES.forEach((_kind, i) =>
          assertBounds(result.min[i], result.max[i])
        );
      }),
      { numRuns: 500 }
    );
  });

  it('sums cell bounds component-wise without mutating the sheet', () => {
    fc.assert(
      fc.property(
        fc.array(anchor, { maxLength: 12 }),
        language,
        (anchors, lang) => {
          const original = [...anchors];
          const cells = anchors.map(text => parseAnchorEquipment(text, lang));
          const result = parseRiggingEquipment(anchors, lang);
          EQUIPMENT_TYPES.forEach((kind, i) => {
            const sum = bound =>
              cells.reduce((total, cell) => total + BigInt(cell[bound][i]), 0n);
            const capped = total =>
              Number(
                total > BigInt(Number.MAX_SAFE_INTEGER)
                  ? BigInt(Number.MAX_SAFE_INTEGER)
                  : total
              );
            expect(result[kind]).toEqual({
              min: capped(sum('min')),
              max: capped(sum('max'))
            });
            assertBounds(result[kind].min, result[kind].max);
          });
          expect(anchors).toEqual(original);
        }
      ),
      { numRuns: 200 }
    );
  });
});
