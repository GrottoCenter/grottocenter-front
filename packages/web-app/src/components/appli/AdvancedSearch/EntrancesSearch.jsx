import React, { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';

import { useIntl } from 'react-intl';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import {
  fetchAdvancedSearchResults,
  resetAdvancedSearchResults
} from '../../../actions/Advancedsearch';
import SearchInput from '../../common/SearchInput';

import useSearchFilter from '../../../hooks/useSearchFilter';
import {
  ActiveFilterChips,
  SearchForm,
  SearchFieldset,
  SearchFormContainer,
  SearchText,
  SearchTextAutocomplete,
  SearchSlider,
  SearchBooleanToggle,
  SearchDivingTypes,
  SearchMatchAllFieldsToogle,
  SearchActionButtons,
  SearchFilterAccordion,
  countActiveFilters
} from './SearchElements';
import { ADVANCED_SEARCH_TYPES } from '../../../conf/config';
import { getStoredRowsPerPage } from '../../common/EntityTable';
import CustomIcon from '../../common/CustomIcon';

const lengthMarks = [
  { value: 0, scaledValue: 0, label: '0' },
  { value: 20, scaledValue: 100, label: '100' },
  { value: 40, scaledValue: 1000, label: '1k' },
  { value: 60, scaledValue: 10000, label: '10k' },
  { value: 80, scaledValue: 100000, label: '100k' },
  { value: 100, scaledValue: 700000, label: '700k' }
];

const depthMarks = [
  { value: 0, scaledValue: 0, label: '0' },
  { value: 25, scaledValue: 50, label: '50' },
  { value: 50, scaledValue: 500, label: '500' },
  { value: 75, scaledValue: 1000, label: '1k' },
  { value: 100, scaledValue: 3000, label: '3k' }
];

const FILTER_LABELS = {
  city: 'City',
  county: 'County',
  country: 'Country',
  // iso3166 is the ISO 3166-2 subdivision code used as a locked filter when navigating from a
  // country/region page. It maps to the same "Region" label as the freeform `region` field.
  iso3166: 'Region',
  'massifs.id': 'Massif',
  'massifs.name': 'Massif',
  region: 'Region',
  'cave.name': 'Network name',
  'commentsRating.approach': 'Ease of reach',
  'commentsRating.caving': 'Ease of move',
  'commentsRating.aestheticism': 'Aesthetic',
  'cave.depth': 'Depth',
  'cave.length': 'Length',
  'cave.isDiving': 'Diving cave',
  isTouristic: 'Touristic site',
  dangerPollution: 'Pollution risk',
  dataQuality: 'Data quality'
};

const initialFilterState = {
  country: '',
  // iso3166 is never shown as a UI input (no SearchTextAutocomplete for it); it is only used as a
  // locked filter injected via initialFilter when navigating from a country/region page.
  iso3166: '',
  region: '',
  county: '',
  'massifs.id': null,
  'massifs.name': '',
  city: '',
  // postalCode is intentionally absent: the entrances API endpoint does not support postal code filtering
  'commentsRating.approach': null,
  'commentsRating.caving': null,
  'commentsRating.aestheticism': null,
  'cave.name': '',
  'cave.depth': null,
  'cave.length': null,
  'cave.isDiving': null,
  isTouristic: null,
  dangerPollution: null,
  dataQuality: null
};

const EntrancesSearch = ({
  initialFilter = {},
  lockedFilter = [],
  valueLabels = {}
}) => {
  const dispatch = useDispatch();

  const mergedInitialState = useMemo(
    () => ({ ...initialFilterState, ...initialFilter }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { filterState, updateFilter, handleRemoveFilter, resetFilter } =
    useSearchFilter(mergedInitialState, lockedFilter);
  const [query, setQuery] = useState('');
  const [matchAllFields, setMatchAllFields] = useState(true);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const searchEntity = ADVANCED_SEARCH_TYPES.ENTRANCES;

  const startAdvancedsearch = (
    overrideQuery,
    overrideFilter,
    overrideMatchAll
  ) =>
    dispatch(
      fetchAdvancedSearchResults({
        entity: searchEntity,
        query: overrideQuery !== undefined ? overrideQuery : query,
        filter: overrideFilter !== undefined ? overrideFilter : filterState,
        matchAllFields:
          overrideMatchAll !== undefined ? overrideMatchAll : matchAllFields,
        size: getStoredRowsPerPage()
      })
    );

  const { formatMessage } = useIntl();

  const filterableKeys = [
    'country',
    'region',
    'county',
    'massifs.name',
    'city',
    'cave.name',
    'commentsRating.approach',
    'commentsRating.caving',
    'commentsRating.aestheticism',
    'isTouristic',
    'dangerPollution',
    'cave.isDiving',
    'cave.depth',
    'cave.length',
    'dataQuality'
  ].filter(k => !lockedFilter.includes(k));

  const advancedFilterCount = countActiveFilters(filterState, filterableKeys);

  return (
    <SearchForm onSubmit={() => startAdvancedsearch()}>
      <SearchInput
        onChange={e => setQuery(e)}
        value={query}
        placeholder={formatMessage({ id: 'Entrance name' })}
      />

      <SearchFilterAccordion
        filterCount={advancedFilterCount}
        expanded={advancedExpanded}
        onExpandedChange={setAdvancedExpanded}>
        <SearchFieldset
          title="Localization"
          containerSx={{ justifyContent: 'flex-start' }}>
          {!lockedFilter.includes('country') && (
            <SearchTextAutocomplete
              ressourceType={searchEntity}
              ressourceField="country"
              ressourceFilter={matchAllFields ? filterState : {}}
              label="Country"
              onChange={e => updateFilter('country', e)}
              value={filterState.country}
            />
          )}
          {!lockedFilter.includes('massifs.name') &&
            !lockedFilter.includes('massifs.id') && (
              <SearchTextAutocomplete
                ressourceType={searchEntity}
                ressourceField="massifs.name"
                ressourceFilter={matchAllFields ? filterState : {}}
                label="Massif"
                onChange={e => updateFilter('massifs.name', e)}
                value={filterState['massifs.name']}
              />
            )}
          {/* Hide the Region field when iso3166 is locked: the subdivision is already fixed via the
              ISO code, so the freeform region autocomplete would be redundant and confusing. */}
          {!lockedFilter.includes('region') &&
            !lockedFilter.includes('county') &&
            !lockedFilter.includes('iso3166') && (
              <SearchTextAutocomplete
                ressourceType={searchEntity}
                ressourceField="region"
                ressourceFilter={matchAllFields ? filterState : {}}
                label="Region"
                onChange={e => updateFilter('region', e)}
                value={filterState.region}
              />
            )}
          {!lockedFilter.includes('county') && (
            <SearchTextAutocomplete
              ressourceType={searchEntity}
              ressourceField="county"
              ressourceFilter={matchAllFields ? filterState : {}}
              label="County"
              onChange={e => updateFilter('county', e)}
              value={filterState.county}
            />
          )}
          <SearchTextAutocomplete
            ressourceType={searchEntity}
            ressourceField="city"
            ressourceFilter={matchAllFields ? filterState : {}}
            label="City"
            onChange={e => updateFilter('city', e)}
            value={filterState.city}
          />
        </SearchFieldset>

        <SearchFieldset
          title="Network"
          containerSx={{ justifyContent: 'flex-start' }}>
          <SearchText
            startIcon={<CustomIcon type="network" size={24} />}
            label="Network name"
            onChange={e => updateFilter('cave.name', e)}
            value={filterState['cave.name']}
          />
        </SearchFieldset>

        <SearchFieldset title="Rating criterias">
          <SearchSlider
            label={formatMessage({ id: 'Ease of reach' })}
            value={filterState['commentsRating.approach']}
            onChange={e => updateFilter('commentsRating.approach', e)}
          />
          <SearchSlider
            label={formatMessage({ id: 'Ease of move' })}
            value={filterState['commentsRating.caving']}
            onChange={e => updateFilter('commentsRating.caving', e)}
          />
          <SearchSlider
            label={formatMessage({ id: 'Aesthetic' })}
            value={filterState['commentsRating.aestheticism']}
            onChange={e => updateFilter('commentsRating.aestheticism', e)}
          />
        </SearchFieldset>

        <SearchFieldset title="Characteristics" isMultiline>
          <SearchFormContainer>
            <SearchSlider
              icon={<CustomIcon type="depth" size={24} />}
              label={`${formatMessage({ id: 'Depth' })} (${formatMessage({ id: 'meters' })})`}
              value={filterState['cave.depth']}
              marks={depthMarks}
              onChange={e => updateFilter('cave.depth', e)}
            />
            <SearchSlider
              icon={<CustomIcon type="length" size={24} />}
              label={`${formatMessage({ id: 'Development' })} (${formatMessage({ id: 'meters' })})`}
              value={filterState['cave.length']}
              marks={lengthMarks}
              onChange={e => updateFilter('cave.length', e)}
            />
            <SearchSlider
              icon={<DataUsageIcon color="primary" sx={{ fontSize: 24 }} />}
              label={formatMessage({ id: 'Data quality' })}
              value={filterState.dataQuality}
              min={0}
              max={100}
              onChange={e => updateFilter('dataQuality', e)}
            />
          </SearchFormContainer>
          <SearchFormContainer style={{ marginTop: '16px' }}>
            <SearchBooleanToggle
              icon={<CustomIcon type="touristic" size={24} />}
              label="Touristic site"
              onChange={e => updateFilter('isTouristic', e)}
              value={filterState.isTouristic}
            />
            <SearchBooleanToggle
              icon={<CustomIcon type="pollution" size={24} />}
              label="Pollution risk"
              onChange={e => updateFilter('dangerPollution', e)}
              value={filterState.dangerPollution}
            />
            <SearchDivingTypes
              icon={<CustomIcon type="diving_cave" size={24} />}
              onChange={e => updateFilter('cave.isDiving', e)}
              value={filterState['cave.isDiving']}
            />
          </SearchFormContainer>
        </SearchFieldset>

        <SearchMatchAllFieldsToogle
          isChecked={matchAllFields}
          onChange={e => setMatchAllFields(e)}
        />
      </SearchFilterAccordion>

      <ActiveFilterChips
        filterState={filterState}
        query={query}
        queryLabel="Entrance name"
        onRemoveFilter={handleRemoveFilter}
        onClearQuery={() => setQuery('')}
        labelMap={FILTER_LABELS}
        lockedKeys={lockedFilter}
        valueLabels={valueLabels}
      />

      <SearchActionButtons
        showReset={query !== '' || advancedFilterCount > 0}
        onReset={() => {
          setQuery('');
          setMatchAllFields(true);
          resetFilter();
          setAdvancedExpanded(false);
          dispatch(resetAdvancedSearchResults());
          // Override params are required: React state updates from the calls above are async,
          // so filterState/query/matchAllFields still hold stale values at this point.
          startAdvancedsearch('', mergedInitialState, true);
        }}
      />
    </SearchForm>
  );
};

EntrancesSearch.propTypes = {
  initialFilter: PropTypes.shape({}),
  lockedFilter: PropTypes.arrayOf(PropTypes.string),
  valueLabels: PropTypes.shape({})
};

export default EntrancesSearch;
