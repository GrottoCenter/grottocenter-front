import { useState } from 'react';
import { useIntl } from 'react-intl';
import {
  getOrganizationTypeLabelId,
  ORGANIZATION_TYPE_VALUES
} from '@/utils/organizationTypes';
import EntityTypeFilter from './EntityTypeFilter';

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
  type: 'organizationType.label',
  city: 'City',
  county: 'County',
  country: 'Country',
  postalCode: 'Postal code',
  region: 'Region'
};

const initialFilterState = {
  type: '',
  city: '',
  county: '',
  country: '',
  postalCode: '',
  region: ''
};

const TYPE_OPTIONS = [
  { value: '', labelId: 'All' },
  ...ORGANIZATION_TYPE_VALUES.map(type => ({
    value: type,
    labelId: getOrganizationTypeLabelId(type)
  }))
];

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
  ) => {
    const { type, ...otherFilters } = overrideFilter ?? filterState;
    startAdvancedSearch({
      entity: searchEntity,
      query: overrideQuery !== undefined ? overrideQuery : query,
      filter: type ? { ...otherFilters, type } : otherFilters,
      matchAllFields:
        overrideMatchAll !== undefined ? overrideMatchAll : matchAllFields,
      size: getStoredRowsPerPage()
    });
  };

  const handleTypeChange = type => {
    updateFilter('type', type);
    startAdvancedsearch(undefined, { ...filterState, type });
  };

  const { type: organizationType, ...locationFilters } = filterState;
  const effectiveFilter = organizationType ? filterState : locationFilters;
  const advancedFilterCount = countActiveFilters(locationFilters);
  const hasClearableFilters =
    query !== '' || advancedFilterCount > 0 || !!organizationType;

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

      <SearchFieldset title="Type">
        <EntityTypeFilter
          options={TYPE_OPTIONS}
          value={filterState.type}
          onChange={handleTypeChange}
        />
      </SearchFieldset>

      <SearchFilterAccordion
        filterCount={advancedFilterCount}
        expanded={advancedExpanded}
        onExpandedChange={setAdvancedExpanded}>
        <SearchFieldset title="Localization">
          <SearchTextAutocomplete
            ressourceType={searchEntity}
            ressourceField="country"
            ressourceFilter={matchAllFields ? effectiveFilter : {}}
            label="Country"
            onChange={e => updateFilter('country', e)}
            value={filterState.country}
          />
          <SearchTextAutocomplete
            ressourceType={searchEntity}
            ressourceField="region"
            ressourceFilter={matchAllFields ? effectiveFilter : {}}
            label="Region"
            onChange={e => updateFilter('region', e)}
            value={filterState.region}
          />
          <SearchTextAutocomplete
            ressourceType={searchEntity}
            ressourceField="county"
            ressourceFilter={matchAllFields ? effectiveFilter : {}}
            label="County"
            onChange={e => updateFilter('county', e)}
            value={filterState.county}
          />
          <SearchTextAutocomplete
            ressourceType={searchEntity}
            ressourceField="postalCode"
            ressourceFilter={matchAllFields ? effectiveFilter : {}}
            label="Postal code"
            onChange={e => updateFilter('postalCode', e)}
            value={filterState.postalCode}
          />
          <SearchTextAutocomplete
            ressourceType={searchEntity}
            ressourceField="city"
            ressourceFilter={matchAllFields ? effectiveFilter : {}}
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
        onRemoveFilter={key => {
          if (key === 'type') handleTypeChange('');
          else handleRemoveFilter(key);
        }}
        onClearQuery={() => setQuery('')}
        onClearAll={hasClearableFilters ? handleClearAll : undefined}
        labelMap={FILTER_LABELS}
        valueLabels={{
          type: formatMessage({
            id: getOrganizationTypeLabelId(filterState.type)
          })
        }}
      />
      <SearchActionButtons />
    </SearchForm>
  );
};

export default OrganizationsSearch;
