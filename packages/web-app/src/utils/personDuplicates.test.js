import { canMergeAuthor, findPersonDuplicates } from './personDuplicates';

const author = (id, name = 'Marie', surname = 'Dupont', extra = {}) => ({
  id,
  name,
  surname,
  nickname: `${name} ${surname}`,
  type: 'AUTHOR',
  ...extra
});

it('compares authors to authors and cavers, never two cavers', () => {
  const people = [
    author(1),
    author(2),
    author(3, 'Marie', 'Dupont', { type: 'CAVER' }),
    author(4, 'Marie', 'Dupont', { type: 'CAVER' })
  ];
  expect(findPersonDuplicates(people).map(pair => pair.key)).toEqual([
    '1:2',
    '1:3',
    '1:4',
    '2:3',
    '2:4'
  ]);
});

it('normalizes accents, punctuation and reversed first/last names', () => {
  const pairs = findPersonDuplicates([
    author(1, 'Jean-Pierre', "D'Angelo"),
    author(2, 'Jéan Pierre', 'D Angelo'),
    author(3, 'D Angelo', 'Jean Pierre')
  ]);
  expect(pairs).toHaveLength(3);
  expect(pairs[0]).toMatchObject({ key: '1:2', reason: 'sameName' });
  expect(pairs.find(pair => pair.key === '1:3').reason).toBe('reversedName');
});

it('identifies compatible initials and conservative name variations', () => {
  expect(
    findPersonDuplicates([
      author(1, 'J.', 'Dupont'),
      author(2, 'Jean', 'Dupont')
    ])[0].reason
  ).toBe('initials');
  expect(
    findPersonDuplicates([
      author(1, 'Christophe', 'Dupont'),
      author(2, 'Christoph', 'Dupont')
    ])[0].reason
  ).toBe('similarName');
  expect(
    findPersonDuplicates([
      author(1, 'Marie', 'Christophe'),
      author(2, 'Marie', 'Christoph')
    ])[0].reason
  ).toBe('similarName');
});

it('matches complete display names when structured names are missing', () => {
  expect(
    findPersonDuplicates([
      author(1),
      author(2, '', '', { nickname: 'DUPONT, Marie' })
    ])[0].reason
  ).toBe('sameFullName');
});

it('does not override contradictory names with nicknames, or match a surname alone', () => {
  expect(
    findPersonDuplicates([
      author(1),
      author(2, 'Paul', 'Dupont', { nickname: 'Marie Dupont' }),
      author(3, '', 'Dupont'),
      author(4, '', '', { nickname: 'Marie' })
    ])
  ).toEqual([]);
});

it('keeps separate pairs rather than joining through an ambiguous initial', () => {
  const pairs = findPersonDuplicates([
    author(1, 'Jean'),
    author(2, 'J.'),
    author(3, 'Julie')
  ]);
  expect(pairs.map(pair => pair.key)).toEqual(['1:2', '2:3']);
});

it('deduplicates IDs and ignores unsupported, deleted and reserved persons', () => {
  expect(
    findPersonDuplicates([
      author(1),
      author('1'),
      author(8),
      author(2, 'Marie', 'Dupont', { type: 'OTHER' }),
      author(3, 'Marie', 'Dupont', { isDeleted: true })
    ])
  ).toEqual([]);
});

it.each([
  ['AUTHOR', 'AUTHOR', true],
  ['AUTHOR', 'CAVER', true],
  ['CAVER', 'AUTHOR', false],
  ['CAVER', 'CAVER', false]
])(
  'allows a %s source and %s target: %s',
  (sourceType, targetType, expected) => {
    expect(
      canMergeAuthor(
        author(1, '', '', { type: sourceType }),
        author(2, '', '', { type: targetType })
      )
    ).toBe(expected);
  }
);

it('rejects self-merges and missing, reserved or invalid destinations', () => {
  for (const target of [
    author('1'),
    author(8),
    author(-1),
    author('oops'),
    null
  ]) {
    expect(canMergeAuthor(author(1), target)).toBe(false);
  }
});

it.each([33, '33', 41378, '41378'])(
  'protects author #%s as a source while allowing it as a destination',
  id => {
    const protectedAuthor = author(id);
    expect(canMergeAuthor(protectedAuthor, author(1))).toBe(false);
    expect(
      canMergeAuthor(protectedAuthor, author(2, '', '', { type: 'CAVER' }))
    ).toBe(false);
    expect(canMergeAuthor(author(1), protectedAuthor)).toBe(true);
    // Both catalog orders must find the ordinary author as the source.
    for (const people of [
      [protectedAuthor, author(1)],
      [author(1), protectedAuthor]
    ]) {
      expect(findPersonDuplicates(people)).toHaveLength(1);
    }
  }
);

it('does not suggest pairs without a deletable author', () => {
  expect(
    findPersonDuplicates([
      author(33),
      author('41378'),
      author(2, 'Marie', 'Dupont', { type: 'CAVER' })
    ])
  ).toEqual([]);
});

it('handles a catalog of sixty thousand distinct names with indexed lookups', () => {
  const persons = Array.from({ length: 60000 }, (_, i) =>
    author(i + 100, `Given${i}`, `Family${i}`)
  );
  expect(findPersonDuplicates(persons)).toEqual([]);
});

it('does not compare homonymous cavers with one another', () => {
  expect(
    findPersonDuplicates(
      Array.from({ length: 10000 }, (_, i) =>
        author(i + 100, 'Marie', 'Dupont', { type: 'CAVER' })
      )
    )
  ).toEqual([]);
});
