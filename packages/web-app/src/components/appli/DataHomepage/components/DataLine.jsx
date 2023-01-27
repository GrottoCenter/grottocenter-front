// DataHomepage
import React from 'react';
import { useIntl } from 'react-intl';
import {
  Box,
  CircularProgress,
  Grid,
  Typography,
  withStyles
} from '@material-ui/core';
import { alpha } from '@material-ui/core/styles/colorManipulator';
import PropTypes from 'prop-types';

const StyledBox = withStyles(
  theme => ({
    root: {
      backgroundColor: alpha(theme.palette.secondary.main, 0.4),
      borderRadius: '10px',
      padding: '15px',
      margin: '10px'
    }
  }),
  { withTheme: true }
)(Box);

const StyledTypography = withStyles(() => ({
  root: {
    display: 'flex',
    justifyContent: 'center', // Centered horizontally
    alignItems: 'center' // Centered vertically
  }
}))(Typography);

const DataLine = props => {
  const { formatMessage } = useIntl();

  const { numberData, isFetching, icon } = props;

  return (
    <StyledBox>
      <Grid
        container
        direction="row"
        justifyContent="center"
        alignItems="center">
        <>
          <Grid item xs={10} sm={4}>
            <Grid container direction="row" alignItems="center">
              <Grid item xs={5} sm={4}>
                {icon}
              </Grid>
              <Grid item xs={7} sm={8}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center'
                  }}>
                  {isFetching ? (
                    <CircularProgress />
                  ) : (
                    <StyledTypography variant="h1">
                      {numberData && numberData.toLocaleString('fr-FR')}&nbsp;
                    </StyledTypography>
                  )}
                  <StyledTypography variant="h3">
                    {formatMessage({
                      id: 'partners'
                    })}
                  </StyledTypography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={10} sm={8}>
            <Typography
              variant="body1"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                marginBottom: '7px',
                lineHeight: '18px'
              }}>
              {formatMessage({
                id: 'take part in the project by funding, providing data, communicating on the interest and benefits of cavers to share data.'
              })}
            </Typography>
          </Grid>
        </>
      </Grid>
    </StyledBox>
  );
};

DataLine.propTypes = {
  numberData: PropTypes.number,
  isFetching: PropTypes.bool,
  icon: PropTypes.node
};

export default DataLine;
