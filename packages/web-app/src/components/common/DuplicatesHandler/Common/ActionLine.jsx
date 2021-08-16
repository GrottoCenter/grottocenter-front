import React from 'react';
import { Grid } from '@material-ui/core';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import ActionButton from '../../ActionButton';

const ActionLine = ({ handleSubmit, handleNotDuplicatesSubmit }) => {
  const { formatMessage } = useIntl();
  return (
    <Grid container direction="row" justify="space-evenly">
      <Grid item>
        <ActionButton
          label={formatMessage({ id: 'They are not duplicates' })}
          onClick={handleNotDuplicatesSubmit}
        />
      </Grid>
      <Grid item>
        <ActionButton
          label={formatMessage({ id: 'Submit' })}
          onClick={handleSubmit}
        />
      </Grid>
    </Grid>
  );
};

export default ActionLine;

ActionLine.propTypes = {
  handleSubmit: PropTypes.func.isRequired,
  handleNotDuplicatesSubmit: PropTypes.func.isRequired
};
