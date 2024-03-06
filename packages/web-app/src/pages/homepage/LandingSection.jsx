import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { GridContainer } from '../../helpers/GridSystem';

const Section = ({ className, children }) => (
  <div className={className}>
    <GridContainer>{children}</GridContainer>
  </div>
);

Section.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};

const LandingSection = styled(Section)`
  clear: both;
  padding: 40px 0;
  background-color: ${props => props.bgColor};
  color: ${props => props.fgColor};
`;

export default LandingSection;
