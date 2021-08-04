import React from 'react';
import PropTypes from 'prop-types';

export default function checkPermission(right) {
  // Control rights
  const granted = false;
  // eslint-disable-next-line no-console
  console.debug('Under development', right);

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
