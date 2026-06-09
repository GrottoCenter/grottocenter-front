import React from 'react';
import PropTypes from 'prop-types';
import { Container } from '@mui/material';

const PageContainer = ({ children }) => (
  <Container maxWidth={false} disableGutters sx={{ pb: 1 }}>
    {children}
  </Container>
);

PageContainer.propTypes = {
  children: PropTypes.node.isRequired
};

export default PageContainer;
