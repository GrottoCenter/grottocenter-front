import React from 'react';
import { Typography } from '@mui/material';
import PropTypes from 'prop-types';
import GCLink from '../../../../GCLink';
import { formatWGS84 } from '../../../../../../helpers/coordinateConvert';

export const makeCoordinatesValue = (latitude, longitude) =>
  formatWGS84(latitude, longitude, 4);

export const Information = ({ icon, value, url, isTitle = false }) => (
  <div className="map-popup-property">
    {icon}
    <Typography variant={isTitle ? 'h5' : 'body2'}>
      {!url && value}
      {url && (
        <GCLink internal href={url}>
          {value}
        </GCLink>
      )}
    </Typography>
  </div>
);

Information.propTypes = {
  icon: PropTypes.node,
  value: PropTypes.string,
  url: PropTypes.string,
  isTitle: PropTypes.bool
};
