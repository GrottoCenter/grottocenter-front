import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  fetchAdvancedSearchResults,
  resetAdvancedSearchResults
} from '../../../actions/Advancedsearch';
import {
  SearchForm,
  SearchFormContainer,
  SearchFieldset,
  SearchText,
  SearchTextAutocomplete,
  SearchMatchAllFieldsToogle,
  SearchActionButtons
} from './SearchElements';
import { ADVANCED_SEARCH_TYPES } from '../../../conf/config';

const initialFilterState = {
  city: '',
  county: '',
  country: '',
  postalCode: '',
  region: ''
};

const OrganizationsSearch = () => {
  const dispatch = useDispatch();
  const [filterState, setFilterState] = useState(initialFilterState);
  const [query, setQuery] = useState('');
  const [matchAllFields, setMatchAllFields] = useState(true);
  const searchEntity = ADVANCED_SEARCH_TYPES.ORGANIZATIONS;

  const startAdvancedsearch = () =>
    dispatch(
      fetchAdvancedSearchResults({
        entity: searchEntity,
        query,
        filter: filterState,
        matchAllFields
      })
    );

  const updateFilter = (key, value) =>
    setFilterState({ ...filterState, [key]: value });

  return (
    <SearchForm
      title="Organization properties"
      onSubmit={() => startAdvancedsearch()}>
      <SearchFormContainer style={{ justifyContent: 'flex-start' }}>
        <SearchText
          label="Organization name"
          onChange={e => setQuery(e)}
          value={query}
        />
      </SearchFormContainer>

      <SearchFieldset title="Localization">
        <SearchTextAutocomplete
          ressourceType={searchEntity}
          ressourceField="city"
          ressourceFilter={matchAllFields ? filterState : {}}
          label="City"
          onChange={e => updateFilter('city', e)}
          value={filterState.city}
        />
        <SearchTextAutocomplete
          ressourceType={searchEntity}
          ressourceField="postalCode"
          ressourceFilter={matchAllFields ? filterState : {}}
          label="Postal code"
          onChange={e => updateFilter('postalCode', e)}
          value={filterState.postalCode}
        />
        <SearchTextAutocomplete
          ressourceType={searchEntity}
          ressourceField="county"
          ressourceFilter={matchAllFields ? filterState : {}}
          label="County"
          onChange={e => updateFilter('county', e)}
          value={filterState.county}
        />
        <SearchTextAutocomplete
          ressourceType={searchEntity}
          ressourceField="region"
          ressourceFilter={matchAllFields ? filterState : {}}
          label="Region"
          onChange={e => updateFilter('region', e)}
          value={filterState.region}
        />
        <SearchTextAutocomplete
          ressourceType={searchEntity}
          ressourceField="country"
          ressourceFilter={matchAllFields ? filterState : {}}
          label="Country"
          onChange={e => updateFilter('country', e)}
          value={filterState.country}
        />
      </SearchFieldset>

      <SearchFormContainer style={{ justifyContent: 'flex-start' }}>
        <SearchMatchAllFieldsToogle
          isChecked={matchAllFields}
          onChange={e => setMatchAllFields(e)}
        />
      </SearchFormContainer>

      <SearchActionButtons
        onReset={() => {
          dispatch(resetAdvancedSearchResults());
          setQuery('');
          setMatchAllFields(true);
          setFilterState(initialFilterState);
        }}
      />
    </SearchForm>
  );
};

export default OrganizationsSearch;
