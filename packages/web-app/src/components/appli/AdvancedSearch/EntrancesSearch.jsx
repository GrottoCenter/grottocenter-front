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
  SearchSlider,
  SearchBooleanToggle,
  SearchDivingTypes,
  SearchMatchAllFieldsToogle,
  SearchActionButtons
} from './SearchElements';
import { ADVANCED_SEARCH_TYPES } from '../../../conf/config';
import { getStoredRowsPerPage } from '../../common/EntityTable/EntityTable';

const lengthMarks = [
  {
    value: 0,
    scaledValue: 0,
    label: '0'
  },
  {
    value: 20,
    scaledValue: 100,
    label: '100'
  },
  {
    value: 40,
    scaledValue: 1000,
    label: '1k'
  },
  {
    value: 60,
    scaledValue: 10000,
    label: '10k'
  },
  {
    value: 80,
    scaledValue: 100000,
    label: '100k'
  },
  {
    value: 100,
    scaledValue: 700000,
    label: '700k'
  }
];

const depthMarks = [
  {
    value: 0,
    scaledValue: 0,
    label: '0'
  },
  {
    value: 25,
    scaledValue: 50,
    label: '50'
  },
  {
    value: 50,
    scaledValue: 500,
    label: '500'
  },
  {
    value: 75,
    scaledValue: 1000,
    label: '1000'
  },
  {
    value: 100,
    scaledValue: 3000,
    label: '3000'
  }
];

const initialFilterState = {
  city: '',
  county: '',
  country: '',
  postalCode: '',
  region: '',
  'commentsRating.approach': null,
  'commentsRating.caving': null,
  'commentsRating.aestheticism': null,
  'cave.name': '',
  'cave.depth': null,
  'cave.length': null,
  'cave.isDiving': null,
  isTouristic: null,
  dangerPollution: null
};

const EntrancesSearch = () => {
  const dispatch = useDispatch();
  const [filterState, setFilterState] = useState(initialFilterState);
  const [query, setQuery] = useState('');
  const [matchAllFields, setMatchAllFields] = useState(true);
  const searchEntity = ADVANCED_SEARCH_TYPES.ENTRANCES;

  const startAdvancedsearch = () =>
    dispatch(
      fetchAdvancedSearchResults({
        entity: searchEntity,
        query,
        filter: filterState,
        matchAllFields,
        size: getStoredRowsPerPage()
      })
    );

  const updateFilter = (key, value) =>
    setFilterState({ ...filterState, [key]: value });

  return (
    <SearchForm
      title="Entrance properties"
      onSubmit={() => startAdvancedsearch()}>
      <SearchFormContainer style={{ justifyContent: 'flex-start' }}>
        <SearchText
          label="Entrance name"
          onChange={e => setQuery(e)}
          value={query}
        />
      </SearchFormContainer>

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
          ressourceField="city"
          ressourceFilter={matchAllFields ? filterState : {}}
          label="City"
          onChange={e => updateFilter('city', e)}
          value={filterState.city}
        />
      </SearchFieldset>

      <SearchFieldset title="Rating criterias">
        <SearchSlider
          label="Ease of reach"
          onChange={e => updateFilter('commentsRating.approach', e)}
        />
        <SearchSlider
          label="Ease of move"
          onChange={e => updateFilter('commentsRating.caving', e)}
        />
        <SearchSlider
          label="Aesthetic"
          onChange={e => updateFilter('commentsRating.aestheticism', e)}
        />
      </SearchFieldset>

      <SearchFieldset title="Entrance properties">
        <SearchBooleanToggle
          label="Touristic site"
          onChange={e => updateFilter('isTouristic', e)}
          value={filterState.isTouristic}
        />
        <SearchBooleanToggle
          label="Pollution risk"
          onChange={e => updateFilter('dangerPollution', e)}
          value={filterState.dangerPollution}
        />
      </SearchFieldset>

      <SearchFieldset title="Network properties">
        <SearchText
          label="Network name"
          onChange={e => updateFilter('cave.name', e)}
          value={filterState['cave.name']}
        />

        <SearchDivingTypes
          onChange={e => updateFilter('cave.isDiving', e)}
          value={filterState['cave.isDiving']}
        />

        <SearchSlider
          label="Depth"
          helperText="In meters"
          marks={depthMarks}
          onChange={e => updateFilter('cave.depth', e)}
        />
        <SearchSlider
          label="Length"
          helperText="In meters"
          marks={lengthMarks}
          onChange={e => updateFilter('cave.length', e)}
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

export default EntrancesSearch;
