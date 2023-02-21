import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Box, Typography } from '@material-ui/core';

const SubscriptionNameTypography = styled(Typography)`
  display: inline-block;
  margin-right: ${({ theme }) => theme.spacing(4)}px;
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
