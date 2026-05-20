import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';

import { fetchCountry } from '../../actions/Country/GetCountry';
import { fetchRegion } from '../../actions/Region/GetRegion';
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
  const { countryId, regionId } = useParams();
  const dispatch = useDispatch();
  const { formatMessage, locale } = useIntl();

  const { country, status: countryStatus } = useSelector(state => state.country);
  const { region, status: regionStatus } = useSelector(state => state.regionDetails);
  const [countyValue, setCountyValue] = useState(null);

  useEffect(() => {
    if (countryId) dispatch(fetchCountry(countryId));
    if (regionId && countryId) dispatch(fetchRegion(countryId, regionId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryId, regionId]);

  useEffect(() => {
    if (!regionId || !region || !country) return;
    setCountyValue(null);
    fetchFieldSearch({
      entity: ADVANCED_SEARCH_TYPES.ENTRANCES,
      field: 'county',
      query: region.name,
      filter: { country: country.nativeName }
    })
      .then(r => setCountyValue(r?.hits?.[0]?.[0] ?? null))
      .catch(() => setCountyValue(null));
  }, [region, country, regionId]);

  let initialFilter = {};
  let lockedFilter = [];
  let searchKey = 'open';
  let pageTitle = formatMessage({ id: 'Entrances' });

  const countryReady = countryStatus === REDUCER_STATUS.SUCCEEDED && country;
  if (countryReady) {
    const flag = getFlagEmoji(country.id);
    const label = formatMessage({ id: 'Entrances' });
    const localizedCountry = getLocalizedCountryName(country.id, locale, country.nativeName);

    if (regionId && regionStatus === REDUCER_STATUS.SUCCEEDED && region && countyValue) {
      initialFilter = { country: country.nativeName, county: countyValue };
      lockedFilter = ['country', 'county'];
      searchKey = `${country.nativeName}|${countyValue}`;
      pageTitle = `${flag} ${label} - ${localizedCountry} - ${region.name}`;
    } else if (!regionId) {
      initialFilter = { country: country.nativeName };
      lockedFilter = ['country'];
      searchKey = country.nativeName;
      pageTitle = `${flag} ${label} - ${localizedCountry}`;
    }
  }

  if (countryId && searchKey === 'open') return null;

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
