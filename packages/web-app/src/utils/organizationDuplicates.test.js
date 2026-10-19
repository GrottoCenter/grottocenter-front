import { findOrganizationDuplicates } from './organizationDuplicates';

it('groups matching organizations by meaningful signals without a search request', () => {
  const groups = findOrganizationDuplicates([
    { id: 1, name: 'Éditions du Karst', city: 'Paris', country: 'FR - France' },
    { id: 2, name: 'Editions du Karst', city: 'Paris', country: 'FR - France' },
    {
      id: 3,
      name: 'Karst Editions',
      city: 'Lyon',
      country: 'FR - France',
      mail: 'INFO@KARST.ORG'
    },
    {
      id: 4,
      name: 'Autre nom',
      city: 'Lyon',
      country: 'FR - France',
      mail: 'info@karst.org'
    },
    {
      id: 5,
      name: 'Éditions du Karst',
      city: 'Paris',
      country: 'BE - Belgique'
    }
  ]);

  expect(groups).toHaveLength(2);
  expect(groups.map(group => group.key)).toEqual(['1:2', '3:4']);
  expect(groups.map(group => group.reasons)).toEqual([
    ['sameNameAndCity'],
    ['sameEmail']
  ]);
});

it('connects overlapping signals into one group and ignores absent contact details', () => {
  const groups = findOrganizationDuplicates([
    { id: 1, name: 'Club A', url: 'https://www.example.org/' },
    { id: 2, name: 'Club B', url: 'http://example.org', mail: 'a@club.org' },
    { id: 3, name: 'Club C', mail: 'a@club.org' },
    { id: 4, name: 'Club D' },
    { id: 5, name: 'Club E' }
  ]);

  expect(groups).toHaveLength(1);
  expect(groups[0].key).toBe('1:2:3');
  expect(groups[0].reasons).toEqual(['sameWebsite', 'sameEmail']);
});

it('compares organization names written in non-Latin scripts', () => {
  const groups = findOrganizationDuplicates([
    { id: 8, name: '洞窟研究会', city: '京都', country: 'JP - Japan' },
    { id: 9, name: '洞窟研究会', city: '京都', country: 'JP - Japan' }
  ]);

  expect(groups.map(group => group.key)).toEqual(['8:9']);
});

it('does not propose a match based on the placeholder email address', () => {
  const groups = findOrganizationDuplicates([
    { id: 1, name: 'First', mail: ' No@Mail.Com ' },
    { id: 2, name: 'Second', mail: 'no@mail.com' }
  ]);

  expect(groups).toEqual([]);
});

it('suggests close but non-identical names in the same city without grouping them transitively', () => {
  const organizations = [
    {
      id: 11,
      name: 'Spéléo Club du Luberon',
      city: 'Apt',
      country: 'FR - France'
    },
    {
      id: 12,
      name: 'Speleo Club du Luberonn',
      city: 'Apt',
      country: 'FR - France'
    },
    {
      id: 13,
      name: 'Speleo Club du Luberron',
      city: 'Apt',
      country: 'FR - France'
    }
  ];
  const groups = findOrganizationDuplicates(organizations);

  expect(groups.map(group => group.key).sort()).toEqual([
    'similar:11:12',
    'similar:11:13',
    'similar:12:13'
  ]);
  expect(groups.every(group => group.organizations.length === 2)).toBe(true);
  expect(
    groups.every(group => group.reasons.includes('similarNameAndCity'))
  ).toBe(true);
  expect(groups.every(group => group.nameSimilarity >= 80)).toBe(true);
});

it('finds similar names with the same postal code but not merely the same country', () => {
  const organizations = [
    {
      id: 21,
      name: 'Cercle Hydrospeleologique',
      city: 'Lyon',
      country: 'FR',
      postalCode: '69001'
    },
    {
      id: 22,
      name: 'Cercle Hydrospeleologik',
      city: 'Lyon 1',
      country: 'FR',
      postalCode: '69001'
    },
    {
      id: 23,
      name: 'Cercle Hydrospeleologik',
      city: 'Marseille',
      country: 'FR',
      postalCode: '13001'
    },
    {
      id: 24,
      name: 'Cercle Hydrospeleologik',
      city: 'Lyon',
      country: 'BE',
      postalCode: '69001'
    }
  ];
  const groups = findOrganizationDuplicates(organizations);

  expect(groups.map(group => group.key)).toEqual(['similar:21:22']);
  expect(groups[0].reasons).toEqual(['similarNameAndPostalCode']);
});

it('does not repeat a fuzzy suggestion when a stronger exact signal already groups the pair', () => {
  const groups = findOrganizationDuplicates([
    {
      id: 30,
      name: 'Spéléo Club du Luberon',
      city: 'Apt',
      country: 'FR',
      mail: 'club@example.org'
    },
    {
      id: 31,
      name: 'Speleo Club du Luberonn',
      city: 'Apt',
      country: 'FR',
      mail: 'club@example.org'
    }
  ]);

  expect(groups.map(group => group.key)).toEqual(['30:31']);
  expect(groups[0].reasons).toEqual(['sameEmail']);
});

it('does not treat different organization numbers as fuzzy name matches', () => {
  const groups = findOrganizationDuplicates([
    { id: 41, name: 'Spéléo Club 12 du Luberon', city: 'Apt', country: 'FR' },
    { id: 42, name: 'Spéléo Club 13 du Luberon', city: 'Apt', country: 'FR' }
  ]);

  expect(groups).toEqual([]);
});

it('surfaces CNRS aliases without city, postal code, email, or website', () => {
  const groups = findOrganizationDuplicates([
    { id: 3517, name: 'CNRS éditions (Paris)' },
    { id: 3480, name: 'CNRS éditions' },
    { id: 3440, name: 'CNRS éd. (Paris)' },
    { id: 3071, name: 'CNRS' }
  ]);

  expect(groups.find(group => group.key === '3440:3480:3517')?.reasons).toEqual(
    ['sameNormalizedName']
  );
  expect(
    groups
      .filter(group => group.reasons.includes('sharedAcronym'))
      .map(group => group.key)
      .sort()
  ).toEqual(['similar:3071:3440', 'similar:3071:3480', 'similar:3071:3517']);
});

it('does not propose a bare acronym across known incompatible countries or cities', () => {
  const groups = findOrganizationDuplicates([
    { id: 1, name: 'CNRS', country: 'FR', city: 'Paris' },
    { id: 2, name: 'CNRS éditions', country: 'BE', city: 'Paris' },
    { id: 3, name: 'CNRS recherche', country: 'FR', city: 'Lyon' }
  ]);

  expect(groups).toEqual([]);
});
