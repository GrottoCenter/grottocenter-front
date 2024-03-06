import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTheme, alpha, styled } from '@mui/material/styles';
import PropTypes from 'prop-types';

const StyledBox = styled(Box)`
  padding: 15px;
  margin: 10px;
  border-radius: 10px;
  border-color: ${({ theme }) => theme.palette.primary.main};
  color: ${({ theme }) => theme.palette.primary.dark};
  text-align: center;
  height: 90%;
`;

const StyledTypography = styled(Typography)`
  display: flex;
  align-items: center;
`;

const DataCard = props => {
  const { isColored, numberData, isFetching, title, globalText, icon } = props;

  const theme = useTheme();

  return (
    <StyledBox
      style={{
        backgroundColor: isColored
          ? alpha(theme.palette.secondary.main, 0.4)
          : '',
        border: isColored ? '' : '1px solid'
      }}
      boxShadow={2}>
      <Box style={{ display: 'flex', justifyContent: 'center' }}>
        {icon}
        {isFetching || Number.isNaN(numberData) ? (
          <CircularProgress />
        ) : (
          <StyledTypography variant="h1">
            {numberData &&
              !Number.isNaN(numberData) &&
              numberData.toLocaleString('fr-FR')}
          </StyledTypography>
        )}
      </Box>
      <Box>
        <Typography variant="h3">{title}</Typography>
        <Typography
          variant="body1"
          align="center"
          style={{ marginBottom: '-7px', lineHeight: '18px' }}>
          {globalText}
        </Typography>
      </Box>
    </StyledBox>
  );
};

DataCard.propTypes = {
  isColored: PropTypes.bool,
  numberData: PropTypes.number,
  isFetching: PropTypes.bool,
  title: PropTypes.string,
  globalText: PropTypes.string,
  icon: PropTypes.node
};

export default DataCard;
