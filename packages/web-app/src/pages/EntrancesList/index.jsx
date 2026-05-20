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
import CustomIcon from '../../components/common/CustomIcon';
import EntranceBadgeIcon from './EntranceBadgeIcon';
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

  const { country, status: countryStatus } = useSelector(
    state => state.country
  );
  const { region, status: regionStatus } = useSelector(
    state => state.regionDetails
  );
  const { massif, isFetching: massifFetching } = useSelector(
    state => state.massif
  );
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
    if (!massifId || !massif) return;
    let cancelled = false;
    setMassifValue(undefined);
    fetchFieldSearch({
      entity: ADVANCED_SEARCH_TYPES.ENTRANCES,
      field: 'massifs.name',
      query: massif.name,
      filter: {}
    })
      .then(r => { if (!cancelled) setMassifValue(r?.hits?.[0]?.[0] ?? null); })
      .catch(() => { if (!cancelled) setMassifValue(null); });
    return () => { cancelled = true; };
  }, [massif, massifId]);

  let initialFilter = {};
  let lockedFilter = [];
  let searchKey = 'open';
  let pageIcon;
  let valueLabels = {};
  const label = formatMessage({ id: 'Entrances' });
  let pageTitle = label;

  if (massifId && massif && !massifFetching && massifValue !== undefined) {
    const resolvedMassif = massifValue ?? massif.name;
    initialFilter = { 'massifs.name': resolvedMassif };
    lockedFilter = ['massifs.name'];
    searchKey = resolvedMassif;
    pageTitle = `${label} - ${massif.name}`;
    pageIcon = (
      <EntranceBadgeIcon badge={<CustomIcon type="massif" size={16} />} />
    );
  }

  const countryReady = countryStatus === REDUCER_STATUS.SUCCEEDED && country;
  if (countryReady) {
    const flag = getFlagEmoji(country.id);
    const localizedCountry = getLocalizedCountryName(
      country.id,
      locale,
      country.nativeName
    );
    // Typesense stores country as "ISO_CODE - native_name" (e.g. "FR - France").
    // Using only nativeName would not match the facet value exactly.
    const countryTypesenseValue = `${country.id} - ${country.nativeName}`;

    if (regionId && regionStatus === REDUCER_STATUS.SUCCEEDED && region) {
      // region.id is the ISO 3166-2 code built by the API as "${countryId}-${regionId}"
      // (e.g. "FR-01" for Ain, "MX-YUC" for Yucatán). This matches the `iso3166` Typesense
      // field populated by Nominatim reverse-geocoding, regardless of the country's admin level.
      // Using iso3166 instead of the freeform `county`/`region` fields avoids mismatches where
      // the region entity corresponds to different admin levels across countries.
      initialFilter = {
        country: countryTypesenseValue,
        iso3166: region.id
      };
      lockedFilter = ['country', 'iso3166'];
      searchKey = `${countryTypesenseValue}|${region.id}`;
      pageTitle = `${label} - ${localizedCountry} - ${region.name}`;
      pageIcon = <EntranceBadgeIcon badge={flag} />;
      // iso3166 stores the raw ISO code (e.g. "FR-01"); display the human-readable name instead.
      valueLabels = { iso3166: region.name };
    } else if (!regionId) {
      initialFilter = { country: countryTypesenseValue };
      lockedFilter = ['country'];
      searchKey = countryTypesenseValue;
      pageTitle = `${label} - ${localizedCountry}`;
      pageIcon = <EntranceBadgeIcon badge={flag} />;
    }
  }

  if (searchKey === 'open' && (countryId || massifId)) return null;

  return (
    <EntitySearchPage
      title={pageTitle}
      icon={pageIcon}
      entityType="entrances"
      initialFilter={initialFilter}>
      <EntrancesSearch
        key={searchKey}
        initialFilter={initialFilter}
        lockedFilter={lockedFilter}
        valueLabels={valueLabels}
      />
    </EntitySearchPage>
  );
};

export default EntrancesListPage;
