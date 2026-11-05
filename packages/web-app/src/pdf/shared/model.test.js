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

it('credits one document once and gives its two files matching annex codes', () => {
  const result = buildDocumentIndex({
    documents: [document, document],
    attachments: getPdfAttachments([document]),
    includeReferences: false,
    intl
  });
  expect(result.references).toHaveLength(1);
  expect(result.references[0].authors).toBe('Surveyor');
  expect(result.annexes.map(file => file.code)).toEqual(['D1.1', 'D1.2']);
  expect(result.references[0].files).toEqual(result.annexes);
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
  expect(result.annexes).toHaveLength(1);
});

it('keeps bibliographic references without duplicating their authors and publication date', () => {
  const result = buildDocumentIndex({
    documents: [{ ...document, type: 'Book', datePublication: '2020' }],
    attachments: [],
    includeReferences: true,
    intl
  });
  expect(result.references[0].reference).toContain('2020');
  expect(result.references[0].bibliography).toContain('2020');
  expect(result.references[0].authors).toBe('');
  expect(result.references[0].date).toBe('');
  expect(result.annexes).toEqual([]);
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
