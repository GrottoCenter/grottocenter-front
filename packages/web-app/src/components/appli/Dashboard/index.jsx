import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { Box, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
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
    margin: '0px 40px',
    marginTop: '30px'
  }
}))(Box);

const DashboardBox = withStyles(
  theme => ({
    root: {
      backgroundColor: theme.palette.backgroundColor,
      margin: '20px 60px'
    }
  }),
  { withTheme: true }
)(Box);

const Dashboard = ({ id }) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();

  const { data } = useSelector(state => state.statisticsMassif);

  useEffect(() => {
    dispatch(fetchStatisticsMassif(id));
  }, [id, dispatch]);

  return (
    <>
      <Typography variant="h3" gutterBottom>
        {formatMessage({ id: 'More information' })}
      </Typography>
      {data.nb_caves > 0 ? (
        <DashboardBox>
          <>
            <TitleBox boxShadow="1" border="1">
              <img
                style={{
                  width: '30px',
                  display: 'inline-flex',
                  verticalAlign: 'middle'
                }}
                src="/images/question_mark.png"
                alt="question mark"
              />
              {/* Main Title */}
              <Title variant="h4">
                {formatMessage({
                  id:
                    'Discover the numbers about this massif and the caves associated.'
                })}
              </Title>
            </TitleBox>

            {/* Other components */}
            <DataBox>
              <CavesData
                nbCaves={data.nb_caves}
                nbDivingCaves={data.diving_caves}
                // TODO: add data from the database
                nbNetworks={data.nb_networks}
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
              />
            </DataBox>
          </>
          <hr />
        </DashboardBox>
      ) : (
        <Alert
          severity="info"
          title={formatMessage({
            id: 'There is currently not enough information about this massif.'
          })}
        />
      )}
    </>
  );
};

Dashboard.propTypes = {
  id: PropTypes.number.isRequired
};

export default Dashboard;
