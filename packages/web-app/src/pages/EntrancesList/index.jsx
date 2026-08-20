import { useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';

import { useCountry, useMassif, useRegion } from '../../hooks';
import getLocalizedCountryName from '../../helpers/countryName';
import EntitySearchPage from '../../components/appli/AdvancedSearch/EntitySearchPage';
import EntrancesSearch from '../../components/appli/AdvancedSearch/EntrancesSearch';
import CustomIcon from '../../components/common/CustomIcon';
import EntranceBadgeIcon from './EntranceBadgeIcon';

const getFlagEmoji = iso =>
  typeof iso === 'string' && iso.length === 2
    ? [...iso.toUpperCase()]
        .map(c => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
        .join('')
    : '';

const EntrancesListPage = () => {
  const { countryId, regionId, massifId } = useParams();
  const { formatMessage, locale } = useIntl();

  const { data: country } = useCountry(countryId);
  const { data: region } = useRegion(countryId, regionId);
  const { data: massif, isPending: massifFetching } = useMassif(massifId);

  let initialFilter = {};
  let lockedFilter = [];
  let searchKey = 'open';
  let pageIcon;
  let valueLabels = {};
  const label = formatMessage({ id: 'Entrances' });
  let pageTitle = label;

  if (massifId && massif && !massifFetching) {
    initialFilter = { 'massifs.id': parseInt(massifId, 10) };
    lockedFilter = ['massifs.id'];
    searchKey = massifId;
    valueLabels = { 'massifs.id': massif.name };
    pageTitle = `${label} - ${massif.name}`;
    pageIcon = (
      <EntranceBadgeIcon badge={<CustomIcon type="massif" size={16} />} />
    );
  }

  const countryReady = Boolean(country);
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

    if (regionId && region) {
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
