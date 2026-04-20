import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Button, CircularProgress, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import Layout from '../../components/common/Layouts/Fixed/FixedContent';

const SpacedCenteredButton = styled(Button)`
  margin: ${({ theme }) => theme.spacing(3)} auto;
`;

const VerifyEmailPage = ({ loading, success, error, onGoToLogin }) => {
  const { formatMessage } = useIntl();

  let content;
  if (loading) {
    content = (
      <div style={{ textAlign: 'center' }}>
        <CircularProgress size="4rem" />
        <Typography variant="h6" style={{ marginTop: '20px' }}>
          {formatMessage({ id: 'Verifying your email...' })}
        </Typography>
      </div>
    );
  } else if (success) {
    content = (
      <>
        <Typography align="center" variant="h6" color="primary">
          {formatMessage({
            id: 'Email successfully verified. You can now log in.'
          })}
        </Typography>
        <SpacedCenteredButton
          color="primary"
          onClick={onGoToLogin}
          style={{ display: 'block' }}
          variant="contained">
          {formatMessage({ id: 'Go to login' })}
        </SpacedCenteredButton>
      </>
    );
  } else {
    content = (
      <>
        <Typography align="center" variant="h6" color="error">
          {error ||
            formatMessage({ id: 'The verification link is invalid or expired.' })}
        </Typography>
      </>
    );
  }

  return (
    <Layout
      title={formatMessage({ id: 'Email Verification' })}
      content={content}
    />
  );
};

VerifyEmailPage.propTypes = {
  loading: PropTypes.bool.isRequired,
  success: PropTypes.bool.isRequired,
  error: PropTypes.string,
  onGoToLogin: PropTypes.func.isRequired
};

VerifyEmailPage.defaultProps = {
  error: null
};

export default VerifyEmailPage;
