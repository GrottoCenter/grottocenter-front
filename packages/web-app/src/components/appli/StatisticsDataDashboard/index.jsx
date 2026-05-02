import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { Box, Paper } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStatisticsCountry } from '../../../actions/Country/GetStatisticsCountry';
import { fetchStatisticsMassif } from '../../../actions/Massif/GetStatisticsMassif';
import { fetchStatisticsRegion } from '../../../actions/Region/GetStatisticsRegion';
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
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();

  const { dataMassif, loadingMassif, errorMassif } = useSelector(
    state => state.statisticsMassif
  );
  const { dataCountry, loadingCountry, errorCountry } = useSelector(
    state => state.statisticsCountry
  );
  const { statistics: dataRegion, status: statusRegion } = useSelector(
    state => state.statisticsRegion
  );
  const loadingRegion = statusRegion === 'LOADING';
  const errorRegion = statusRegion === 'FAILED';

  useEffect(() => {
    if (regionId && countryId) {
      dispatch(fetchStatisticsRegion(countryId, regionId));
    } else if (countryId) {
      dispatch(fetchStatisticsCountry(countryId));
    } else {
      dispatch(fetchStatisticsMassif(massifId));
    }
  }, [countryId, massifId, regionId, dispatch]);

  let data;
  let entityType;
  if (regionId && countryId) {
    data = dataRegion;
    entityType = 'region';
  } else if (countryId) {
    data = dataCountry;
    entityType = 'country';
  } else {
    data = dataMassif;
    entityType = 'massif';
  }

  const isLoading =
    entityType === 'region' ? loadingRegion
    : entityType === 'country' ? loadingCountry
    : loadingMassif;
  const hasError =
    entityType === 'region' ? errorRegion
    : entityType === 'country' ? errorCountry
    : errorMassif;
  const hasData = data && data.nb_caves > 0 && !hasError;
  const isEmpty =
    !isLoading &&
    !hasData &&
    (!data || data.nb_caves === undefined || data.nb_caves === 0);

  return (
    <ScrollableContent
      anchorId="statistics"
      defaultExpanded={isLoading || hasData}
      title={formatMessage({ id: 'More information' })}
      subheader={description}
      content={
        <>
          {isLoading && <Skeleton height={200} width="100%" />}
          {hasData && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* KPI banner: 3 key metrics full width */}
              <Paper
                variant="outlined"
                sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
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
                  gap: 2
                }}>
                <Paper
                  variant="outlined"
                  sx={{ p: 1, px: 4, borderRadius: 2, bgcolor: 'grey.50' }}>
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
                    url={(() => {
                      if (entityType === 'country')
                        return `/ui/countries/${countryId}/entrances`;
                      if (entityType === 'region')
                        return `/ui/countries/${countryId}/regions/${regionId}/entrances`;
                      return `/ui/massifs/${massifId}/entrances`;
                    })()}
                  />
                </Paper>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
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
              title={(() => {
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
