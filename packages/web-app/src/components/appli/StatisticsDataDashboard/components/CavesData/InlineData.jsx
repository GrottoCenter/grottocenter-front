import React from 'react';
import PropTypes from 'prop-types';
import { Typography, Box } from '@mui/material';
import { useSelector } from 'react-redux';
import { styled } from '@mui/material/styles';

const StyledIcon = styled(Box)`
  width: 25px;
  height: 25px;
`;

const StyledLine = styled(Box)`
  display: flex;
  margin: 0px 40px;
`;

const StyledText = styled(Typography)`
  padding-left: 8px;
`;

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
