import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Button, CircularProgress, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import Layout from '../../components/common/Layouts/Fixed/FixedContent';

const SpacedCenteredButton = styled(Button)`
  margin: ${({ theme }) => theme.spacing(2)} auto;
`;

const VerifyEmailPage = ({
  loading,
  success,
  alreadyVerified,
  invalidToken,
  error,
  onGoToLogin
}) => {
  const { formatMessage } = useIntl();

  let content;
  if (loading) {
    content = (
      <div style={{ textAlign: 'center' }}>
        <CircularProgress size="2.5rem" />
        <Typography variant="subtitle1" component="p" style={{ marginTop: '20px' }}>
          {formatMessage({ id: 'Verifying your email...' })}
        </Typography>
      </div>
    );
  } else if (invalidToken) {
    content = (
      <Typography align="center" variant="subtitle1" component="p" color="error">
        {formatMessage({ id: 'The verification link is invalid.' })}
      </Typography>
    );
  } else if (success && alreadyVerified) {
    content = (
      <>
        <Typography align="center" variant="subtitle1" component="p" color="primary">
          {formatMessage({
            id: 'Your email address is already verified. You can log in.'
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
  } else if (success) {
    content = (
      <>
        <Typography align="center" variant="subtitle1" component="p" color="primary">
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
      <Typography align="center" variant="subtitle1" component="p" color="error">
        {error || formatMessage({ id: 'The verification link is invalid.' })}
      </Typography>
    );
  }

  return (
    <Layout
      title={formatMessage({
        id: 'Email Verification'
      })}
      content={content}
    />
  );
};

VerifyEmailPage.propTypes = {
  loading: PropTypes.bool.isRequired,
  success: PropTypes.bool.isRequired,
  alreadyVerified: PropTypes.bool,
  invalidToken: PropTypes.bool,
  error: PropTypes.string,
  onGoToLogin: PropTypes.func.isRequired
};

VerifyEmailPage.defaultProps = {
  alreadyVerified: false,
  invalidToken: false,
  error: null
};

export default VerifyEmailPage;
