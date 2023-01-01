import React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';
import styled from 'styled-components';

const Container = styled.div`
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
