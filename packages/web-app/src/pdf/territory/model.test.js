import { createIntl } from 'react-intl';
import messages from '../../../public/lang/fr.json';
import { PDF_ADAPTERS } from '../adapters';

const intl = createIntl({ locale: 'fr', messages });
const statistics = {
  nb_entrances: 1165,
  nb_networks: 9,
  diving_caves: 3,
  avg: { avg_depth: 30, avg_length: 273 },
  total_length: { value: 299165, nb_data: 1092 },
  cave_with_max_depth: { id_cave: 75263, name_cave: 'Bange', value: 865 },
  cave_with_max_length: { id_cave: 75263, name_cave: 'Bange', value: 53955 }
};
const build = (entityType, overrides = {}) =>
  PDF_ADAPTERS[entityType].build({
    entity: {
      id: entityType === 'country' ? 'FR' : 'ARA',
      countryId: 'FR',
      name: 'Territory'
    },
    sections: { properties: true, statistics: true },
    statistics,
    documents: [],
    attachments: [],
    intl,
    ...overrides
  });

it.each(['massif', 'country', 'region'])(
  'exports three entrances and one network for a %s without changing length',
  entityType => {
    const model = build(entityType, {
      statistics: {
        nb_entrances: 3,
        nb_caves: 1,
        nb_networks: 1,
        total_length: { value: 100, nb_data: 1 }
      }
    });
    const { body } = model.blocks.find(block => block.key === 'statistics')
      .items[0];
    expect(body).toContain('3 entrées');
    expect(body).toContain('1 réseau');
    expect(body).toContain('Développement cumulé: 100 m');
  }
);

it.each(['massif', 'country', 'region'])(
  'distinguishes zero from unavailable entrance counts in a %s PDF',
  entityType => {
    const zero = build(entityType, { statistics: { nb_entrances: 0 } });
    expect(
      zero.blocks.find(block => block.key === 'statistics').items[0].body
    ).toContain('0 entrée');
    for (const unavailable of [{}, { nb_entrances: null }, { nb_caves: 99 }]) {
      const model = build(entityType, { statistics: unavailable });
      expect(
        model.blocks.find(block => block.key === 'statistics')
      ).toBeUndefined();
      expect(
        PDF_ADAPTERS[entityType].availability({ id: 'FR' }, false, {
          statistics: unavailable
        }).statistics
      ).toBe(false);
    }
  }
);

it.each(['massif', 'country', 'region'])(
  'exports all available statistics for a %s with localized numbers',
  entityType => {
    const model = build(entityType);
    const { body } = model.blocks.find(block => block.key === 'statistics')
      .items[0];
    expect(body).toContain(`${intl.formatNumber(1165)} entrées`);
    expect(body).toContain('9 réseaux');
    expect(body).toContain('3 cavités permettent de faire de la plongée');
    expect(body).toContain('Profondeur moyenne: 30 m');
    expect(body).toContain('Développement moyen: 273 m');
    expect(body).toContain(
      `Développement cumulé: ${intl.formatNumber(299165)} m (${intl.formatNumber(1092)} cavités dont le développement est renseigné)`
    );
    expect(body).not.toContain('Calculé à');
    expect(body).toContain('Bange · 865 m');
    expect(body).toContain(`Bange · ${intl.formatNumber(53955)} m`);
    expect(body).toContain(`${window.location.origin}/ui/caves/75263`);
  }
);

it.each([
  [0, '0 cavité dont le développement est renseigné'],
  [1, '1 cavité dont le développement est renseigné']
])('pluralizes the known-length count of %s caves', (count, label) => {
  const model = build('country', {
    statistics: {
      nb_entrances: 1,
      total_length: { value: 0, nb_data: count }
    }
  });
  expect(model.blocks[0].items[0].body).toContain(
    `Développement cumulé: 0 m (${label})`
  );
});

it('keeps zero statistics, pluralizes counts, and omits unknown measurements', () => {
  const model = build('country', {
    statistics: {
      nb_entrances: 1,
      nb_networks: 0,
      diving_caves: 0,
      nb_massifs: 0,
      avg: { avg_depth: 0 }
    }
  });
  const { body } = model.blocks[0].items[0];
  expect(body).toContain('1 entrée');
  expect(body).toContain('0 réseau (');
  expect(body).toContain('0 massifs');
  expect(body).toContain('Profondeur moyenne: 0 m');
  expect(body).not.toContain('Développement moyen');
  expect(body).not.toMatch(/undefined|NaN|null|{count/);
});

it('uses canonical country and region routes, keeps valid zero coordinates, and omits unavailable sections', () => {
  for (const entityType of ['country', 'region']) {
    const model = build(entityType, {
      entity: {
        id: entityType === 'country' ? 'FR' : 'ARA',
        countryId: 'FR',
        name: 'Territory',
        latitude: 0,
        longitude: 0
      },
      sections: { map: true }
    });
    expect(model.source).toBe(
      entityType === 'country'
        ? `${window.location.origin}/ui/countries/FR`
        : `${window.location.origin}/ui/countries/FR/regions/ARA`
    );
    expect(model.coordinates).toEqual({ latitude: 0, longitude: 0 });
    expect(model.blocks).toEqual([]);
    expect(
      PDF_ADAPTERS[entityType].availability({ id: 'FR' }, false, {
        statistics: null
      })
    ).toMatchObject({ statistics: false, map: false, organizations: false });
  }
});

it('omits country regions even with stale choices and uses the organization icon', () => {
  const model = build('country', {
    entity: {
      id: 'FR',
      name: 'France',
      organizations: [{ id: 1, name: 'Club' }],
      regions: [{ iso: 'FR-ARA', name: 'Auvergne-Rhône-Alpes' }]
    },
    sections: { properties: true, regions: true }
  });
  expect(model.blocks).toEqual([]);
  expect(model.properties.map(property => property.label)).not.toContain(
    'Régions'
  );
  expect(
    model.properties.find(property => property.label === 'Organisations')
  ).toMatchObject({ value: '1', icon: 'organization' });
  expect(
    PDF_ADAPTERS.country.sections.map(section => section.key)
  ).not.toContain('regions');
  expect(
    PDF_ADAPTERS.country.availability(
      { regions: [{ iso: 'FR-ARA' }] },
      false,
      {}
    )
  ).not.toHaveProperty('regions');
});

it('places compact alphabetized networks after all other massif sections without changing API order', () => {
  const networks = [
    { id: 2, name: 'Z network', depth: 0, length: 500 },
    { id: 1, name: 'A network', depth: 865, length: 53955 },
    { id: 3, name: 'Deleted', isDeleted: true }
  ];
  const model = build('massif', {
    entity: {
      id: 6487,
      name: 'Massif',
      networks,
      descriptions: [{ id: 1, body: 'Description' }],
      guidelines: [{ id: 1, description: 'Guideline' }],
      organizations: [{ id: 1, name: 'Club' }]
    },
    sections: {
      descriptions: true,
      statistics: true,
      guidelines: true,
      organizations: true,
      networks: true
    }
  });
  expect(model.blocks.map(block => block.key)).toEqual([
    'descriptions',
    'statistics',
    'guidelines',
    'organizations',
    'networks'
  ]);
  const block = model.blocks.at(-1);
  expect(block.type).toBe('links');
  expect(block.items.map(item => item.title)).toEqual([
    'A network',
    'Z network'
  ]);
  expect(block.items[0].details.map(detail => detail.value)).toEqual([
    '865 m',
    `${intl.formatNumber(53955)} m`
  ]);
  expect(block.items[1].details[0].value).toBe('0 m');
  expect(networks[0].id).toBe(2);
});
