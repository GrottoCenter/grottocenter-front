import { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { Box, Grid, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { Handshake } from '@mui/icons-material';
import { loadDynamicNumber } from '../../../actions/DynamicNumber';
import { fetchCumulatedLength } from '../../../actions/CumulatedLength';
import DataCard from './components/DataCard';
import DataLine from './components/DataLine';
import CustomIcon from '../../common/CustomIcon';
import AppLink from '../../common/AppLink';

// Weight/leading/margins used to come from the global Skeleton-CSS `h1..h6`
// rule; they are explicit now that it is gone. Known deviation from the theme
// typography scale: this homepage hero title is deliberately larger and lighter
// than any `h*` variant.
const SectionTitle = styled('h3')`
  text-align: center;
  padding: ${({ theme }) => theme.spacing(2.5)};
  margin: 0 0 ${({ theme }) => theme.spacing(2.5)};
  font-size: 2.1875rem;
  font-weight: 300;
  line-height: 1.3;
  letter-spacing: -1px;
  color: ${({ theme }) => theme.palette.secondary.main};
`;

const StyledLink = props => (
  <AppLink color="inherit" underline="none" {...props} />
);

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
              <StyledLink to="/ui/entrances">
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
              <StyledLink to="/ui/persons">
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
              <StyledLink to="/ui/documents">
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
              <StyledLink to="/ui/countries">
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
              <StyledLink to="/ui/entrances">
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
              <StyledLink to="/ui/organizations">
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
