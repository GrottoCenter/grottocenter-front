import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { Box, Grid, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { Handshake } from '@mui/icons-material';
import { loadDynamicNumber } from '../../../actions/DynamicNumber';
import { fetchCumulatedLength } from '../../../actions/CumulatedLength';
import { fetchUnreadMessageCount } from '../../../actions/Messaging/CountUnreadMessages';
import DataCard from './components/DataCard';
import DataLine from './components/DataLine';
import CustomIcon from '../../common/CustomIcon';
import GCLink from '../../common/GCLink';
import { usePermissions } from '../../../hooks';

const SectionTitle = styled('h3')`
  text-align: center;
  padding: 20px;
  font-size: 35px;
  color: ${({ theme }) => theme.palette.secondary.main};
`;

const StyledLink = styled(GCLink)`
  text-decoration: none;
`;

const DataHomepage = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const { languageObject } = useSelector(state => state.intl);
  const { isAuth } = usePermissions();

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

    if (isAuth) {
      dispatch(fetchUnreadMessageCount());
    }
  }, [dispatch, languageObject, isAuth]);

  return (
    <Box sx={{ margin: '10px 5%' }}>
      <SectionTitle>
        {formatMessage({ id: 'Grottocenter in numbers' })}
      </SectionTitle>
      <div>
        {/* First line */}
        {officialPartners && (
          <DataLine
            numberData={officialPartners.number}
            isFetching={officialPartners.isFetching}
            icon={<Handshake sx={{ fontSize: 55 }} color="primary" />}
          />
        )}
        {/* Rest of the grid */}
        <Grid container>
          <Grid size={{ xs: 12, sm: 4 }}>
            {entrances && (
              <StyledLink internal href="/ui/entrances">
                <DataCard
                  isColored={false}
                  icon={<CustomIcon type="entrance" size={55} />}
                  numberData={entrances.number}
                  isFetching={entrances.isFetching}
                  title={formatMessage({ id: 'caves' })}
                  globalText={formatMessage({ id: 'are accessible.' })}
                />
              </StyledLink>
            )}
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            {users && (
              <StyledLink internal href="/ui/persons">
                <DataCard
                  isColored
                  icon={<CustomIcon type="caver" size={55} />}
                  numberData={users.number}
                  isFetching={users.isFetching}
                  title={formatMessage({ id: 'cavers' })}
                  globalText={formatMessage({
                    id: 'take part, day after day, in improving and expanding the database.'
                  })}
                />
              </StyledLink>
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            {documents && (
              <StyledLink internal href="/ui/documents">
                <DataCard
                  isColored={false}
                  icon={<CustomIcon type="bibliography" size={55} />}
                  numberData={documents.number}
                  isFetching={documents.isFetching}
                  title={formatMessage({ id: 'documents' })}
                  globalText={formatMessage({
                    id: 'are referenced.'
                  })}
                />
              </StyledLink>
            )}
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            {countries && (
              <StyledLink internal href="/ui/countries">
                <DataCard
                  isColored
                  icon={<CustomIcon size={55} type="country" />}
                  numberData={countries.number}
                  isFetching={countries.isFetching}
                  title={formatMessage({ id: 'countries' })}
                  globalText={formatMessage({
                    id: 'are represented on this website.'
                  })}
                />
              </StyledLink>
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            {cumulatedLength && (
              <StyledLink internal href="/ui/entrances">
                <DataCard
                  isColored={false}
                  icon={
                    <Tooltip
                      title={`${formatMessage({ id: 'Calculated on' })} ${
                        cumulatedLength.nb_data
                      } ${formatMessage({ id: 'caves' })}`}
                      placement="top">
                      <CustomIcon type="length" size={55} />
                    </Tooltip>
                  }
                  numberData={Math.round(cumulatedLength.sum_length / 1000)}
                  isFetching={loadingCumulatedLength}
                  title={formatMessage({ id: 'km of caves' })}
                  globalText={formatMessage({
                    id: 'are available.'
                  })}
                />
              </StyledLink>
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            {organizations && (
              <StyledLink internal href="/ui/organizations">
                <DataCard
                  isColored
                  icon={<CustomIcon type="organization" size={55} />}
                  numberData={organizations.number}
                  isFetching={organizations.isFetching}
                  title={formatMessage({ id: 'organizations' })}
                  globalText={formatMessage({
                    id: 'are registered on the website.'
                  })}
                />
              </StyledLink>
            )}
          </Grid>
        </Grid>
      </div>
    </Box>
  );
};

export default DataHomepage;
