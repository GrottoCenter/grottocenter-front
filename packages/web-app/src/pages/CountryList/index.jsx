import React, { useMemo } from 'react';
import countryList from 'react-select-country-list';
import CountryList from '../../components/appli/Country/CountryList';

const CountryListPage = () => {
  const getCountries = () =>
    countryList()
      .getData()
      .sort((e1, e2) => e1.label.localeCompare(e2.label))
      .map(c => ({
        iso2: c.value,
        english: c.label,
        native: countryList().native().getLabel(c.value)
      }));

  const countries = useMemo(() => getCountries(), []);

  return <CountryList countries={countries} />;
};
export default CountryListPage;
