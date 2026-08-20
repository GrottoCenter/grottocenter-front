import { useIntl } from 'react-intl';
import { Box, Paper } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';
import PropTypes from 'prop-types';
import {
  useStatisticsCountry,
  useStatisticsMassif,
  useStatisticsRegion
} from '../../../hooks';
import SpecificsCaves from './components/SpecificsCaves';
import CavesData from './components/CavesData/index';
import CavesStatistics from './components/CavesStatistics';
import Alert from '../../common/Alert';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';

const StatisticsDataDashboard = ({
  countryId,
  massifId,
  regionId,
  description
}) => {
  const { formatMessage } = useIntl();

  // All three fire so consumers don't have to branch on entity type before the
  // hook call — {enabled} gates on presence of the corresponding ids, so only
  // the relevant one hits the network.
  const regionQuery = useStatisticsRegion(countryId, regionId);
  const countryQuery = useStatisticsCountry(regionId ? null : countryId);
  const massifQuery = useStatisticsMassif(massifId);

  let query;
  let entityType;
  if (regionId && countryId) {
    query = regionQuery;
    entityType = 'region';
  } else if (countryId) {
    query = countryQuery;
    entityType = 'country';
  } else {
    query = massifQuery;
    entityType = 'massif';
  }

  const { data, isPending: isLoading, isError: hasError } = query;
  const hasData = data && data.nb_caves > 0 && !hasError;
  const isEmpty =
    !isLoading &&
    !hasData &&
    (!data || data.nb_caves === undefined || data.nb_caves === 0);

  return (
    <ScrollableContent
      anchorId="statistics"
      defaultExpanded={hasData}
      title={formatMessage({ id: 'More information' })}
      subheader={description}
      content={
        <>
          {isLoading && <Skeleton height={200} width="100%" />}
          {hasData && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* KPI banner: 3 key metrics full width */}
              <Paper
                variant="outlined"
                sx={{ p: 1, borderRadius: 2, bgcolor: 'grey.50' }}>
                <CavesStatistics
                  avgDepth={data.avg.avg_depth}
                  avgLength={data.avg.avg_length}
                  totalLength={data.total_length}
                />
              </Paper>
              {/* 2 columns: counts (left) + specific caves stacked (right) */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 1
                }}>
                <Paper
                  variant="outlined"
                  sx={{ p: 0.5, px: 3, borderRadius: 2, bgcolor: 'grey.50' }}>
                  <CavesData
                    title={
                      entityType === 'country'
                        ? formatMessage({ id: 'Massifs, networks and caves' })
                        : formatMessage({ id: 'Networks and caves' })
                    }
                    nbMassifs={data.nb_massifs}
                    nbCaves={data.nb_caves}
                    nbDivingCaves={data.diving_caves}
                    nbNetworks={data.nb_networks}
                  />
                </Paper>
                <Paper
                  variant="outlined"
                  sx={{ p: 1, borderRadius: 2, bgcolor: 'grey.50' }}>
                  <SpecificsCaves
                    maxDepthCave={data.cave_with_max_depth}
                    maxLengthCave={data.cave_with_max_length}
                    parentEntity={(() => {
                      if (entityType === 'country')
                        return formatMessage({ id: 'country' });
                      if (entityType === 'region')
                        return formatMessage({ id: 'region' });
                      return formatMessage({ id: 'massif' });
                    })()}
                  />
                </Paper>
              </Box>
            </Box>
          )}
          {(hasError || isEmpty) && (
            <Alert
              severity="info"
              content={(() => {
                if (entityType === 'country')
                  return formatMessage({
                    id: 'There is currently not enough information about this country.'
                  });
                if (entityType === 'region')
                  return formatMessage({
                    id: 'There is currently not enough information about this region.'
                  });
                return formatMessage({
                  id: 'There is currently not enough information about this massif.'
                });
              })()}
            />
          )}
        </>
      }
    />
  );
};

// different type for both IDs make the component not factorizable
StatisticsDataDashboard.propTypes = {
  countryId: PropTypes.string,
  massifId: PropTypes.number,
  regionId: PropTypes.string,
  description: PropTypes.string
};

export default StatisticsDataDashboard;
