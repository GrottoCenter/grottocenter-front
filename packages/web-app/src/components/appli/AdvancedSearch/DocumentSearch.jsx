import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box } from '@mui/material';
import {
  fetchAdvancedSearchResults,
  resetAdvancedSearchResults
} from '../../../actions/Advancedsearch';
import { loadDocumentTypes } from '../../../actions/DocumentType';
import { loadSubjects } from '../../../actions/Subject';
import {
  DOCUMENT_TYPE_ICONS,
  DOCUMENT_TYPE_FALLBACK_ICON
} from '../../../hooks/documentTypeHelpers';
import {
  SUBJECT_DEPTH_STYLES,
  getSubjectCode,
  sortSubjects
} from '../../../hooks/subjectHelpers';
import Translate from '../../common/Translate';

import useSearchFilter from '../../../hooks/useSearchFilter';
import {
  ActiveFilterChips,
  SearchForm,
  SearchFormContainer,
  SearchFieldset,
  SearchText,
  SearchNumberText,
  SearchTextAutocomplete,
  SearchSelect,
  SearchMatchAllFieldsToogle,
  SearchActionButtons,
  SearchFilterAccordion,
  countActiveFilters
} from './SearchElements';
import SearchInput from '../../common/SearchInput';
import { ADVANCED_SEARCH_TYPES } from '../../../conf/config';
import { getStoredRowsPerPage } from '../../common/EntityTable/EntityTable';

const FILTER_LABELS = {
  title: 'Title',
  description: 'Description',
  type: 'Document type',
  'subjects.code': 'Subjects',
  identifierType: 'Identifier type',
  identifier: 'Identifier',
  importSource: 'Source',
  importId: 'Source ID',
  datePublication: 'Publication date',
  'iso3166.iso': 'Country / Region',
  license: 'License',
  pages: 'Pages',
  'authors.nickname': 'Author',
  'editor.name': 'Editor',
  'library.name': 'Library',
  issue: 'Issue',
  'parent.title': 'Parent',
  'cave.name': 'Network name',
  'entrances.name': 'Entrance',
  'massifs.name': 'Massif'
};

// Fields whose stored value is itself a translation key (e.g. document type name, subject code)
const TRANSLATABLE_VALUE_FIELDS = new Set(['type', 'subjects.code']);

const initialFilterState = {
  title: '',
  description: '',
  type: '',
  'subjects.code': '',
  identifierType: '',
  identifier: '',
  importSource: '',
  importId: '',
  datePublication: '',
  'iso3166.iso': '',
  license: '',
  pages: '',
  'authors.nickname': '',
  'editor.name': '',
  'library.name': '',
  issue: '',
  'parent.title': '',
  'cave.name': '',
  'entrances.name': '',
  'massifs.name': ''
};

const SubjectEntry = ({ subject }) => {
  const { formatMessage } = useIntl();
  const code = getSubjectCode(subject);
  const depth = code.split('.').length - 1;
  return (
    <Box sx={SUBJECT_DEPTH_STYLES[Math.min(depth, 3)]}>
      {code}&nbsp;&nbsp;
      {formatMessage({ id: code, defaultMessage: subject.subject })}
    </Box>
  );
};
SubjectEntry.propTypes = {
  subject: PropTypes.shape({
    code: PropTypes.string,
    subject: PropTypes.string
  })
};

const DocumentSearch = () => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const { filterState, updateFilter, handleRemoveFilter, resetFilter } =
    useSearchFilter(initialFilterState);
  const [query, setQuery] = useState('');
  const [matchAllFields, setMatchAllFields] = useState(true);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const searchEntity = ADVANCED_SEARCH_TYPES.DOCUMENTS;

  const documentTypes = useSelector(state => state.documentType.documentTypes);
  const subjects = useSelector(state => state.subject.subjects);

  useEffect(() => {
    dispatch(loadDocumentTypes());
    dispatch(loadSubjects());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const advancedFilterCount = countActiveFilters(filterState, [
    'identifierType', 'identifier', 'importSource', 'importId',
    'datePublication', 'iso3166.iso', 'license', 'pages',
    'authors.nickname', 'editor.name', 'library.name', 'issue',
    'parent.title', 'cave.name', 'entrances.name', 'massifs.name'
  ]);

  return (
    <SearchForm onSubmit={() => startAdvancedsearch()}>
      <SearchInput
        onChange={e => setQuery(e)}
        value={query}
        placeholder={formatMessage({ id: 'Search for a document...' })}
      />

      <SearchFieldset title="Content">
        <SearchText
          label="Title"
          onChange={e => updateFilter('title', e)}
          value={filterState.title}
        />
        <SearchText
          label="Description"
          onChange={e => updateFilter('description', e)}
          value={filterState.description}
        />
        <SearchSelect
          label="Document type"
          optionDescription="All document types"
          options={documentTypes
            .filter(e => e.isAvailable)
            .map(e => {
              const Icon =
                DOCUMENT_TYPE_ICONS[e.name] ?? DOCUMENT_TYPE_FALLBACK_ICON;
              return [
                e.name,
                <Box
                  key={e.name}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Icon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Translate>{e.name}</Translate>
                </Box>
              ];
            })}
          onChange={e => updateFilter('type', e)}
          value={filterState.type}
        />
        <SearchSelect
          label="Subjects"
          optionDescription="All subjects"
          options={sortSubjects(subjects).map(e => [
            e.code,
            <SubjectEntry key={e.code} subject={e} />
          ])}
          onChange={e => updateFilter('subjects.code', e)}
          value={filterState['subjects.code']}
        />
      </SearchFieldset>

      <SearchFilterAccordion
        filterCount={advancedFilterCount}
        expanded={advancedExpanded}
        onExpandedChange={setAdvancedExpanded}>
        <SearchFieldset title="Attributes" isMultiline>
          <SearchFormContainer>
            <SearchTextAutocomplete
              ressourceType={searchEntity}
              ressourceField="identifierType"
              ressourceFilter={matchAllFields ? filterState : {}}
              label="Identifier type"
              onChange={e => updateFilter('identifierType', e)}
              value={filterState.identifierType}
            />
            <SearchText
              label="Identifier"
              onChange={e => updateFilter('identifier', e)}
              value={filterState.identifier}
            />
            <SearchTextAutocomplete
              ressourceType={searchEntity}
              ressourceField="importSource"
              ressourceFilter={matchAllFields ? filterState : {}}
              label="Source"
              onChange={e => updateFilter('importSource', e)}
              value={filterState.importSource}
            />
            <SearchNumberText
              label="Source ID"
              onChange={e => updateFilter('importId', e)}
              value={filterState.importId}
            />
          </SearchFormContainer>
          <SearchFormContainer>
            <SearchTextAutocomplete
              ressourceType={searchEntity}
              ressourceField="datePublication"
              ressourceFilter={matchAllFields ? filterState : {}}
              label="Publication date"
              onChange={e => updateFilter('datePublication', e)}
              value={filterState.datePublication}
            />
            <SearchTextAutocomplete
              ressourceType={searchEntity}
              ressourceField="iso3166.iso"
              ressourceFilter={matchAllFields ? filterState : {}}
              label="Country / Region"
              onChange={e => updateFilter('iso3166.iso', e)}
              value={filterState['iso3166.iso']}
            />
            <SearchTextAutocomplete
              ressourceType={searchEntity}
              ressourceField="license"
              ressourceFilter={matchAllFields ? filterState : {}}
              label="License"
              onChange={e => updateFilter('license', e)}
              value={filterState.license}
            />
            <SearchNumberText
              label="Pages"
              min={1}
              onChange={e => updateFilter('pages', e)}
              value={filterState.pages}
            />
          </SearchFormContainer>
        </SearchFieldset>

        <SearchFieldset title="Contributors" containerSx={{ justifyContent: 'flex-start' }}>
          <SearchTextAutocomplete
            ressourceType={searchEntity}
            ressourceField="authors.nickname"
            ressourceFilter={matchAllFields ? filterState : {}}
            label="Author"
            onChange={e => updateFilter('authors.nickname', e)}
            value={filterState['authors.nickname']}
          />
          <SearchTextAutocomplete
            ressourceType={searchEntity}
            ressourceField="editor.name"
            ressourceFilter={matchAllFields ? filterState : {}}
            label="Editor"
            onChange={e => updateFilter('editor.name', e)}
            value={filterState['editor.name']}
          />
          <SearchTextAutocomplete
            ressourceType={searchEntity}
            ressourceField="library.name"
            ressourceFilter={matchAllFields ? filterState : {}}
            label="Library"
            onChange={e => updateFilter('library.name', e)}
            value={filterState['library.name']}
          />
        </SearchFieldset>

        <SearchFieldset title="Linked entities" isMultiline>
          <SearchFormContainer sx={{ justifyContent: 'flex-start' }}>
            <SearchTextAutocomplete
              ressourceType={searchEntity}
              ressourceField="issue"
              ressourceFilter={matchAllFields ? filterState : {}}
              label="Issue"
              onChange={e => updateFilter('issue', e)}
              value={filterState.issue}
            />
            <SearchText
              label="Parent"
              onChange={e => updateFilter('parent.title', e)}
              value={filterState['parent.title']}
            />
          </SearchFormContainer>
          <SearchFormContainer sx={{ justifyContent: 'flex-start' }}>
            <SearchText
              label="Cave"
              onChange={e => updateFilter('cave.name', e)}
              value={filterState['cave.name']}
            />
            <SearchText
              label="Entrance"
              onChange={e => updateFilter('entrances.name', e)}
              value={filterState['entrances.name']}
            />
            <SearchText
              label="Massif"
              onChange={e => updateFilter('massifs.name', e)}
              value={filterState['massifs.name']}
            />
          </SearchFormContainer>
        </SearchFieldset>

        <SearchMatchAllFieldsToogle
          isChecked={matchAllFields}
          onChange={e => setMatchAllFields(e)}
        />
      </SearchFilterAccordion>

      <SearchActionButtons
        onReset={() => {
          setQuery('');
          setMatchAllFields(true);
          resetFilter();
          setAdvancedExpanded(false);
          dispatch(resetAdvancedSearchResults());
          // Override params are required: React state updates from the calls above are async,
          // so filterState/query/matchAllFields still hold stale values at this point.
          startAdvancedsearch('', initialFilterState, true);
        }}
      />

      <ActiveFilterChips
        filterState={filterState}
        query={query}
        queryLabel="Document"
        onRemoveFilter={handleRemoveFilter}
        onClearQuery={() => setQuery('')}
        labelMap={FILTER_LABELS}
        translatableValueFields={TRANSLATABLE_VALUE_FIELDS}
      />
    </SearchForm>
  );
};

export default DocumentSearch;
