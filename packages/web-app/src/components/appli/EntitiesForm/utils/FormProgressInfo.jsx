import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { React, useRef } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import Alert from '../../../common/Alert';

const FormProgressInfo = ({
  isLoading,
  isError,
  labelLoading,
  labelError,
  resetFn,
  getRedirectFn
}) => {
  const { formatMessage } = useIntl();
  const history = useHistory();
  const isRedirected = useRef(false);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" flexDirection="column">
        <Typography> {formatMessage({ id: labelLoading })} </Typography>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <form>
        <Alert severity="error" title={formatMessage({ id: labelError })} />
        {resetFn && (
          <Button onClick={resetFn} color="primary">
            {formatMessage({ id: 'Retry' })}
          </Button>
        )}
      </form>
    );
  }

  if (!isRedirected.current) {
    const newPath = getRedirectFn();
    if (!newPath || newPath === window.location.pathname) {
      isRedirected.current = true;
      history.go(0); // Refresh
    } else {
      isRedirected.current = true;
      history.push(newPath);
    }
  }
  return <CircularProgress />;
};

FormProgressInfo.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  isError: PropTypes.bool.isRequired,
  labelLoading: PropTypes.string.isRequired,
  labelError: PropTypes.string.isRequired,
  resetFn: PropTypes.func.isRequired,
  getRedirectFn: PropTypes.func.isRequired
};

export default FormProgressInfo;
