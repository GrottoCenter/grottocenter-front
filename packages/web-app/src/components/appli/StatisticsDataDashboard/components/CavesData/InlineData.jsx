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

const StyledLine = styled(Box)`
  display: flex;
  align-items: center;
`;

const InlineData = ({ icon, numberData, text }) => {
  const locale = useSelector(state => state.intl);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
      <StyledLine>
        <StyledIcon>{icon}</StyledIcon>
        <Typography
          variant="h3"
          color="secondary"
          fontWeight={700}
          sx={{ pl: 1 }}>
          {numberData.toLocaleString(locale)}
        </Typography>
      </StyledLine>
      <Typography variant="body2">{text}</Typography>
    </Box>
  );
};

InlineData.propTypes = {
  icon: PropTypes.node,
  numberData: PropTypes.number,
  text: PropTypes.string
};

export default InlineData;
