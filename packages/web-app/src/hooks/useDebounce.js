import React from 'react';
import PropTypes from 'prop-types';

export const useDebounce = (value, delay = 200) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [delay, value]);

  return debouncedValue;
};

useDebounce.PropTypes = {
  value: PropTypes.string.isRequired,
  delay: PropTypes.number
};
