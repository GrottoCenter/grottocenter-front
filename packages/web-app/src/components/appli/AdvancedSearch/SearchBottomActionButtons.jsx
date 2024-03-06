import React from 'react';
import PropTypes from 'prop-types';

import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

import { Button, CardActions } from '@mui/material';

import Translate from '../../common/Translate';

const SearchBottomActionButtons = ({ resetResults, resetParentState }) => (
  <CardActions sx={{ padding: 0, marginTop: '1em' }}>
    <Button type="submit" variant="contained">
      <SearchIcon />
      <Translate>Search</Translate>
    </Button>

    <Button
      type="button"
      variant="contained"
      onClick={() => {
        resetParentState();
        resetResults();
      }}>
      <ClearIcon />
      <Translate>Reset</Translate>
    </Button>
  </CardActions>
);

SearchBottomActionButtons.propTypes = {
  resetResults: PropTypes.func.isRequired,
  resetParentState: PropTypes.func.isRequired
};

export default SearchBottomActionButtons;
