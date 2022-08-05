import React from 'react';
import PropTypes from 'prop-types';

import { useIntl } from 'react-intl';
import { Box, Typography } from '@material-ui/core';

import ArrowRightIcon from '@material-ui/icons/ArrowRight';

const Property = ({ newValue, oldValue, valueName }) => {
  const { formatMessage } = useIntl();

  return (
    <Box
      display="flex"
      justifyContent="start"
      width="100%"
      maxWidth="500px"
      mb={2}>
      <Box width="150px">
        <Typography variant="h4">{formatMessage({ id: valueName })}</Typography>
      </Box>
      <Box display="flex" alignItems="center">
        {oldValue && (
          <>
            <Typography>{oldValue}</Typography>
            <ArrowRightIcon />
          </>
        )}
        <Typography>{newValue}</Typography>
      </Box>
    </Box>
  );
};

Property.propTypes = {
  newValue: PropTypes.string.isRequired,
  oldValue: PropTypes.string,
  valueName: PropTypes.string.isRequired
};

export default Property;
