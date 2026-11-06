import { getPdfCoordinates } from '../entrance/model';
import {
  active,
  entityUrl,
  getGuidelines,
  makePdfBlock,
  makeEntityPdfModel
} from '../shared/model';

export const NETWORK_PDF_SECTIONS = [
  { key: 'properties', label: 'Network properties' },
  { key: 'map', label: 'Map' },
  { key: 'entrances', label: 'Entrances list' },
  { key: 'guidelines', label: 'Guidelines' },
  { key: 'descriptions', label: 'Descriptions' },
  { key: 'documents', label: 'Documents' }
];

const mapPoints = (entity, isAdmin) =>
  active(entity.entrances).flatMap((entrance, index) => {
    const coordinates = getPdfCoordinates(entrance, isAdmin);
    return coordinates && Math.abs(coordinates.latitude) <= 85.0511287798
      ? [{ ...coordinates, label: String(index + 1) }]
      : [];
  });

export const getNetworkPdfAvailability = (entity, isAdmin) => ({
  properties: true,
  map: mapPoints(entity, isAdmin).length > 0,
  entrances: active(entity.entrances).length > 0,
  guidelines: getGuidelines(entity).length > 0,
  descriptions: active(entity.descriptions).length > 0,
  documents: active(entity.documents).length > 0
});

export const buildNetworkPdfModel = options => {
  const { entity, isAdmin, sections, intl, origin } = options;
  const t = id => intl.formatMessage({ id });
  const properties = [];
  const add = (label, value, icon, unit = '') => {
    if (value != null && value !== '')
      properties.push({ label: t(label), value: `${value}${unit}`, icon });
  };
  add('Depth', entity.depth, 'depth', ' m');
  add('Development', entity.length, 'length', ' m');
  add('Temperature', entity.temperature, 'temperature', ' °C');
  if (entity.isDiving) add('Diving cave', t('Yes'), 'entrance');
  add(
    'Exploring organizations',
    active(entity.exploringOrganizations)
      .map(item => item.name)
      .filter(Boolean)
      .join(', '),
    'organization'
  );
  add(
    'Massifs',
    active(entity.massifs)
      .map(item => item.name)
      .filter(Boolean)
      .join(', '),
    'massif'
  );
  const blocks = [];
  if (sections.entrances)
    blocks.push(
      makePdfBlock(
        'entrances',
        'Entrances list',
        active(entity.entrances).map((entrance, index) => {
          const coordinates = getPdfCoordinates(entrance, isAdmin);
          return {
            id: entrance.id,
            title: `${index + 1}. ${entrance.name ?? entrance.id}`,
            body: [
              coordinates &&
                `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)} (WGS84)`,
              entrance.isSensitive && t('Sensitive entrance'),
              entityUrl('entrances', entrance.id, origin)
            ]
              .filter(Boolean)
              .join('\n')
          };
        }),
        intl
      )
    );
  if (sections.guidelines)
    blocks.push(
      makePdfBlock(
        'guidelines',
        'Guidelines',
        getGuidelines(entity).map(item => ({
          ...item,
          body: item.description ?? ''
        })),
        intl
      )
    );
  if (sections.descriptions)
    blocks.push(
      makePdfBlock('descriptions', 'Descriptions', entity.descriptions, intl)
    );
  const points = mapPoints(entity, isAdmin);
  return makeEntityPdfModel({
    ...options,
    entityType: 'network',
    route: 'caves',
    properties,
    blocks,
    coordinates: points.length ? { points, fit: true } : null
  });
};
