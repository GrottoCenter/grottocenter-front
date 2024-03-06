import React from 'react';
import PropTypes from 'prop-types';
import { Typography, Box } from '@mui/material';
import { useSelector } from 'react-redux';
import { styled } from '@mui/material/styles';

const StyledIcon = styled(Box)`
  width: 45px;
  height: 45px;
`;

const Block = styled(Box)`
  display: flex;
`;

const TextBox = styled(Box)`
  padding-left: 12px;
`;

const StyledText = styled(Typography)`
  color: ${({ theme }) => theme.palette.secondary.main};
  margin-bottom: 10px;
`;

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
