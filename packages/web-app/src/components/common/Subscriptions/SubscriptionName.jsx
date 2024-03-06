import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';

const SubscriptionNameTypography = styled(Typography)`
  display: inline-block;
  margin-right: ${({ theme }) => theme.spacing(4)};
  text-align: right;
`;

const SubscriptionName = ({ name }) => (
  <Box display="flex" justifyContent="center" alignItems="center">
    <SubscriptionNameTypography variant="h5" color="primary">
      <b>{name}</b>
    </SubscriptionNameTypography>
  </Box>
);

SubscriptionName.propTypes = {
  name: PropTypes.string.isRequired
};

export default SubscriptionName;
