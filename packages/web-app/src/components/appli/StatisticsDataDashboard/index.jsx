import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Box, Typography } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import AssessmentIcon from '@material-ui/icons/Assessment';
import { fetchStatisticsCountry } from '../../../actions/Country/GetStatisticsCountry';
import { fetchStatisticsMassif } from '../../../actions/Massif/GetStatisticsMassif';
import SpecificsCaves from './components/SpecificsCaves';
import CavesData from './components/CavesData/index';
import CavesStatistics from './components/CavesStatistics';
import Alert from '../../common/Alert';

const Title = withStyles(() => ({
  root: {
    paddingLeft: '15px',
    verticalAlign: 'middle',
    display: 'inline-flex'
  }
}))(Typography);

const TitleBox = withStyles(
  theme => ({
    root: {
      backgroundColor: theme.palette.primary.light,
      color: '#FFFFFF',
      padding: '15px 30px',
      marginBottom: '20px'
    }
  }),
  { withTheme: true }
)(Box);

const DataBox = withStyles(() => ({
  root: {
    margin: '0px 2%',
    marginTop: '30px'
  }
}))(Box);

const DashboardBox = withStyles(
  theme => ({
    root: {
      backgroundColor: theme.palette.backgroundColor,
      margin: '10px 5%'
    }
  }),
  { withTheme: true }
)(Box);

const StatisticsDataDashboard = ({ countryId, massifId }) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();

  const [data, setData] = useState({});
  const [isCountry, setIsCountry] = useState();

  const { dataMassif, loadingMassif, errorMassif } = useSelector(
    state => state.statisticsMassif
  );
  const { dataCountry, loadingCountry, errorCountry } = useSelector(
    state => state.statisticsCountry
  );

  useEffect(() => {
    if (countryId) {
      dispatch(fetchStatisticsCountry(countryId));
    } else {
      dispatch(fetchStatisticsMassif(massifId));
    }
  }, [countryId, massifId, dispatch]);

  useEffect(() => {
    setData(dataCountry);
    setIsCountry(true);
  }, [dataCountry]);

  useEffect(() => {
    setData(dataMassif);
    setIsCountry(false);
  }, [dataMassif]);

  useEffect(() => {
    setIsCountry(!!countryId);
  }, [countryId]);

  return (
    <>
      <Typography variant="h3" gutterBottom>
        {formatMessage({ id: 'More information' })}
      </Typography>
      {(loadingCountry || loadingMassif) && (
        <Box
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '-50px'
          }}>
          <Skeleton height={300} width={1000} /> {/* Map Skeleton */}
        </Box>
      )}
      {data && data.nb_caves > 0 && (
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
                {isCountry
                  ? formatMessage({
                      id: 'Discover the numbers about this country and its massifs and caves.'
                    })
                  : formatMessage({
                      id: 'Discover the numbers about this massif and its caves.'
                    })}
              </Title>
            </TitleBox>

            {/* Other components */}
            <DataBox>
              <CavesData
                title={
                  isCountry
                    ? formatMessage({
                        id: 'Massifs, networks and caves'
                      })
                    : formatMessage({
                        id: 'Networks and caves'
                      })
                }
                nbMassifs={data.nb_massifs}
                nbCaves={data.nb_caves}
                nbDivingCaves={data.diving_caves}
                nbNetworks={data.nb_networks}
                url={
                  isCountry
                    ? `/ui/countries/${countryId}/entrances`
                    : `/ui/massifs/${massifId}/entrances`
                }
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
                parentEntity={
                  isCountry
                    ? formatMessage({ id: 'country' })
                    : formatMessage({ id: 'massif' })
                }
              />
            </DataBox>
          </>
          <hr />
        </DashboardBox>
      )}
      {(errorMassif || errorCountry) && (
        <Alert
          severity="info"
          title={
            isCountry
              ? formatMessage({
                  id: 'There is currently not enough information about this country.'
                })
              : formatMessage({
                  id: 'There is currently not enough information about this massif.'
                })
          }
        />
      )}
    </>
  );
};

// different type for both IDs make the component not factorizable
StatisticsDataDashboard.propTypes = {
  countryId: PropTypes.string,
  massifId: PropTypes.number
};

export default StatisticsDataDashboard;
