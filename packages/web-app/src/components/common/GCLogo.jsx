import React from 'react';
import PropTypes from 'prop-types';
import AppLink from './AppLink';
import { logoGC } from '../../conf/config';

const GCLogo = ({ className, showLink = true }) => {
  if (showLink) {
    return (
      <AppLink to="/" className={className}>
        <img src={logoGC} alt="GrottoCenter" />
      </AppLink>
    );
  }
  return (
    <span className={className}>
      <img src={logoGC} alt="GrottoCenter" />
    </span>
  );
};

GCLogo.propTypes = {
  className: PropTypes.string,
  showLink: PropTypes.bool
};

export default GCLogo;
