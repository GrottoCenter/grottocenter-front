import React from 'react';
import PropTypes from 'prop-types';
import { Typography, Box } from '@mui/material';
import { useSelector } from 'react-redux';
import { styled } from '@mui/material/styles';

const StyledIcon = styled(Box)`
  width: 40px;
  height: 40px;
  flex-shrink: 0;
`;

const InfoBlock = ({ icon, numberData, text }) => {
  const locale = useSelector(state => state.intl);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <StyledIcon>{icon}</StyledIcon>
        <Typography variant="h3" color="secondary" fontWeight={700}>
          {(Math.round(numberData * 10) / 10).toLocaleString(locale)} m
        </Typography>
      </Box>
      <Typography variant="body2" textAlign="center">{text}</Typography>
    </Box>
  );
};

InfoBlock.propTypes = {
  icon: PropTypes.node,
  numberData: PropTypes.number,
  text: PropTypes.string
};

export default InfoBlock;
