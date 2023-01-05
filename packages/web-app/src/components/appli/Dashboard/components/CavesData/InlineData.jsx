import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { useIntl } from 'react-intl';
import { Typography, Box } from '@material-ui/core';

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
  const { formatMessage } = useIntl();

  return (
    <StyledLine>
      <StyledIcon>{icon}</StyledIcon>
      <StyledText>
        {numberData} {formatMessage({ id: text })}
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
