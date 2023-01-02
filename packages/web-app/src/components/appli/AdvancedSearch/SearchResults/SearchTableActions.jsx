import React from 'react';
import PropTypes from 'prop-types';

import withStyles from '@mui/styles/withStyles';

import IconButton from '@mui/material/IconButton';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';

const actionsStyles = theme => ({
  root: {
    flexShrink: 0,
    color: theme.palette.text.secondary,
    marginLeft: theme.spacing(2)
  }
});

class TablePaginationActions extends React.Component {
  handleBackButtonClick = event => {
    const { onPageChange, page } = this.props;
    onPageChange(event, page - 1);
  };

  handleNextButtonClick = event => {
    const { onPageChange, page } = this.props;
    onPageChange(event, page + 1);
  };

  render() {
    const { classes, count, page, size, theme } = this.props;

    return (
      <div className={classes.root}>
        <IconButton
          onClick={this.handleBackButtonClick}
          disabled={page === 0}
          aria-label="Previous Page"
          size="large">
          {theme.direction === 'rtl' ? (
            <KeyboardArrowRight />
          ) : (
            <KeyboardArrowLeft />
          )}
        </IconButton>
        <IconButton
          onClick={this.handleNextButtonClick}
          disabled={page * size + size >= count}
          aria-label="Next Page"
          size="large">
          {theme.direction === 'rtl' ? (
            <KeyboardArrowLeft />
          ) : (
            <KeyboardArrowRight />
          )}
        </IconButton>
      </div>
    );
  }
}

TablePaginationActions.propTypes = {
  classes: PropTypes.shape({ root: PropTypes.string }).isRequired,
  count: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  size: PropTypes.number.isRequired,
  theme: PropTypes.shape({ direction: PropTypes.string }).isRequired
};

export default withStyles(actionsStyles, { withTheme: true })(
  TablePaginationActions
);
