import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { fetchCountry } from '../../actions/Country/GetCountry';
import { fetchRegion } from '../../actions/Region/GetRegion';
import REDUCER_STATUS from '../../reducers/ReducerStatus';
import EntitySearchPage from '../../components/appli/AdvancedSearch/EntitySearchPage';
import EntrancesSearch from '../../components/appli/AdvancedSearch/EntrancesSearch';

const EntrancesListPage = () => {
  const { countryId, regionId } = useParams();
  const dispatch = useDispatch();

  const { country, status: countryStatus } = useSelector(state => state.country);
  const { region, status: regionStatus } = useSelector(
    state => state.regionDetails
  );

  useEffect(() => {
    if (countryId) dispatch(fetchCountry(countryId));
    if (regionId && countryId) dispatch(fetchRegion(countryId, regionId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryId, regionId]);

  let initialFilter = {};
  let lockedFilter = [];
  let searchKey = 'open';

  if (countryId && regionId) {
    const ready =
      countryStatus === REDUCER_STATUS.SUCCEEDED &&
      regionStatus === REDUCER_STATUS.SUCCEEDED &&
      country &&
      region;
    if (ready) {
      initialFilter = { country: country.nativeName, county: region.name };
      lockedFilter = ['country', 'county'];
      searchKey = `${country.nativeName}|${region.name}`;
    }
  } else if (countryId) {
    const ready =
      countryStatus === REDUCER_STATUS.SUCCEEDED && country;
    if (ready) {
      initialFilter = { country: country.nativeName };
      lockedFilter = ['country'];
      searchKey = country.nativeName;
    }
  }

  return (
    <EntitySearchPage
      title="Entrances"
      entityType="entrances"
      initialFilter={initialFilter}>
      <EntrancesSearch
        key={searchKey}
        initialFilter={initialFilter}
        lockedFilter={lockedFilter}
      />
    </EntitySearchPage>
  );
};

export default EntrancesListPage;
