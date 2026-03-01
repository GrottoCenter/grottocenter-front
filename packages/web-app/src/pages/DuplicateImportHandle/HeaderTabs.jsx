import React from 'react';
import { Tabs, Tab } from '@mui/material';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import CustomIcon from '../../components/common/CustomIcon';

const HeaderTabs = ({ selectedTab, setSelectedTab, disabledAllTabs }) => {
  const { formatMessage } = useIntl();

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
        icon={<CustomIcon type="entrance" size={32} />}
      />
      <Tab
        disabled={disabledAllTabs}
        label={formatMessage({ id: 'Documents' })}
        icon={<CustomIcon type="bibliography" size={32} />}
      />
    </Tabs>
  );
};

HeaderTabs.propTypes = {
  selectedTab: PropTypes.number.isRequired,
  setSelectedTab: PropTypes.func.isRequired,
  disabledAllTabs: PropTypes.bool.isRequired
};

export default HeaderTabs;
