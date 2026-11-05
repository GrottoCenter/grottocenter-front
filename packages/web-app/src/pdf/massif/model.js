import {
  active,
  getGuidelines,
  makePdfBlock,
  makeEntityPdfModel
} from '../shared/model';

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

export const getMassifPdfAvailability = (entity, isAdmin, statistics) => ({
  properties: true,
  map: Boolean(getMassifPdfPolygons(entity, isAdmin)),
  descriptions: active(entity.descriptions).length > 0,
  statistics: statistics?.nb_caves != null,
  guidelines: getGuidelines(entity).length > 0,
  organizations: active(entity.organizations).length > 0,
  networks: active(entity.networks).length > 0,
  documents: active(entity.documents).length > 0
});

export const buildMassifPdfModel = options => {
  const { entity, sections, intl, statistics } = options;
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
      icon: 'author'
    }
  ];
  const blocks = [];
  if (sections.descriptions)
    blocks.push(
      makePdfBlock('descriptions', 'Descriptions', entity.descriptions, intl)
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
  for (const [key, label, route] of [
    ['organizations', 'Organizations', 'organizations'],
    ['networks', 'Networks list', 'caves']
  ])
    if (sections[key])
      blocks.push(
        makePdfBlock(
          key,
          label,
          active(entity[key]).map(item => ({
            id: item.id,
            title: item.name ?? String(item.id),
            body: `https://grottocenter.org/ui/${route}/${item.id}`
          })),
          intl
        )
      );
  if (sections.statistics && statistics?.nb_caves != null) {
    const values = [
      intl.formatMessage(
        { id: 'cave_with_entrances' },
        { count: statistics.nb_caves }
      ),
      statistics.nb_networks != null &&
        intl.formatMessage(
          { id: 'network_count' },
          { count: statistics.nb_networks }
        ),
      statistics.diving_caves != null &&
        intl.formatMessage(
          { id: 'diveable_caves' },
          { count: statistics.diving_caves }
        )
    ].filter(Boolean);
    blocks.push(
      makePdfBlock(
        'statistics',
        'More information',
        [
          {
            id: entity.id,
            body: values.join('\n'),
            title: t(
              'Statistics are recomputed periodically and may not reflect the latest changes.'
            )
          }
        ],
        intl
      )
    );
  }
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
