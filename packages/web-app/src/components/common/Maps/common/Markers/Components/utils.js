import React from 'react';
import { Typography } from '@mui/material';
import PropTypes from 'prop-types';
import GCLink from '../../../../GCLink';

export const makeCoordinatesValue = (latitude, longitude) =>
  `Lat: ${latitude.toFixed(4)} - Long: ${longitude.toFixed(4)}`;

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
