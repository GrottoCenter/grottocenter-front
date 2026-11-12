import { createIntl } from 'react-intl';
import messages from '../../../public/lang/en.json';
import {
  buildDocumentIndex,
  getPdfAttachments,
  getPdfInlineDocuments
} from './model';
import {
  buildNetworkPdfModel,
  getNetworkPdfAvailability
} from '../network/model';
import { buildMassifPdfModel, getMassifPdfPolygons } from '../massif/model';
import { PDF_ADAPTERS } from '../adapters';

const intl = createIntl({ locale: 'en', messages });
const document = {
  id: 1,
  title: 'Survey',
  license: 'CC BY-SA 3.0',
  authors: [{ nickname: 'Surveyor' }],
  files: [
    {
      id: 10,
      fileName: 'plan.pdf',
      completePath: 'https://example.org/plan.pdf'
    },
    {
      id: 11,
      fileName: 'section.png',
      completePath: 'https://example.org/section.png'
    }
  ]
};
const polygon = JSON.stringify({
  type: 'Polygon',
  coordinates: [
    [
      [5, 45],
      [6, 45],
      [6, 46],
      [5, 45]
    ]
  ]
});

it.each(['entrance', 'network', 'massif', 'country', 'region'])(
  'uses the current host or an explicit origin for every %s source link',
  entityType => {
    for (const origin of [
      undefined,
      'https://preview.example.org',
      'https://fr.wikicaves.org'
    ]) {
      const model = PDF_ADAPTERS[entityType].build({
        entity: {
          id: 2,
          countryId: 'FR',
          name: 'Entity',
          entrances: [{ id: 7, name: 'Entrance' }],
          networks: [{ id: 8, name: 'Network' }],
          organizations: [{ id: 9, name: 'Club' }]
        },
        sections: {
          entrances: true,
          networks: true,
          organizations: true,
          statistics: true,
          documents: true
        },
        statistics: {
          nb_entrances: 1,
          cave_with_max_depth: { id_cave: 8, value: 100 }
        },
        documents: [document],
        attachments: [],
        intl,
        origin
      });
      const expectedOrigin = origin ?? window.location.origin;
      expect(new URL(model.source).origin).toBe(expectedOrigin);
      expect(model.references[0].source).toBe(
        `${expectedOrigin}/ui/documents/1`
      );
      expect(model.inlineDocuments[0].source).toBe(
        `${expectedOrigin}/ui/documents/1`
      );
      if (entityType === 'network')
        expect(model.blocks[0].items[0].body).toContain(
          `${expectedOrigin}/ui/entrances/7`
        );
      if (['massif', 'country', 'region'].includes(entityType)) {
        expect(
          model.blocks.find(block => block.key === 'organizations').items[0]
            .source
        ).toBe(`${expectedOrigin}/ui/organizations/9`);
        expect(
          model.blocks.find(block => block.key === 'organizations').items[0]
            .icon
        ).toBe('organization');
        expect(
          model.blocks.find(block => block.key === 'statistics').items.at(-1)
            .body
        ).toContain(`${expectedOrigin}/ui/caves/8`);
      }
      if (entityType === 'massif')
        expect(
          model.blocks.find(block => block.key === 'networks').items[0].source
        ).toBe(`${expectedOrigin}/ui/caves/8`);
    }
  }
);

it('credits one document once and associates its selected files', () => {
  const result = buildDocumentIndex({
    documents: [document, document],
    attachments: getPdfAttachments([document]),
    includeReferences: false,
    intl
  });
  expect(result.references).toHaveLength(1);
  expect(result.references[0].credit).toContain('Surveyor');
  expect(result.references[0].files).toEqual(getPdfAttachments([document]));
});

it('includes only selected annex credits when all references are deselected', () => {
  const result = buildDocumentIndex({
    documents: [document, { id: 2, title: 'Unselected source' }],
    attachments: getPdfAttachments([document]).slice(0, 1),
    includeReferences: false,
    intl
  });
  expect(result.references.map(reference => reference.title)).toEqual([
    'Survey'
  ]);
  expect(result.references[0].files).toHaveLength(1);
});

it('keeps bibliographic references without duplicating their authors and publication date', () => {
  const result = buildDocumentIndex({
    documents: [{ ...document, type: 'Book', datePublication: '2020' }],
    attachments: [],
    includeReferences: true,
    intl
  });
  expect(result.references[0].bibliography).toContain('2020');
  expect(result.references[0].files).toEqual([]);
});

it('does not invent bibliography for media documents and exports only their inline previews', () => {
  const mediaDocument = {
    ...document,
    files: [
      ...document.files,
      {
        id: 12,
        fileName: 'video.mp4',
        thumbnails: { small: 'https://example.org/video.webp' }
      },
      {
        id: 13,
        fileName: 'model.glb',
        thumbnails: { small: 'https://example.org/model.webp' }
      },
      {
        id: 14,
        fileName: 'invalid.png',
        completePath: 'data:image/png;base64,AA=='
      }
    ]
  };
  const index = buildDocumentIndex({
    documents: [mediaDocument],
    attachments: [],
    includeReferences: true,
    intl
  });
  expect(index.references[0].bibliography).toBeNull();
  const inlineDocuments = getPdfInlineDocuments(
    [mediaDocument, { ...mediaDocument, id: 2, isDeleted: true }],
    intl
  );
  expect(inlineDocuments).toHaveLength(1);
  expect(inlineDocuments[0].files.map(file => file.url)).toEqual([
    'https://example.org/section.png',
    'https://example.org/video.webp',
    'https://example.org/model.webp'
  ]);
});

it('omits restricted network coordinates while keeping public entrance names and numbering', () => {
  const entity = {
    id: 2,
    name: 'Network',
    entrances: [
      {
        id: 1,
        name: 'Restricted',
        latitude: 45,
        longitude: 5,
        precision: 12,
        isSensitive: true
      },
      { id: 2, name: 'Public', latitude: 46, longitude: 6, precision: 12 }
    ]
  };
  const model = buildNetworkPdfModel({
    entity,
    isAdmin: false,
    sections: { map: true, entrances: true },
    documents: [],
    attachments: [],
    intl
  });
  expect(model.coordinates.points).toEqual([
    { latitude: 46, longitude: 6, label: '2' }
  ]);
  expect(model.blocks[0].items[0].title).toBe('1. Restricted');
  expect(model.blocks[0].items[0].body).not.toContain('45.000000');
  expect(
    getNetworkPdfAvailability(
      { ...entity, entrances: [entity.entrances[0]] },
      false
    ).map
  ).toBe(false);
});

it('rejects malformed or non-projectable massif polygons', () => {
  expect(getMassifPdfPolygons({ geogPolygon: 'invalid' })).toBeNull();
  expect(
    getMassifPdfPolygons({
      geogPolygon: JSON.stringify({
        type: 'Polygon',
        coordinates: [
          [
            [5, 90],
            [6, 90],
            [6, 91],
            [5, 90]
          ]
        ]
      })
    })
  ).toBeNull();
});

it.each([0, 1, 1165])(
  'keeps %s entrances and linked network counts out of massif information',
  count => {
    const model = buildMassifPdfModel({
      entity: { id: 3, name: 'Massif', networks: [{ id: 8 }] },
      statistics: { nb_entrances: count },
      sections: { properties: true },
      documents: [],
      attachments: [],
      intl
    });
    expect(model.properties).toEqual([]);
    expect(model.blocks).toEqual([]);
  }
);

it.each([undefined, null, {}, { nb_entrances: null }, { nb_caves: 99 }])(
  'omits unavailable massif entrance counts for statistics %j',
  statistics => {
    const model = buildMassifPdfModel({
      entity: { id: 3, name: 'Massif' },
      statistics,
      sections: { properties: true },
      documents: [],
      attachments: [],
      intl
    });
    expect(model.properties.map(property => property.icon)).not.toContain(
      'entrance'
    );
  }
);

it('keeps a sensitive massif public outline and legislation warning without entrance coordinates', () => {
  const model = buildMassifPdfModel({
    entity: { id: 3, name: 'Massif', isSensitive: true, geogPolygon: polygon },
    isAdmin: false,
    sections: { map: true },
    documents: [],
    attachments: [],
    intl
  });
  expect(model.coordinates.polygons).toEqual([JSON.parse(polygon).coordinates]);
  expect(model.coordinates.points).toEqual([]);
  expect(model.warning).toContain('applicable legislation');
});
