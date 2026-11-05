import { createIntl } from 'react-intl';
import messages from '../../../public/lang/en.json';
import {
  buildEntrancePdfModel,
  getDefaultPdfSections,
  getPdfAttachments,
  getPdfCoordinates,
  getPdfSectionAvailability
} from './model';

const intl = createIntl({ locale: 'en', messages });
const entrance = {
  id: 1,
  name: 'Cavité',
  latitude: 0,
  longitude: 0,
  altitude: 400,
  precision: 12,
  isSensitive: true,
  cave: { id: 2 },
  comments: [{ id: 3, title: 'Winter access', body: 'Avalanche danger' }],
  locations: [{ id: 4, title: 'Access', body: 'Exact approach' }]
};

describe('entrance PDF model', () => {
  it('removes restricted coordinates, altitude and access before export', () => {
    const before = structuredClone(entrance);
    const sections = getDefaultPdfSections(entrance, false);
    expect(sections.comments).toBe(true);
    expect(sections.map).toBe(false);
    const model = buildEntrancePdfModel({
      entrance,
      isAdmin: false,
      sections: { ...sections, map: true, locations: true },
      documents: [],
      attachments: [],
      intl
    });
    expect(model.locale).toBe('en');
    expect(model.coordinates).toBeNull();
    expect(model.properties.map(property => property.label)).not.toContain(
      'Altitude'
    );
    expect(model.blocks.map(block => block.key)).not.toContain('locations');
    expect(model.blocks[0].items[0].body).toBe('Avalanche danger');
    expect(entrance).toEqual(before);
  });

  it('exports visit ratings, duration ranges and data quality using the site calculations', () => {
    const model = buildEntrancePdfModel({
      entrance: {
        ...entrance,
        isSensitive: false,
        dataQuality: { total: 94 },
        comments: [
          { aestheticism: 8, eTTrail: '01:45:00', eTUnderground: '09:00:00' },
          { aestheticism: 6, eTTrail: '02:00:00', eTUnderground: '09:00:00' },
          { aestheticism: 10, isDeleted: true }
        ]
      },
      sections: { properties: true },
      documents: [],
      attachments: [],
      intl
    });
    const properties = Object.fromEntries(
      model.properties.map(item => [item.label, item.value])
    );
    expect(properties['Interest of the visit']).toBe('3.5/5 · 2 ratings');
    expect(properties['Time to go']).toContain('45');
    expect(properties['Time to go']).toContain('–');
    expect(
      model.properties.find(item => item.icon === 'underground_time').value
    ).toContain('9');
    expect(properties['Data quality']).toBe('94 / 100 · Good quality');
    expect(
      model.properties.find(item => item.label === 'Data quality').tone
    ).toBe('good');
  });

  it('accepts zero coordinates for authorized users but never restricted precision', () => {
    expect(getPdfCoordinates(entrance, true)).toEqual({
      latitude: 0,
      longitude: 0
    });
    expect(getPdfCoordinates({ ...entrance, precision: 0 }, true)).toBeNull();
    expect(getPdfCoordinates({ ...entrance, latitude: 91 }, true)).toBeNull();
  });

  it('keeps each comment duration and all three half-star ratings with their site descriptions', () => {
    const model = buildEntrancePdfModel({
      entrance: {
        ...entrance,
        comments: [
          {
            id: 3,
            aestheticism: 6,
            caving: 9,
            approach: 7,
            eTTrail: '00:30:00',
            eTUnderground: '01:30:00'
          },
          {
            id: 4,
            aestheticism: 0,
            caving: null,
            eTTrail: '00:00:00',
            eTUnderground: 'invalid'
          },
          { id: 5, aestheticism: 10, isDeleted: true }
        ]
      },
      sections: { comments: true },
      documents: [],
      attachments: [],
      intl
    });
    const comments = model.blocks.find(block => block.key === 'comments').items;
    expect(comments).toHaveLength(2);
    const details = Object.fromEntries(
      comments[0].details.map(detail => [detail.label, detail.value])
    );
    expect(details['Time to go']).toMatch(/30\smin/);
    expect(details['Underground time']).toMatch(/1\shr\s30\smin/);
    expect(details['Interest of the visit']).toBe('3/5 · Interesting');
    expect(details['Ease of move']).toBe('4.5/5 · Easy – Very easy');
    expect(details['Ease of reach']).toBe('3.5/5 · Intermediate – Easy');
    expect(comments[1].details).toEqual([]);
  });

  it('keeps polar coordinates without requesting tiles outside Web Mercator', () => {
    const polarEntrance = { ...entrance, latitude: 89 };
    expect(getPdfCoordinates(polarEntrance, true)?.latitude).toBe(89);
    const model = buildEntrancePdfModel({
      entrance: polarEntrance,
      isAdmin: true,
      sections: { properties: true, map: true },
      documents: [],
      attachments: [],
      intl
    });
    expect(model.coordinates).toBeNull();
    expect(
      model.properties.find(item => item.label === 'Coordinates').value
    ).toContain('89.000000');
  });

  it('does not include network descriptions in an entrance export', () => {
    expect(getPdfSectionAvailability(entrance, true)).not.toHaveProperty(
      'network'
    );
    const model = buildEntrancePdfModel({
      entrance,
      cave: { descriptions: [{ id: 10, body: 'Network description' }] },
      isAdmin: true,
      sections: { descriptions: true, network: true },
      documents: [],
      attachments: [],
      intl
    });
    expect(model.blocks).toEqual([]);
  });

  it('offers original PDF/image files only, deduplicated and excluding deleted documents', () => {
    const url = 'https://example.org/topo.pdf';
    const documents = [
      {
        id: 1,
        title: 'Survey',
        files: [{ id: 10, completePath: url, fileName: 'topo.pdf' }]
      },
      {
        id: 2,
        files: [
          { completePath: url, fileName: 'topo.pdf' },
          {
            completePath: 'https://example.org/original.png',
            fileName: 'original.png'
          },
          {
            completePath: 'https://example.org/notes.doc',
            fileName: 'notes.doc'
          },
          // Executable schemes must never become downloadable annexes.
          // eslint-disable-next-line no-script-url
          { completePath: 'javascript:alert(1)', fileName: 'fake.pdf' }
        ]
      },
      {
        id: 3,
        isDeleted: true,
        files: [{ completePath: 'https://example.org/deleted.pdf' }]
      }
    ];
    const before = structuredClone(documents);
    expect(getPdfAttachments(documents).map(file => file.url)).toEqual([
      url,
      'https://example.org/original.png'
    ]);
    expect(documents).toEqual(before);
  });
});
