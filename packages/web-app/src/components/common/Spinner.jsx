import React from 'react';
import PropTypes from 'prop-types';
import CircularProgress from '@material-ui/core/CircularProgress';
import styled from 'styled-components';
import Translate from './Translate';

const SpinnerDiv = styled.div`
  z-index: 99999;
  position: relative;
  top: calc(50% - (${props => props.size}px / 2));
  margin: auto;
  height: ${props => props.size}px;
  width: ${props => props.size}px;
`;

const SpinnerText = styled.span`
  position: absolute;
  display: inline-block;
  width: 100%;
  text-align: center;
  top: calc(50% - 10px);
`;

const Spinner = ({ size, text }) => (
  <SpinnerDiv size={size}>
    <SpinnerText>
      <Translate>{text}</Translate>
    </SpinnerText>
    <CircularProgress size={size} thickness={7} />
  </SpinnerDiv>
);

Spinner.propTypes = {
  size: PropTypes.number.isRequired,
  text: PropTypes.string
};

export default Spinner;
