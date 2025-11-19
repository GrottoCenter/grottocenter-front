import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Tab, Tabs, Card, CardContent } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useParams } from 'react-router-dom';
import { isMobile } from 'react-device-detect';

import DocumentSearch from './DocumentSearch';
import EntrancesSearch from './EntrancesSearch';
import MassifsSearch from './MassifsSearch';
import OrganizationsSearch from './OrganizationsSearch';
import PersonSearch from './PersonSearch';

import Translate from '../../common/Translate';
import SearchResults from './SearchResults';

import { resetAdvancedSearchResults } from '../../../actions/Advancedsearch';

const TabIcon = styled('img')`
  height: 2rem;
  margin-right: 5px;
  vertical-align: middle;
  width: 2rem;
`;

const tabsName = {
  entry: 0,
  organization: 1,
  massif: 2,
  document: 3,
  person: 4
};

const AdvancedSearch = () => {
  const dispatch = useDispatch();

  const { tab } = useParams();
  const [tabIndex, setTabIndex] = useState(tabsName[tab ?? ''] ?? 0);

  return (
    <div>
      <Tabs
        value={tabIndex}
        variant={ isMobile ? 'scrollable' : 'fullWidth'}
        scrollButtons="auto"
        allowScrollButtonsMobile
        onChange={(_, value) => {
          setTabIndex(value);
          dispatch(resetAdvancedSearchResults());
        }}>
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
              <TabIcon src="/images/bibliography.svg" alt="Bibliography icon" />
              <Translate>Documents</Translate>
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
              <TabIcon src="/images/club.svg" alt="Organization icon" />
              <Translate>Organizations</Translate>
            </>
          }
        />

        <Tab
          label={
            <>
              <TabIcon src="/images/caver.svg" alt="Caver icon" />
              <Translate>Persons</Translate>
            </>
          }
        />
      </Tabs>

      <Card>
        <CardContent>
          {tabIndex === 0 && <EntrancesSearch />}
          {tabIndex === 1 && <DocumentSearch />}
          {tabIndex === 2 && <MassifsSearch />}
          {tabIndex === 3 && <OrganizationsSearch />}
          {tabIndex === 4 && <PersonSearch />}
          <br />
          <SearchResults />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedSearch;
