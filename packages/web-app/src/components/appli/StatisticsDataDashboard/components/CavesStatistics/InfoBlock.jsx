import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Typography, Box } from '@material-ui/core';
import { useSelector } from 'react-redux';

const StyledIcon = withStyles(() => ({
  root: {
    width: '45px',
    height: '45px'
  }
}))(Box);

const Block = withStyles(() => ({
  root: {
    display: 'flex'
  }
}))(Box);

const TextBox = withStyles(() => ({
  root: {
    paddingLeft: '12px'
  }
}))(Box);

const StyledText = withStyles(
  theme => ({
    root: {
      color: theme.palette.secondary.main,
      marginBottom: '-10px'
    }
  }),
  { withTheme: true }
)(Typography);

const InfoBlock = ({ icon, numberData, text }) => {
  const locale = useSelector(state => state.intl);

  return (
    <Block>
      <StyledIcon>{icon}</StyledIcon>
      <TextBox>
        <StyledText variant="h4">
          {(Math.round(numberData * 10) / 10).toLocaleString(locale)} m
        </StyledText>
        <Typography>{text}</Typography>
      </TextBox>
    </Block>
  );
};

InfoBlock.propTypes = {
  icon: PropTypes.node,
  numberData: PropTypes.number,
  text: PropTypes.string
};

export default InfoBlock;
