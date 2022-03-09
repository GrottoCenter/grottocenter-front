import React from 'react';
import { Tabs, Tab } from '@material-ui/core';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const HeaderTabs = ({ selectedTab, setSelectedTab, disabledAllTabs }) => {
  const { formatMessage } = useIntl();

  const TabIcon = styled.img`
    height: 2rem;
    margin-right: 5px;
    vertical-align: middle;
    width: 2rem;
  `;
  return (
    <Tabs
      value={selectedTab}
      onChange={(event, value) => setSelectedTab(value)}
      variant="standard"
      indicatorColor="primary"
      textColor="primary">
      <Tab
        disabled={disabledAllTabs}
        label={formatMessage({ id: 'Entrances' })}
        icon={<TabIcon src="/images/entry.svg" alt="Entry icon" />}
      />
      <Tab
        disabled={disabledAllTabs}
        label={formatMessage({ id: 'Documents' })}
        icon={
          <TabIcon src="/images/bibliography.svg" alt="Bibliography icon" />
        }
      />
    </Tabs>
  );
};

HeaderTabs.propTypes = {
  selectedTab: PropTypes.arrayOf(PropTypes.number).isRequired,
  setSelectedTab: PropTypes.func.isRequired,
  disabledAllTabs: PropTypes.bool.isRequired
};

export default HeaderTabs;
