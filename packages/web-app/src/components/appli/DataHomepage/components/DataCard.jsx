import React from 'react';
import { Box, CircularProgress, Typography } from '@material-ui/core';
import { useTheme, withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import { alpha } from '@material-ui/core/styles/colorManipulator';

const StyledBox = withStyles(
  theme => ({
    root: {
      padding: '15px',
      margin: '10px',
      borderRadius: '10px',
      borderColor: theme.palette.primary.main,
      color: theme.palette.primary.dark,
      textAlign: 'center',
      height: '90%'
    }
  }),
  { withTheme: true }
)(Box);

const StyledTypography = withStyles(() => ({
  root: {
    display: 'flex',
    alignItems: 'center'
  }
}))(Typography);

const DataCard = props => {
  const { isColored, numberData, isFetching, title, globalText, icon } = props;

  const theme = useTheme();

  return (
    <StyledBox
      sx={{
        backgroundColor: isColored
          ? alpha(theme.palette.secondary.main, 0.4)
          : '',
        border: isColored ? '' : '1px solid'
      }}
      boxShadow={2}>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        {icon}
        {isFetching ? (
          <CircularProgress />
        ) : (
          <StyledTypography variant="h1">
            {numberData && numberData.toLocaleString('fr-FR')}
          </StyledTypography>
        )}
      </Box>
      <Box>
        <Typography variant="h3">{title}</Typography>
        <Typography
          variant="body1"
          align="justify"
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
