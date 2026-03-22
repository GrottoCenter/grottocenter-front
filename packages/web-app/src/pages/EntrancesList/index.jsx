import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { List, Pagination, Box } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';
import { styled } from '@mui/material/styles';
import Alert from '../../components/common/Alert';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import { fetchMassifEntrances } from '../../actions/Massif/GetEntrancesDataQuality';
import { fetchCountryEntrances } from '../../actions/Country/GetEntrancesDataQuality';
import { fetchRegionEntrances } from '../../actions/Region/GetEntrancesDataQuality';
import { fetchCountry } from '../../actions/Country/GetCountry';
import { fetchRegion } from '../../actions/Region/GetRegion';
import { loadMassif } from '../../actions/Massif/GetMassif';
import EntranceList from './EntranceList';
import DataQualityComputeDetails from './DataQualityComputeDetails';
import getLocalizedCountryName from '../../helpers/countryName';

const StyledList = styled(List)({
  display: 'flex',
  flexWrap: 'wrap',
  width: '100%',
  justifyContent: 'space-between'
});

const sortByDataQuality = entrances =>
  entrances.sort((a, b) => b.data_quality - a.data_quality);

const EntrancesListPage = () => {
  const { formatMessage, locale } = useIntl();
  const { countryId, massifId, regionId } = useParams();
  const dispatch = useDispatch();

  const [page, setPage] = useState(1);
  const limit = 36;
  // to store entrances even if it's massif entrances or country entrances (managed with a useEffect)
  const [entrances, setEntrances] = useState(null);
  // to store error even if it's massif entrances error or country entrances error (managed with a useEffect)
  const [error, setError] = useState(null);
  const [entityType, setEntityType] = useState();
  const [totalPages, setTotalPages] = useState(0);
  const [hasData, setHasData] = useState(false);

  const { massifEntrances, massifEntrancesLoading, massifEntrancesError } =
    useSelector(state => state.massifEntrances);

  const { countryEntrances, countryEntrancesLoading, countryEntrancesError } =
    useSelector(state => state.countryEntrances);

  const { regionEntrances, regionEntrancesLoading, regionEntrancesError } =
    useSelector(state => state.regionEntrances);

  const { country } = useSelector(state => state.country);
  const { region } = useSelector(state => state.regionDetails);
  const { massif } = useSelector(state => state.massif);

  // Fetch entity data only once when IDs change
  useEffect(() => {
    if (regionId && countryId) {
      dispatch(fetchRegion(countryId, regionId));
    } else if (countryId) {
      dispatch(fetchCountry(countryId));
    } else if (massifId) {
      dispatch(loadMassif(massifId));
    }
  }, [countryId, massifId, regionId, dispatch]);

  // Fetch entrances data when page or IDs change
  useEffect(() => {
    const offset = (page - 1) * limit;
    if (regionId && countryId) {
      dispatch(fetchRegionEntrances(countryId, regionId, { limit, offset }));
    } else if (countryId) {
      dispatch(fetchCountryEntrances(countryId, { limit, offset }));
    } else if (massifId) {
      dispatch(fetchMassifEntrances(massifId, { limit, offset }));
    }
  }, [countryId, massifId, regionId, page, limit, dispatch]);

  const massifState = useSelector(state => state.massifEntrances);
  const countryState = useSelector(state => state.countryEntrances);
  const regionState = useSelector(state => state.regionEntrances);

  // Reset page when entity changes
  useEffect(() => {
    setPage(1);
  }, [countryId, massifId, regionId]);

  // manage entrances
  useEffect(() => {
    if (countryEntrances) {
      setEntrances(
        Array.isArray(countryEntrances)
          ? sortByDataQuality(countryEntrances)
          : countryEntrances
      );
      setEntityType('country');
      if (countryState.totalPages) {
        setTotalPages(countryState.totalPages);
        setHasData(true);
      }
    }
  }, [countryEntrances, countryState.totalPages]);

  useEffect(() => {
    if (massifEntrances) {
      setEntrances(
        Array.isArray(massifEntrances)
          ? sortByDataQuality(massifEntrances)
          : massifEntrances
      );
      setEntityType('massif');
      if (massifState.totalPages) {
        setTotalPages(massifState.totalPages);
        setHasData(true);
      }
    }
  }, [massifEntrances, massifState.totalPages]);

  useEffect(() => {
    if (regionEntrances) {
      setEntrances(
        Array.isArray(regionEntrances)
          ? sortByDataQuality(regionEntrances)
          : regionEntrances
      );
      setEntityType('region');
      if (regionState.totalPages) {
        setTotalPages(regionState.totalPages);
        setHasData(true);
      }
    }
  }, [regionEntrances, regionState.totalPages]);

  // manage error
  useEffect(() => {
    if (entityType === 'country' && countryEntrancesError) {
      setError(countryEntrancesError);
    } else if (entityType === 'massif' && massifEntrancesError) {
      setError(massifEntrancesError);
    } else if (entityType === 'region' && regionEntrancesError) {
      setError(regionEntrancesError);
    }
  }, [
    massifEntrancesError,
    countryEntrancesError,
    regionEntrancesError,
    entityType
  ]);

  const skeletons = new Array(10).fill(0);

  const getTitle = () => {
    if (error) {
      return '';
    }
    if (entrances) {
      if (entityType === 'country') {
        const entranceWithCountry = entrances.find(e => e.country_name);
        return getLocalizedCountryName(
          country,
          formatMessage,
          locale,
          entranceWithCountry?.country_name
        );
      }
      if (entityType === 'region') {
        return region?.name;
      } // else massif:
      return massif?.name;
    }
    return formatMessage({ id: 'Loading entrances...' });
  };

  const handleClickScroll = () => {
    const element = document.getElementById('details');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const shouldShowPagination = hasData && totalPages > 1;

  return (
    <Layout
      title={getTitle()}
      content={
        <>
          {(massifEntrancesLoading ||
            countryEntrancesLoading ||
            regionEntrancesLoading) &&
            !error && (
              <StyledList>
                {skeletons.map((_, index) => (
                  <Skeleton key={index} height={90} width="100%" />
                ))}
              </StyledList>
            )}
          {error && (
            <Alert
              title={formatMessage({
                id: 'Error, the data you are looking for is not available.'
              })}
              severity="error"
            />
          )}
          {entrances && entrances.length > 0 && (
            <>
              <EntranceList
                entrances={entrances}
                handleClickScroll={handleClickScroll}
              />
              {shouldShowPagination && (
                <Box mt={3} mb={3} display="flex" justifyContent="center">
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    disabled={massifEntrancesLoading || countryEntrancesLoading || regionEntrancesLoading}
                    color="primary"
                  />
                </Box>
              )}
              <DataQualityComputeDetails />
            </>
          )}
        </>
      }
    />
  );
};

export default EntrancesListPage;
