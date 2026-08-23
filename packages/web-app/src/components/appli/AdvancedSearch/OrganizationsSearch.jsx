import { useState } from 'react';
import { useIntl } from 'react-intl';

import { startAdvancedSearch, resetAdvancedSearch } from '../../../hooks';
import useSearchFilter from '../../../hooks/useSearchFilter';
import {
  ActiveFilterChips,
  SearchForm,
  SearchFieldset,
  SearchTextAutocomplete,
  SearchMatchAllFieldsToogle,
  SearchActionButtons,
  SearchFilterAccordion,
  countActiveFilters
} from './SearchElements';
import SearchInput from '../../common/SearchInput';
import { ADVANCED_SEARCH_TYPES } from '../../../conf/config';
import { getStoredRowsPerPage } from '../../common/EntityTable';

const FILTER_LABELS = {
  city: 'City',
  county: 'County',
  country: 'Country',
  postalCode: 'Postal code',
  region: 'Region'
};

const initialFilterState = {
  city: '',
  county: '',
  country: '',
  postalCode: '',
  region: ''
};

const OrganizationsSearch = () => {
  const { formatMessage } = useIntl();
  const { filterState, updateFilter, handleRemoveFilter, resetFilter } =
    useSearchFilter(initialFilterState);
  const [query, setQuery] = useState('');
  const [matchAllFields, setMatchAllFields] = useState(true);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const searchEntity = ADVANCED_SEARCH_TYPES.ORGANIZATIONS;

  const startAdvancedsearch = (
    overrideQuery,
    overrideFilter,
    overrideMatchAll
  ) =>
    startAdvancedSearch({
      entity: searchEntity,
      query: overrideQuery !== undefined ? overrideQuery : query,
      filter: overrideFilter !== undefined ? overrideFilter : filterState,
      matchAllFields:
        overrideMatchAll !== undefined ? overrideMatchAll : matchAllFields,
      size: getStoredRowsPerPage()
    });

  const advancedFilterCount = countActiveFilters(filterState);
  const hasClearableFilters = query !== '' || advancedFilterCount > 0;

  const handleClearAll = () => {
    setQuery('');
    setMatchAllFields(true);
    resetFilter();
    setAdvancedExpanded(false);
    resetAdvancedSearch();
    // Override params are required: React state updates from the calls above are async,
    // so filterState/query/matchAllFields still hold stale values at this point.
    startAdvancedsearch('', initialFilterState, true);
  };

  return (
    <SearchForm onSubmit={() => startAdvancedsearch()}>
      <SearchInput
        onChange={e => setQuery(e)}
        value={query}
        placeholder={formatMessage({ id: 'Organization name' })}
      />

      <SearchFilterAccordion
        filterCount={advancedFilterCount}
        expanded={advancedExpanded}
        onExpandedChange={setAdvancedExpanded}>
        <SearchFieldset title="Localization">
          <SearchTextAutocomplete
            ressourceType={searchEntity}
            ressourceField="country"
            ressourceFilter={matchAllFields ? filterState : {}}
            label="Country"
            onChange={e => updateFilter('country', e)}
            value={filterState.country}
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
            ressourceField="county"
            ressourceFilter={matchAllFields ? filterState : {}}
            label="County"
            onChange={e => updateFilter('county', e)}
            value={filterState.county}
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
            ressourceField="city"
            ressourceFilter={matchAllFields ? filterState : {}}
            label="City"
            onChange={e => updateFilter('city', e)}
            value={filterState.city}
          />
        </SearchFieldset>

        <SearchMatchAllFieldsToogle
          isChecked={matchAllFields}
          onChange={e => setMatchAllFields(e)}
        />
      </SearchFilterAccordion>

      <ActiveFilterChips
        filterState={filterState}
        query={query}
        queryLabel="Organization name"
        onRemoveFilter={handleRemoveFilter}
        onClearQuery={() => setQuery('')}
        onClearAll={hasClearableFilters ? handleClearAll : undefined}
        labelMap={FILTER_LABELS}
      />
      <SearchActionButtons />
    </SearchForm>
  );
};

export default OrganizationsSearch;
