import { useIntl } from 'react-intl';
import { Divider, List } from '@material-ui/core';
import React from 'react';
import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import { locationsType } from '../Provider';
import Location from './Location';

const Locations = ({ locations }) => {
  const { formatMessage } = useIntl();

  return (
    <ScrollableContent
      dense
      title={formatMessage({ id: 'Location' })}
      content={
        <List>
          {locations.map(location => (
            <>
              <Location key={location.id} location={location} />
              <Divider variant="middle" component="li" />
            </>
          ))}
        </List>
      }
    />
  );
};

Locations.propTypes = {
  locations: locationsType
};

export default Locations;
