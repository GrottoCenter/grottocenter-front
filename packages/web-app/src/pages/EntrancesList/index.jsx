import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { List } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import styled from 'styled-components';
import Alert from '../../components/common/Alert';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import { fetchMassifEntrances } from '../../actions/Massif/GetEntrancesDataQuality';
import { fetchCountryEntrances } from '../../actions/Country/GetEntrancesDataQuality';
import EntranceList from './EntranceList';
import DataQualityComputeDetails from './DataQualityComputeDetails';

const StyledList = styled(List)({
  display: 'flex',
  flexWrap: 'wrap',
  width: '100%',
  justifyContent: 'space-between'
});

const sortByDataQuality = entrances =>
  entrances.sort((a, b) => b.data_quality - a.data_quality);

const EntrancesListPage = props => {
  const { countryId, massifId } = useParams();
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();

  // to store entrances even if it's massif entrances or country entrances (managed with a useEffect)
  const [entrances, setEntrances] = useState(null);
  // to store error even if it's massif entrances error or country entrances error (managed with a useEffect)
  const [error, setError] = useState(null);
  const [isCountry, setIsCountry] = useState();

  const { massifEntrances, massifEntrancesLoading, massifEntrancesError } =
    useSelector(state => state.massifEntrances);

  const { countryEntrances, countryEntrancesLoading, countryEntrancesError } =
    useSelector(state => state.countryEntrances);

  useEffect(() => {
    if (countryId) {
      dispatch(fetchCountryEntrances(countryId));
    } else {
      dispatch(fetchMassifEntrances(massifId));
    }
  }, [countryId, massifId, dispatch]);

  // manage entrances
  useEffect(() => {
    setEntrances(
      Array.isArray(countryEntrances)
        ? sortByDataQuality(countryEntrances)
        : countryEntrances
    );
    setIsCountry(true);
  }, [countryEntrances]);

  useEffect(() => {
    setEntrances(
      Array.isArray(massifEntrances)
        ? sortByDataQuality(massifEntrances)
        : massifEntrances
    );
    setIsCountry(false);
  }, [massifEntrances]);

  // manage error
  useEffect(() => {
    if (isCountry && countryEntrancesError) {
      setError(countryEntrancesError);
    } else if (!isCountry && massifEntrancesError) {
      setError(massifEntrancesError);
    }
  }, [massifEntrancesError, countryEntrancesError, isCountry]);

  const skeletons = new Array(10).fill(0);

  const getTitle = () => {
    if (error) {
      return '';
    }
    if (entrances && entrances[0]) {
      if (isCountry) {
        return entrances[0].country_name;
      } // else :
      return entrances[0].massif_name;
    }
    return formatMessage({ id: 'Loading entrances...' });
  };

  const handleClickScroll = () => {
    const element = document.getElementById('details');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Layout
      title={getTitle()}
      content={
        <>
          {massifEntrancesLoading ||
            (countryEntrancesLoading && !error && (
              <StyledList>
                {skeletons.map(() => (
                  <Skeleton height={90} width={350} />
                ))}
              </StyledList>
            ))}
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

              <DataQualityComputeDetails />
            </>
          )}
        </>
      }
    />
  );
};

export default EntrancesListPage;
