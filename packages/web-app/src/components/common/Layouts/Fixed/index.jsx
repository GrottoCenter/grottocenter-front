import React, { useRef } from 'react';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';

const Wrapper = styled('div')(
  ({ theme, isFixedContent }) => `
  display: grid;
  ${isFixedContent && 'grid-template-columns: 100%;'}
  ${theme.breakpoints.up('md')} {
    ${
      !isFixedContent
        ? 'grid-template-columns: 100%;'
        : 'grid-template-columns: 500px auto;'
    }
  }
  @media print {
    display: block;
    background-color: white;
    height: 100%;
    @page {
      margin: 15mm 15mm 15mm 15mm;
    }
  }
  `
);

const FixedWrapper = styled('div')(
  ({ theme }) => `
  box-sizing: border-box;
  ${theme.breakpoints.up('md')} {
    position: sticky;
    top: ${theme.appBarHeight}px;
    height: calc(100vh - ${theme.appBarHeight + theme.spacing(3)});
  }
`
);

const ScrollableWrapper = styled('div')`
  display: flex;
  flex-direction: column;
`;

const Layout = ({ children, fixedContent }) => {
  const componentRef = useRef();
  return (
    <Wrapper ref={componentRef} isFixedContent={!!fixedContent}>
      {fixedContent && <FixedWrapper>{fixedContent}</FixedWrapper>}
      <ScrollableWrapper>{children}</ScrollableWrapper>
    </Wrapper>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  fixedContent: PropTypes.node
};

export default Layout;
