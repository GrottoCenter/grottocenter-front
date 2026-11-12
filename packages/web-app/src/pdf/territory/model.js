import getLocalizedCountryName from '@/helpers/countryName';
import {
  active,
  entityUrl,
  getGuidelines,
  makePdfBlock,
  makePdfLinksBlock,
  makeEntityPdfModel,
  getWgs84Coordinates
} from '../shared/model';
import { hasPdfStatistics, makeStatisticsPdfBlock } from '../shared/statistics';

export const TERRITORY_PDF_SECTIONS = [
  { key: 'properties', label: 'Information' },
  { key: 'map', label: 'Map' },
  { key: 'statistics', label: 'More information' },
  { key: 'guidelines', label: 'Guidelines' },
  { key: 'organizations', label: 'Organizations' }
];
export const getTerritoryPdfAvailability = (entity, statistics) => ({
  properties: true,
  map:
    Boolean(getWgs84Coordinates(entity)) &&
    Math.abs(entity.latitude) <= 85.0511287798,
  statistics: hasPdfStatistics(statistics),
  guidelines: getGuidelines(entity).length > 0,
  organizations: active(entity.organizations).length > 0
});

export const buildTerritoryPdfModel = options => {
  const { entity, entityType, sections, statistics, intl, origin } = options;
  const isCountry = entityType === 'country';
  const t = id => intl.formatMessage({ id });
  const coordinates = getWgs84Coordinates(entity);
  const properties = [
    {
      label: t(isCountry ? 'Country' : 'Region'),
      value: entity.name,
      icon: isCountry ? 'country' : 'region'
    }
  ];
  if (!isCountry)
    properties.push({
      label: t('Country'),
      value: getLocalizedCountryName(entity.countryId, intl.locale),
      icon: 'country'
    });
  if (coordinates)
    properties.push({
      label: t('Coordinates'),
      value: `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)} (WGS84)`,
      icon: 'coordinates'
    });
  const blocks = [];
  if (sections.statistics && hasPdfStatistics(statistics))
    blocks.push(
      makeStatisticsPdfBlock(entity, statistics, intl, entityType, origin)
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
          icon: 'organization',
          source: entityUrl('organizations', item.id, origin)
        })),
        intl
      )
    );
  return makeEntityPdfModel({
    ...options,
    route: isCountry ? 'countries' : `countries/${entity.countryId}/regions`,
    properties,
    blocks,
    coordinates: Math.abs(entity.latitude) <= 85.0511287798 ? coordinates : null
  });
};
