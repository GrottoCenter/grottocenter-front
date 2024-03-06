import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { styled } from '@mui/material/styles';

const Container = styled('div')`
  width: 100%;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: flex-end;
`;

const PageLoader = () => (
  <Container>
    <CircularProgress size={60} />
  </Container>
);

export default PageLoader;
