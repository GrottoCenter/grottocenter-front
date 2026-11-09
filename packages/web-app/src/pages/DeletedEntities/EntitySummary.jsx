import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Stack, Typography } from '@mui/material';

const EntitySummary = ({ resource, entity }) => {
  const { formatMessage, formatNumber } = useIntl();
  let summary;
  switch (resource) {
    case 'organizations':
      summary = [entity.city, entity.region, entity.country]
        .filter(Boolean)
        .join(' · ');
      break;
    case 'entrances':
      summary = [entity.city, entity.region, entity.country]
        .filter(Boolean)
        .join(' · ');
      break;
    case 'caves':
      summary = [
        `${formatMessage({ id: 'Entrances' })}: ${entity.nbEntrances ?? entity.entrances?.length ?? 0}`,
        entity.length != null &&
          `${formatMessage({ id: 'Length' })}: ${formatNumber(entity.length)} m`,
        entity.depth != null &&
          `${formatMessage({ id: 'Depth' })}: ${formatNumber(entity.depth)} m`
      ]
        .filter(Boolean)
        .join(' · ');
      break;
    case 'massifs':
      summary = entity.isSensitive
        ? formatMessage({ id: 'Sensitive massif' })
        : null;
      break;
    case 'documents':
      summary = null;
      break;
    case 'guidelines':
      summary = [
        ...(entity.countries ?? []),
        ...(entity.regions ?? []),
        ...(entity.massifs ?? [])
      ]
        .map(scope => scope.name ?? scope.id ?? scope)
        .join(' · ');
      break;
    default:
      summary = null;
  }
  return (
    <Stack spacing={0.5}>
      {summary && <Typography variant="body2">{summary}</Typography>}
    </Stack>
  );
};

EntitySummary.propTypes = {
  resource: PropTypes.string.isRequired,
  entity: PropTypes.shape({
    type: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({ name: PropTypes.string })
    ]),
    city: PropTypes.string,
    region: PropTypes.string,
    country: PropTypes.string,
    nbEntrances: PropTypes.number,
    entrances: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.shape({ id: PropTypes.number })
      ])
    ),
    length: PropTypes.number,
    depth: PropTypes.number,
    isSensitive: PropTypes.bool,
    countries: PropTypes.arrayOf(PropTypes.shape({})),
    regions: PropTypes.arrayOf(PropTypes.shape({})),
    massifs: PropTypes.arrayOf(PropTypes.shape({})),
    language: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({ id: PropTypes.string, refName: PropTypes.string })
    ]),
    mainLanguage: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({ id: PropTypes.string, refName: PropTypes.string })
    ])
  }).isRequired
};

export default EntitySummary;
