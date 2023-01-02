import React from 'react';
import PropTypes from 'prop-types';
import { Tab, Tabs, Card, CardContent } from '@mui/material';
import { styled } from '@mui/material/styles';

import DocumentSearch from './DocumentSearch';
import EntrancesSearch from './EntrancesSearch';
import MassifsSearch from './MassifsSearch';
import OrganizationsSearch from './OrganizationsSearch';

import Translate from '../../common/Translate';
import { ADVANCED_SEARCH_TYPES } from '../../../conf/config';
import SearchResults from './SearchResults';

const TabIcon = styled('img')(() => ({
  height: '2rem',
  marginRight: '5px',
  verticalAlign: 'middle',
  width: '2rem'
}));

const AdvancedSearch = ({
  resetAdvancedSearch,
  startAdvancedsearch,
  getDocumentTypes,
  documentTypes,
  getSubjects,
  subjects
}) => {
  const [selectedType, setSelectedType] = React.useState(0);

  const handleSelectType = (_event, value) => {
    setSelectedType(value);
  };

  return (
    <div>
      <Tabs
        variant="fullWidth"
        // scrollable
        // scrollButtons="off"
        value={selectedType}
        onChange={handleSelectType}
        // indicatorColor="primary"
        // textColor="primary"
      >
        <Tab
          label={
            <>
              <TabIcon src="/images/entry.svg" alt="Entry icon" />
              <Translate>Entrances</Translate>
            </>
          }
        />
        <Tab
          label={
            <>
              <TabIcon src="/images/club.svg" alt="Organization icon" />
              <Translate>Organizations</Translate>
            </>
          }
        />
        <Tab
          label={
            <>
              <TabIcon src="/images/massif.svg" alt="Massif icon" />
              <Translate>Massifs</Translate>
            </>
          }
        />
        <Tab
          label={
            <>
              <TabIcon src="/images/bibliography.svg" alt="Bibliography icon" />
              <Translate>Documents</Translate>
            </>
          }
        />
      </Tabs>

      <Card>
        <CardContent>
          {selectedType === 0 && (
            <EntrancesSearch
              startAdvancedsearch={startAdvancedsearch}
              resourceType={ADVANCED_SEARCH_TYPES.ENTRANCES}
              resetResults={resetAdvancedSearch}
            />
          )}
          {selectedType === 1 && (
            <OrganizationsSearch
              startAdvancedsearch={startAdvancedsearch}
              resourceType={ADVANCED_SEARCH_TYPES.ORGANIZATIONS}
              resetResults={resetAdvancedSearch}
            />
          )}
          {selectedType === 2 && (
            <MassifsSearch
              startAdvancedsearch={startAdvancedsearch}
              resourceType={ADVANCED_SEARCH_TYPES.MASSIFS}
              resetResults={resetAdvancedSearch}
            />
          )}
          {selectedType === 3 && (
            <DocumentSearch
              startAdvancedsearch={startAdvancedsearch}
              resourceType={ADVANCED_SEARCH_TYPES.DOCUMENTS}
              resetResults={resetAdvancedSearch}
              getAllDocumentTypes={getDocumentTypes}
              allDocumentTypes={documentTypes}
              getAllSubjects={getSubjects}
              allSubjects={subjects}
            />
          )}

          <br />

          <SearchResults />
        </CardContent>
      </Card>
    </div>
  );
};

AdvancedSearch.propTypes = {
  resetAdvancedSearch: PropTypes.func.isRequired,
  startAdvancedsearch: PropTypes.func.isRequired,
  getDocumentTypes: PropTypes.func.isRequired,
  documentTypes: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  getSubjects: PropTypes.func.isRequired,
  subjects: PropTypes.arrayOf(PropTypes.shape({})).isRequired
};

AdvancedSearch.defaultProps = {};

export default AdvancedSearch;
