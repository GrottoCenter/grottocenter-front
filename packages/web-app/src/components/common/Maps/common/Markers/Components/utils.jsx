import React from 'react';
import { Typography } from '@mui/material';
import PropTypes from 'prop-types';
import AppLink from '../../../../AppLink';
import { formatWGS84 } from '../../../../../../helpers/coordinateConvert';

export const makeCoordinatesValue = (latitude, longitude) =>
  formatWGS84(latitude, longitude, 4);

export const Information = ({ icon, value, url, isTitle = false }) => (
  <div className="map-popup-property">
    {icon}
    {/*
      Popup title kept to a compact card size rather than an h-heading. Styled via
      the global `.map-popup-title` class (in App.css), not sx: popups are serialized
      with renderToString into a detached HTML string where emotion's hashed sx
      classes aren't injected — global classes always are. See sibling .map-popup-property.
    */}
    <Typography
      variant={isTitle ? 'subtitle1' : 'body2'}
      className={isTitle ? 'map-popup-title' : undefined}>
      {!url && value}
      {url && (
        <AppLink to={url}>
          {value}
        </AppLink>
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
