import React from 'react';
import PropTypes from 'prop-types';

export default function checkPermission() {
  const granted = false;

  if (granted) {
    return Component => {
      const GrantedAccessComponent = props => <Component {...props} />;

      GrantedAccessComponent.contextTypes = {
        direction: PropTypes.string.isRequired
      };
      return GrantedAccessComponent;
    };
  }

  return () => {
    const DeniedAccessComponent = () => <div />;

    DeniedAccessComponent.contextTypes = {};

    return DeniedAccessComponent;
  };
}
