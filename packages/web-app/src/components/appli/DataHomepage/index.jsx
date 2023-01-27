import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import {
  Box,
  Grid,
  Tooltip,
  Typography,
  withStyles,
  withTheme
} from '@material-ui/core';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { DirectionsWalk, Language } from '@material-ui/icons';
import { loadDynamicNumber } from '../../../actions/DynamicNumber';
import { fetchCumulatedLength } from '../../../actions/CumulatedLength';
import DataCard from './components/DataCard';
import DataLine from './components/DataLine';

import './style.css';

const SectionTitle = withStyles(
  theme => ({
    root: {
      color: theme.palette.secondary.main,
      textAlign: 'center',
      padding: '40px',
      fontSize: '35px'
    }
  }),
  { withTheme: true }
)(Typography);

const BlockIcon = withTheme(styled.span`
  margin-right: 10px;
  font-size: 4.2em;
  color: ${props => props.theme.palette.primary1Color};
  line-height: 1;

  :before {
    font-family: gc-icon !important;
    font-style: normal;
    font-weight: normal !important;
    vertical-align: top;
  }
`);

const DataHomepage = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const { languageObject } = useSelector(state => state.intl);

  // get Object : { isFetching: bool, number: Number }
  const {
    documents,
    entrances,
    officialPartners,
    organizations,
    users,
    countries
  } = useSelector(state => state.dynamicNumber);
  const { cumulatedLength, loadingCumulatedLength } = useSelector(
    state => state.cumulatedLength
  );

  useEffect(() => {
    dispatch(loadDynamicNumber('documents'));
    dispatch(loadDynamicNumber('entrances'));
    dispatch(loadDynamicNumber('officialPartners'));
    dispatch(loadDynamicNumber('organizations'));
    dispatch(loadDynamicNumber('users'));
    dispatch(loadDynamicNumber('countries'));
    dispatch(fetchCumulatedLength());
  }, [dispatch, languageObject]);

  return (
    <Box sx={{ margin: '10px 5%' }}>
      <SectionTitle>
        {formatMessage({ id: 'Grottocenter in numbers' })}
      </SectionTitle>
      <div
        style={{
          flexGrow: 1
        }}>
        {/* First line */}
        {officialPartners && (
          <DataLine
            numberData={officialPartners.number}
            isFetching={officialPartners.isFetching}
            icon={
              <BlockIcon className="icon-gc-club" style={{ margin: '10px' }} />
            }
          />
        )}
        {/* Rest of the grid */}
        <Grid container>
          <Grid item xs={12} sm={4}>
            {entrances && (
              <DataCard
                isColored={false}
                icon={
                  <img
                    style={{ width: '70px' }}
                    src="/images/gc-entries.svg"
                    alt={formatMessage({ id: 'Entries icon' })}
                  />
                }
                numberData={entrances.number}
                isFetching={entrances.isFetching}
                title={formatMessage({ id: 'caves' })}
                globalText={formatMessage({ id: 'are freely accessible.' })}
              />
            )}
          </Grid>

          <Grid item xs={12} sm={4}>
            {users && (
              <DataCard
                isColored
                icon={<BlockIcon className="icon-gc-speleo" />}
                numberData={users.number}
                isFetching={users.isFetching}
                title={formatMessage({ id: 'cavers' })}
                globalText={formatMessage({
                  id: 'take part, day after day, in improving and expanding the database.'
                })}
              />
            )}
          </Grid>
          <Grid item xs={12} sm={4}>
            {documents && (
              <DataCard
                isColored={false}
                icon={
                  <img
                    style={{ width: '70px' }}
                    src="/images/bbs_logo.png"
                    alt={formatMessage({ id: 'BBS icon' })}
                  />
                }
                numberData={documents.number}
                isFetching={documents.isFetching}
                title={formatMessage({ id: 'documents' })}
                globalText={formatMessage({
                  id: 'are referenced.'
                })}
              />
            )}
          </Grid>

          <Grid item xs={12} sm={4}>
            {countries && (
              <DataCard
                isColored
                icon={<Language style={{ fontSize: 55 }} color="primary" />}
                numberData={countries.number}
                isFetching={countries.isFetching}
                title={formatMessage({ id: 'countries' })}
                globalText={formatMessage({
                  id: 'are represented on this website.'
                })}
                width="36%"
              />
            )}
          </Grid>
          <Grid item xs={12} sm={4}>
            {cumulatedLength && (
              <DataCard
                isColored={false}
                icon={
                  <Tooltip
                    title={`${formatMessage({ id: 'Calculated on' })} ${
                      cumulatedLength.nb_data
                    } ${formatMessage({ id: 'caves' })}`}
                    placement="top">
                    <DirectionsWalk style={{ fontSize: 50 }} color="primary" />
                  </Tooltip>
                }
                numberData={Math.round(cumulatedLength.sum_length / 1000)}
                isFetching={loadingCumulatedLength}
                title={formatMessage({ id: 'km of caves' })}
                globalText={formatMessage({
                  id: 'are available.'
                })}
                width="32%"
              />
            )}
          </Grid>
          <Grid item xs={12} sm={4}>
            {organizations && (
              <DataCard
                isColored
                icon={<BlockIcon className="icon-gc-expe" />}
                numberData={organizations.number}
                isFetching={organizations.isFetching}
                title={formatMessage({ id: 'organizations' })}
                globalText={formatMessage({
                  id: 'are registered on the website.'
                })}
                width="40%"
              />
            )}
          </Grid>
        </Grid>
      </div>
    </Box>
  );
};

export default DataHomepage;
