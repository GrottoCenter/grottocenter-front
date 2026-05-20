import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';

import { fetchCountry } from '../../actions/Country/GetCountry';
import { fetchRegion } from '../../actions/Region/GetRegion';
import { loadMassif } from '../../actions/Massif/GetMassif';
import { fetchFieldSearch } from '../../actions/FieldSearch';
import getLocalizedCountryName from '../../helpers/countryName';
import REDUCER_STATUS from '../../reducers/ReducerStatus';
import EntitySearchPage from '../../components/appli/AdvancedSearch/EntitySearchPage';
import EntrancesSearch from '../../components/appli/AdvancedSearch/EntrancesSearch';
import { ADVANCED_SEARCH_TYPES } from '../../conf/config';

const getFlagEmoji = iso =>
  typeof iso === 'string' && iso.length === 2
    ? [...iso.toUpperCase()]
        .map(c => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
        .join('')
    : '';

const EntrancesListPage = () => {
  const { countryId, regionId, massifId } = useParams();
  const dispatch = useDispatch();
  const { formatMessage, locale } = useIntl();

  const { country, status: countryStatus } = useSelector(state => state.country);
  const { region, status: regionStatus } = useSelector(state => state.regionDetails);
  const { massif, isFetching: massifFetching } = useSelector(state => state.massif);
  const [countyValue, setCountyValue] = useState(undefined);
  const [massifValue, setMassifValue] = useState(undefined);

  useEffect(() => {
    if (countryId) dispatch(fetchCountry(countryId));
    if (regionId && countryId) dispatch(fetchRegion(countryId, regionId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryId, regionId]);

  useEffect(() => {
    if (massifId) dispatch(loadMassif(massifId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [massifId]);

  useEffect(() => {
    if (!regionId || !region || !country) return;
    setCountyValue(undefined);
    fetchFieldSearch({
      entity: ADVANCED_SEARCH_TYPES.ENTRANCES,
      field: 'county',
      query: region.name,
      filter: { country: country.nativeName }
    })
      .then(r => setCountyValue(r?.hits?.[0]?.[0] ?? null))
      .catch(() => setCountyValue(null));
  }, [region, country, regionId]);

  useEffect(() => {
    if (!massifId || !massif) return;
    setMassifValue(undefined);
    fetchFieldSearch({
      entity: ADVANCED_SEARCH_TYPES.ENTRANCES,
      field: 'massifs',
      query: massif.name,
      filter: {}
    })
      .then(r => setMassifValue(r?.hits?.[0]?.[0] ?? null))
      .catch(() => setMassifValue(null));
  }, [massif, massifId]);

  let initialFilter = {};
  let lockedFilter = [];
  let searchKey = 'open';
  let pageTitle = formatMessage({ id: 'Entrances' });

  const label = formatMessage({ id: 'Entrances' });

  if (massifId && massif && !massifFetching && massifValue !== undefined) {
    const resolvedMassif = massifValue ?? massif.name;
    initialFilter = { massifs: resolvedMassif };
    lockedFilter = ['massifs'];
    searchKey = resolvedMassif;
    pageTitle = `${label} - ${massif.name}`;
  }

  const countryReady = countryStatus === REDUCER_STATUS.SUCCEEDED && country;
  if (countryReady) {
    const flag = getFlagEmoji(country.id);
    const localizedCountry = getLocalizedCountryName(country.id, locale, country.nativeName);

    if (regionId && regionStatus === REDUCER_STATUS.SUCCEEDED && region && countyValue !== undefined) {
      const resolvedCounty = countyValue ?? region.name;
      initialFilter = { country: country.nativeName, county: resolvedCounty };
      lockedFilter = ['country', 'county'];
      searchKey = `${country.nativeName}|${resolvedCounty}`;
      pageTitle = `${flag} ${label} - ${localizedCountry} - ${region.name}`;
    } else if (!regionId) {
      initialFilter = { country: country.nativeName };
      lockedFilter = ['country'];
      searchKey = country.nativeName;
      pageTitle = `${flag} ${label} - ${localizedCountry}`;
    }
  }

  if (searchKey === 'open' && (countryId || massifId)) return null;

  return (
    <EntitySearchPage title={pageTitle} entityType="entrances" initialFilter={initialFilter}>
      <EntrancesSearch
        key={searchKey}
        initialFilter={initialFilter}
        lockedFilter={lockedFilter}
      />
    </EntitySearchPage>
  );
};

export default EntrancesListPage;
