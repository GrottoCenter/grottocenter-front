import React from 'react';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';

import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

import { Button, CardActions } from '@mui/material';
import { Breakpoint } from 'react-socks';

import Translate from '../../common/Translate';

const PREFIX = 'SearchBottomActionButtons';

const classes = {
  cardBottomButtons: `${PREFIX}-cardBottomButtons`,
  bottomButton: `${PREFIX}-bottomButton`,
  bottomButtonSmallScreen: `${PREFIX}-bottomButtonSmallScreen`
};

const StyledCardActions = styled(CardActions)(() => ({
  [`&.${classes.cardBottomButtons}`]: {
    display: 'block',
    marginTop: '10px',
    padding: 0,
    textAlign: 'center',
    width: '100%'
  },

  [`& .${classes.bottomButton}`]: {
    margin: '0 4px'
  },

  [`& .${classes.bottomButtonSmallScreen}`]: {
    marginBottom: '10px',
    width: '100%'
  }
}));

class SearchBottomActionButtons extends React.Component {
  render() {
    const { resetResults, resetParentState } = this.props;

    return (
      <StyledCardActions className={classes.cardBottomButtons}>
        <Breakpoint customQuery="(max-width: 450px)">
          <Button
            className={classes.bottomButtonSmallScreen}
            type="submit"
            variant="contained"
            size="large">
            <SearchIcon />
            <Translate>Search</Translate>
          </Button>

          <Button
            className={classes.bottomButtonSmallScreen}
            type="button"
            variant="contained"
            size="large"
            onClick={() => {
              this.setState(this.getInitialState());
              resetResults();
            }}>
            <ClearIcon />
            <Translate>Reset</Translate>
          </Button>
        </Breakpoint>

        <Breakpoint customQuery="(min-width: 451px)">
          <Button
            className={classes.bottomButton}
            type="submit"
            variant="contained"
            size="large">
            <SearchIcon />
            <Translate>Search</Translate>
          </Button>

          <Button
            className={classes.bottomButton}
            type="button"
            variant="contained"
            size="large"
            onClick={() => {
              resetParentState();
              resetResults();
            }}>
            <ClearIcon />
            <Translate>Reset</Translate>
          </Button>
        </Breakpoint>
      </StyledCardActions>
    );
  }
}

SearchBottomActionButtons.propTypes = {
  resetResults: PropTypes.func.isRequired,
  resetParentState: PropTypes.func.isRequired
};

export default SearchBottomActionButtons;
