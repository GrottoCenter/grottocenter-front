import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Box, Typography } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { styled } from '@mui/material/styles';
import { fetchStatisticsCountry } from '../../../actions/Country/GetStatisticsCountry';
import { fetchStatisticsMassif } from '../../../actions/Massif/GetStatisticsMassif';
import { fetchStatisticsRegion } from '../../../actions/Region/GetStatisticsRegion';
import SpecificsCaves from './components/SpecificsCaves';
import CavesData from './components/CavesData/index';
import CavesStatistics from './components/CavesStatistics';
import Alert from '../../common/Alert';

const Title = styled(Typography)`
  padding-left: 15px;
  vertical-align: middle;
  display: inline-flex;
`;

const TitleBox = styled(Box)`
  background-color: ${({ theme }) => theme.palette.primary.light};
  color: #ffffff;
  padding: 15px 30px;
  margin-bottom: 20px;
`;

const DataBox = styled(Box)`
  margin: 0 2%;
  margin-top: 30px;
`;

const DashboardBox = styled(Box)`
  background-color: ${({ theme }) => theme.palette.backgroundColor};
  margin: 10px 5%;
`;

const StatisticsDataDashboard = ({ countryId, massifId, regionId }) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();

  const [data, setData] = useState({});
  const [entityType, setEntityType] = useState();

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

  useEffect(() => {
    setData(dataCountry);
    setEntityType('country');
  }, [dataCountry]);

  useEffect(() => {
    setData(dataMassif);
    setEntityType('massif');
  }, [dataMassif]);

  useEffect(() => {
    setData(dataRegion);
    setEntityType('region');
  }, [dataRegion]);

  useEffect(() => {
    if (regionId) {
      setEntityType('region');
    } else if (countryId) {
      setEntityType('country');
    } else {
      setEntityType('massif');
    }
  }, [countryId, regionId]);

  return (
    <>
      <Typography variant="h3" gutterBottom>
        {formatMessage({ id: 'More information' })}
      </Typography>
      {(loadingCountry || loadingMassif || loadingRegion) && (
        <Box
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '-50px'
          }}>
          <Skeleton height={300} width={1000} /> {/* Map Skeleton */}
        </Box>
      )}
      {data && data.nb_caves > 0 && !errorMassif && !errorCountry && !errorRegion && (
        <DashboardBox>
          <>
            <TitleBox boxShadow="1" border="1">
              <AssessmentIcon
                fontSize="large"
                style={{
                  width: '40px',
                  display: 'inline-flex',
                  verticalAlign: 'middle'
                }}
              />
              {/* Main Title */}
              <Title variant="h4">
                {(() => {
                  if (entityType === 'country') {
                    return formatMessage({
                      id: 'Discover the numbers about this country and its massifs and caves.'
                    });
                  }
                  if (entityType === 'region') {
                    return formatMessage({
                      id: 'Discover the numbers about this region and its caves.'
                    });
                  }
                  return formatMessage({
                    id: 'Discover the numbers about this massif and its caves.'
                  });
                })()}
              </Title>
            </TitleBox>

            {/* Other components */}
            <DataBox>
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
                  if (entityType === 'country') {
                    return `/ui/countries/${countryId}/entrances`;
                  }
                  if (entityType === 'region') {
                    return `/ui/countries/${countryId}/regions/${regionId}/entrances`;
                  }
                  return `/ui/massifs/${massifId}/entrances`;
                })()}
              />
            </DataBox>
            <DataBox>
              <CavesStatistics
                avgDepth={data.avg.avg_depth}
                avgLength={data.avg.avg_length}
                totalLength={data.total_length}
              />
            </DataBox>
            <DataBox>
              <SpecificsCaves
                maxDepthCave={data.cave_with_max_depth}
                maxLengthCave={data.cave_with_max_length}
                parentEntity={(() => {
                  if (entityType === 'country') {
                    return formatMessage({ id: 'country' });
                  }
                  if (entityType === 'region') {
                    return formatMessage({ id: 'region' });
                  }
                  return formatMessage({ id: 'massif' });
                })()}
              />
            </DataBox>
          </>
          <hr />
        </DashboardBox>
      )}
      {(errorMassif || errorCountry || errorRegion || 
        (data && data.nb_caves === 0) || 
        (!loadingCountry && !loadingMassif && !loadingRegion && (!data || data.nb_caves === undefined))) && (
        <Alert
          severity="info"
          title={(() => {
            if (entityType === 'country') {
              return formatMessage({
                id: 'There is currently not enough information about this country.'
              });
            }
            if (entityType === 'region') {
              return formatMessage({
                id: 'There is currently not enough information about this region.'
              });
            }
            return formatMessage({
              id: 'There is currently not enough information about this massif.'
            });
          })()}
        />
      )}
    </>
  );
};

// different type for both IDs make the component not factorizable
StatisticsDataDashboard.propTypes = {
  countryId: PropTypes.string,
  massifId: PropTypes.number,
  regionId: PropTypes.string
};

export default StatisticsDataDashboard;
