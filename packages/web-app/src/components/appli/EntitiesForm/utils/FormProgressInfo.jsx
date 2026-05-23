import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { React, useRef, useEffect } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const isRedirected = useRef(false);

  useEffect(() => {
    if (!isLoading && !isError && !isRedirected.current) {
      const newPath = getRedirectFn();
      if (!newPath || newPath === window.location.pathname) {
        isRedirected.current = true;
        navigate(0); // Refresh
      } else {
        isRedirected.current = true;
        navigate(newPath);
      }
    }
  }, [isLoading, isError, getRedirectFn, navigate]);

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

  return <CircularProgress />;
};

FormProgressInfo.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  isError: PropTypes.bool.isRequired,
  labelLoading: PropTypes.string,
  labelError: PropTypes.string.isRequired,
  resetFn: PropTypes.func.isRequired,
  getRedirectFn: PropTypes.func.isRequired
};

export default FormProgressInfo;
