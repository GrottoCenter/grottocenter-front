import styled from 'styled-components';
import React from 'react';
import PropTypes from 'prop-types';

const SectionWrapper = styled.div`
  width: 100%;
  text-align: center;
  padding: ${({ theme }) => theme.spacing(2)};
`;

const Section = ({ children }) => <SectionWrapper>{children}</SectionWrapper>;

Section.propTypes = {
  children: PropTypes.node.isRequired
};

export default Section;
