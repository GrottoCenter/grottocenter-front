import {
  active,
  entityUrl,
  getGuidelines,
  makePdfBlock,
  makePdfLinksBlock,
  makeEntityPdfModel
} from '../shared/model';
import { hasPdfStatistics, makeStatisticsPdfBlock } from '../shared/statistics';

export const MASSIF_PDF_SECTIONS = [
  { key: 'properties', label: 'Information' },
  { key: 'map', label: 'Map' },
  { key: 'descriptions', label: 'Descriptions' },
  { key: 'statistics', label: 'More information' },
  { key: 'guidelines', label: 'Guidelines' },
  { key: 'organizations', label: 'Organizations' },
  { key: 'networks', label: 'Networks list' },
  { key: 'documents', label: 'Documents' }
];

export const getMassifPdfPolygons = entity => {
  if (!entity.geogPolygon) return null;
  try {
    const geometry = JSON.parse(entity.geogPolygon);
    let polygons = null;
    if (geometry.type === 'Polygon') polygons = [geometry.coordinates];
    if (geometry.type === 'MultiPolygon') polygons = geometry.coordinates;
    if (
      !polygons?.length ||
      polygons.some(
        polygon =>
          !Array.isArray(polygon) ||
          !polygon.length ||
          polygon.some(
            ring =>
              !Array.isArray(ring) ||
              ring.length < 4 ||
              ring.some(
                pair =>
                  !Array.isArray(pair) ||
                  !Number.isFinite(pair[0]) ||
                  !Number.isFinite(pair[1]) ||
                  Math.abs(pair[0]) > 180 ||
                  Math.abs(pair[1]) > 85.0511287798
              )
          )
      )
    )
      return null;
    return polygons;
  } catch {
    return null;
  }
};

export const getMassifPdfAvailability = (entity, _isAdmin, statistics) => ({
  properties: true,
  map: Boolean(getMassifPdfPolygons(entity)),
  descriptions: active(entity.descriptions).length > 0,
  statistics: hasPdfStatistics(statistics),
  guidelines: getGuidelines(entity).length > 0,
  organizations: active(entity.organizations).length > 0,
  networks: active(entity.networks).length > 0,
  documents: active(entity.documents).length > 0
});

export const buildMassifPdfModel = options => {
  const { entity, sections, intl, statistics, origin } = options;
  const t = id => intl.formatMessage({ id });
  const properties = [
    {
      label: t('Networks list'),
      value: String(active(entity.networks).length),
      icon: 'network'
    },
    {
      label: t('Organizations'),
      value: String(active(entity.organizations).length),
      icon: 'organization'
    }
  ];
  const blocks = [];
  if (sections.descriptions)
    blocks.push(
      makePdfBlock('descriptions', 'Descriptions', entity.descriptions, intl)
    );
  if (sections.statistics && hasPdfStatistics(statistics))
    blocks.push(
      makeStatisticsPdfBlock(entity, statistics, intl, 'massif', origin)
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
  if (sections.organizations)
    blocks.push(
      makePdfLinksBlock(
        'organizations',
        'Organizations',
        active(entity.organizations).map(item => ({
          id: item.id,
          title: item.name ?? String(item.id),
          source: entityUrl('organizations', item.id, origin)
        })),
        intl
      )
    );
  if (sections.networks)
    blocks.push(
      makePdfLinksBlock(
        'networks',
        'Networks list',
        active(entity.networks)
          .sort((first, second) =>
            (first.name ?? '').localeCompare(second.name ?? '', intl.locale)
          )
          .map(item => ({
            id: item.id,
            title: item.name ?? String(item.id),
            source: entityUrl('caves', item.id, origin),
            details: [
              ['depth', 'Depth', 'depth'],
              ['length', 'Development', 'length']
            ].flatMap(([field, label, icon]) =>
              Number.isFinite(item[field])
                ? [
                    {
                      label: t(label),
                      value: `${intl.formatNumber(item[field])} m`,
                      icon
                    }
                  ]
                : []
            )
          })),
        intl
      )
    );
  const polygons = getMassifPdfPolygons(entity);
  return makeEntityPdfModel({
    ...options,
    entityType: 'massif',
    route: 'massifs',
    properties,
    blocks,
    coordinates: polygons ? { points: [], polygons, fit: true } : null,
    warning: entity.isSensitive
      ? t('This massif is marked as sensitive based on applicable legislation.')
      : ''
  });
};
