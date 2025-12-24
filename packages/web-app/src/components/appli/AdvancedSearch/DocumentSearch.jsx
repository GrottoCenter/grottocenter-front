import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Typography } from '@mui/material';

import {
  fetchAdvancedSearchResults,
  resetAdvancedSearchResults
} from '../../../actions/Advancedsearch';
import { loadDocumentTypes } from '../../../actions/DocumentType';
import { loadSubjects } from '../../../actions/Subject';

import {
  SearchForm,
  SearchFormContainer,
  SearchFieldset,
  SearchText,
  SearchTextAutocomplete,
  SearchSelect,
  SearchMatchAllFieldsToogle,
  SearchActionButtons
} from './SearchElements';
import { ADVANCED_SEARCH_TYPES } from '../../../conf/config';
import { getStoredRowsPerPage } from '../../common/EntityTable/EntityTable';

import Translate from '../../common/Translate';
import InternationalizedLink from '../../common/InternationalizedLink';
import { wikiBBSLinks } from '../../../conf/externalLinks';

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
  'entrance.name': '',
  'massif.name': ''
};

const SubjectEntry = ({ subject }) => {
  const { formatMessage } = useIntl();
  const isTopLevel = subject.parent === null;
  let out = '';
  if (!isTopLevel) out += '\u00a0\u00a0\u00a0\u00a0'; // indentation of sub-subject

  out += `${subject.code} - `;

  const name = formatMessage({
    id: subject.code,
    defaultMessage: subject.subject
  });
  out += name.length > 80 ? `${name.substring(0, 80)}…` : name;

  return isTopLevel ? <b>{out}</b> : out;
};
SubjectEntry.propTypes = {
  subject: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string,
      subject: PropTypes.string,
      parent: PropTypes.string
    })
  )
};

const DocumentSearch = () => {
  const dispatch = useDispatch();
  const [filterState, setFilterState] = useState(initialFilterState);
  const [query, setQuery] = useState('');
  const [matchAllFields, setMatchAllFields] = useState(true);
  const searchEntity = ADVANCED_SEARCH_TYPES.DOCUMENTS;

  const documentTypes = useSelector(state => state.documentType.documentTypes);
  const subjects = useSelector(state => state.subject.subjects);

  useEffect(() => {
    dispatch(loadDocumentTypes());
    dispatch(loadSubjects());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <SearchForm onSubmit={() => startAdvancedsearch()}>
      <Typography
        variant="body1"
        gutterBottom
        style={{ fontStyle: 'italic', textAlign: 'center' }}>
        <Translate>
          The BBS (&quot;Bulletin Bibliographique Spéléologique&quot; in french)
          is an annual review of the worldwide speleological litterature.
        </Translate>
        <br />
        <InternationalizedLink links={wikiBBSLinks}>
          <Translate>
            You can find more info about the BBS on the dedicated
            Grottocenter-wiki page.
          </Translate>
        </InternationalizedLink>
      </Typography>

      <SearchFormContainer style={{ justifyContent: 'flex-start' }}>
        <SearchText label="Query" onChange={e => setQuery(e)} value={query} />
      </SearchFormContainer>

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
            .map(e => [e.name, e.name])}
          onChange={e => updateFilter('type', e)}
          value={filterState.type}
        />

        <SearchSelect
          label="Subjects"
          optionDescription="All subjects"
          options={subjects.map(e => [e.code, <SubjectEntry subject={e} />])}
          onChange={e => updateFilter('subjects.code', e)}
          value={filterState['subjects.code']}
        />
      </SearchFieldset>

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
          <SearchText
            label="Source ID"
            type="number"
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

          <SearchText
            label="Pages"
            onChange={e => updateFilter('pages', e)}
            value={filterState.pages}
          />
        </SearchFormContainer>
      </SearchFieldset>

      <SearchFieldset title="Contributors">
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
        <SearchFormContainer>
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
        <SearchFormContainer>
          <SearchText
            label="Cave"
            onChange={e => updateFilter('cave.name', e)}
            value={filterState['cave.name']}
          />

          <SearchText
            label="Entrance"
            onChange={e => updateFilter('entrance.name', e)}
            value={filterState['entrance.name']}
          />

          <SearchText
            label="Massif"
            onChange={e => updateFilter('massif.name', e)}
            value={filterState['massif.name']}
          />
        </SearchFormContainer>
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

export default DocumentSearch;
