import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Typography, Box } from '@material-ui/core';
import { useSelector } from 'react-redux';

const StyledIcon = withStyles(() => ({
  root: {
    width: '25px',
    height: '25px'
  }
}))(Box);

const StyledLine = withStyles(() => ({
  root: {
    display: 'flex',
    margin: '0px 40px'
  }
}))(Box);

const StyledText = withStyles(() => ({
  root: {
    paddingLeft: '8px'
  }
}))(Typography);

const InlineData = ({ icon, numberData, text }) => {
  const locale = useSelector(state => state.intl);

  return (
    <StyledLine>
      <StyledIcon>{icon}</StyledIcon>
      <StyledText>
        {numberData.toLocaleString(locale)} {text}
      </StyledText>
    </StyledLine>
  );
};

InlineData.propTypes = {
  icon: PropTypes.node,
  numberData: PropTypes.number,
  text: PropTypes.string
};

export default InlineData;
