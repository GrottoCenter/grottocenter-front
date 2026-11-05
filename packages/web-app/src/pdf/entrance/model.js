import { sortByRelevance } from '@/helpers/sortByRelevance';
import { OBSTACLE_LEGEND, ANCHOR_LEGEND } from '@/utils/riggingLegends';
import { getEntranceInterest } from '@/utils/entranceInterest';
import {
  durationStringToMinutes,
  formatDurationMinutes
} from '@/utils/dateTimeDuration';
import {
  VISIT_RATING_DEFINITIONS,
  getRatingLevelIds
} from '@/utils/visitRatingLevels';
import {
  getDataQualityValue,
  getDataQualityLabelKey,
  getDataQualityLevel
} from '@/utils/dataQuality';
import {
  active,
  contribution,
  makeEntityPdfModel,
  getWgs84Coordinates
} from '../shared/model';

export { getPdfAttachments } from '../shared/model';

export const PDF_SECTIONS = [
  { key: 'properties', label: 'General Information' },
  { key: 'map', label: 'Map' },
  { key: 'locations', label: 'Access' },
  { key: 'descriptions', label: 'Description' },
  { key: 'riggings', label: 'Riggings' },
  { key: 'histories', label: 'History' },
  { key: 'comments', label: 'Comments' },
  { key: 'documents', label: 'Documents' }
];

export const getPdfCoordinates = (entrance, isAdmin) => {
  if ((entrance.isSensitive && !isAdmin) || entrance.precision === 0)
    return null;
  return getWgs84Coordinates(entrance);
};

export const getPdfSectionAvailability = (entrance, isAdmin) => ({
  properties: true,
  // OSM tiles stop at the Web Mercator latitude limit, unlike WGS84 coordinates.
  map:
    Boolean(getPdfCoordinates(entrance, isAdmin)) &&
    Math.abs(entrance.latitude) <= 85.0511287798,
  comments: active(entrance.comments).length > 0,
  locations:
    (!entrance.isSensitive || isAdmin) && active(entrance.locations).length > 0,
  descriptions: active(entrance.descriptions).length > 0,
  riggings: active(entrance.riggings).length > 0,
  histories: active(entrance.histories).length > 0,
  documents: active(entrance.documents).length > 0
});

export const getDefaultPdfSections = (entrance, isAdmin) =>
  getPdfSectionAvailability(entrance, isAdmin);

const FLAGS = [
  ['hasBat', 'Bat habitat'],
  ['dangerFlooding', 'Flooding risk'],
  ['dangerCo2', 'CO2 risk'],
  ['dangerRockfall', 'Rockfall risk'],
  ['dangerPollution', 'Pollution risk'],
  ['needCleanGear', 'Clean gear required'],
  ['needStayOnTrail', 'Stay on trail'],
  ['hasRules', 'Entry rules'],
  ['isTouristic', 'Touristic site']
];

const getCommentDetails = (comment, intl) => {
  const t = id => intl.formatMessage({ id });
  const durations = [
    ['eTTrail', 'Time to go', 'time_to_go'],
    ['eTUnderground', 'Underground time', 'underground_time']
  ].flatMap(([field, label, icon]) => {
    const minutes = durationStringToMinutes(comment[field]);
    return Number.isFinite(minutes) && minutes > 0
      ? [
          {
            label: t(label),
            value: formatDurationMinutes(minutes, intl.formatNumberToParts),
            icon
          }
        ]
      : [];
  });
  const ratings = VISIT_RATING_DEFINITIONS.flatMap(
    ({ field, labelId, levels }) => {
      const value = comment[field];
      if (!Number.isFinite(value) || value <= 0) return [];
      const rating = value / 2;
      const score = intl.formatMessage(
        { id: '{rating} / 5' },
        { rating: intl.formatNumber(rating, { maximumFractionDigits: 1 }) }
      );
      return [
        {
          label: t(labelId),
          value: `${score} · ${getRatingLevelIds(rating, levels).map(t).join(' – ')}`
        }
      ];
    }
  );
  return [...durations, ...ratings];
};

export const buildEntrancePdfModel = ({
  entrance,
  isAdmin,
  sections,
  documents,
  attachments,
  intl,
  generatedAt = new Date()
}) => {
  const t = id => intl.formatMessage({ id });
  const coordinates = getPdfCoordinates(entrance, isAdmin);
  const availability = getPdfSectionAvailability(entrance, isAdmin);
  const properties = [];
  const propertyIcons = {
    Coordinates: 'coordinates',
    Altitude: 'altitude',
    Territory: 'location',
    Network: 'network',
    Depth: 'depth',
    Development: 'length',
    Temperature: 'temperature',
    'Time to go': 'time_to_go',
    'Underground time (short)': 'underground_time',
    'Year of discovery': 'discovery_date',
    'Underground type': 'category'
  };
  const add = (id, value, unit = '') => {
    if (value != null && value !== '')
      properties.push({
        label: t(id),
        value: `${value}${unit}`,
        icon: propertyIcons[id]
      });
  };
  if (coordinates) {
    add(
      'Coordinates',
      `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)} (WGS84)`
    );
    add('Accuracy', entrance.precision, ' m');
  }
  if (!entrance.isSensitive || isAdmin)
    add('Altitude', entrance.altitude, ' m');
  add(
    'Territory',
    [entrance.city, entrance.county, entrance.region, entrance.country]
      .map(value => (typeof value === 'string' ? value : value?.name))
      .filter(Boolean)
      .join(', ')
  );
  add('Network', entrance.cave?.name);
  add('Depth', entrance.cave?.depth, ' m');
  add('Development', entrance.cave?.length, ' m');
  add('Temperature', entrance.cave?.temperature, ' °C');
  add('Year of discovery', entrance.discoveryYear);
  active(entrance.massifs)
    .filter(massif => massif.undergroundType)
    .forEach(massif => add('Underground type', massif.undergroundType));
  if (entrance.cave?.isDiving) add('Diving cave', t('Yes'));
  for (const [key, label] of FLAGS) if (entrance[key]) add(label, t('Yes'));
  if (!entrance.isDeleted) {
    const interest = getEntranceInterest(
      active(entrance.comments),
      intl.formatNumberToParts
    );
    add(
      'Interest of the visit',
      interest.average === null
        ? t('Interest not rated yet')
        : `${intl.formatMessage(
            { id: '{rating} / 5' },
            {
              rating: intl.formatNumber(interest.average, {
                maximumFractionDigits: 1
              })
            }
          )} · ${intl.formatMessage(
            { id: '{count, plural, one {# rating} other {# ratings}}' },
            { count: interest.ratingCount }
          )}`
    );
    add('Time to go', interest.approachTime);
    add('Underground time (short)', interest.undergroundTime);
  }
  const quality = getDataQualityValue(entrance.dataQuality);
  if (Number.isFinite(quality)) {
    add(
      'Data quality',
      `${intl.formatNumber(quality)} / 100 · ${t(getDataQualityLabelKey(quality))}`
    );
    properties[properties.length - 1].tone = getDataQualityLevel(quality);
  }

  const blocks = PDF_SECTIONS.filter(
    section =>
      sections[section.key] &&
      availability[section.key] &&
      !['properties', 'map', 'documents'].includes(section.key)
  ).map(section => ({
    key: section.key,
    type: section.key === 'riggings' ? 'rigging' : 'contributions',
    title: t(section.label),
    items: sortByRelevance(active(entrance[section.key])).map(item => ({
      ...contribution(item, intl),
      ...(section.key === 'comments'
        ? { details: getCommentDetails(item, intl) }
        : {})
    }))
  }));
  return makeEntityPdfModel({
    entity: entrance,
    entityType: 'entrance',
    route: 'entrances',
    propertiesTitle: 'General Information',
    sections,
    documents,
    attachments,
    intl,
    generatedAt,
    warning: entrance.isSensitive ? t('Sensitive entrance') : '',
    properties,
    coordinates: sections.map && availability.map ? coordinates : null,
    blocks,
    legends: [...OBSTACLE_LEGEND, ...ANCHOR_LEGEND]
      .map(item => `${t(item.abbrevKey)} = ${t(item.labelKey)}`)
      .join(' · ')
  });
};
