import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { Button, CircularProgress, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { isEmpty, match } from 'ramda';

import { emailRegexp } from '../conf/config';
import Layout from '../components/common/Layouts/Fixed/FixedContent';
import StringInput from '../components/common/Form/StringInput';

const FormWrapper = styled('form')`
  display: flex;
  flex-direction: column;
  margin: auto;
  margin-bottom: 0;
  max-width: 500px;
`;

const SpacedCenteredButton = styled(Button)`
  margin: ${({ theme }) => theme.spacing(1)} auto;
`;

const ForgotPasswordPage = ({
  email,
  onForgotPassword,
  onEmailChange,
  loading,
  forgotPasswordRequestSucceeded
}) => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();

  const checkIfHasError = fieldName => {
    switch (fieldName) {
      case 'email':
        return isEmpty(match(emailRegexp, email));

      default:
        return false;
    }
  };

  return (
    <Layout
      title={formatMessage({ id: 'Reset your password' })}
      content={
        forgotPasswordRequestSucceeded ? (
          <>
            <Typography align="center">
              {formatMessage({
                id: 'Check your email to reset your password.'
              })}
            </Typography>
            <SpacedCenteredButton
              color="primary"
              onClick={() => navigate('/')}
              style={{ display: 'block' }}
              variant="contained">
              {formatMessage({ id: 'Go to home page' })}
            </SpacedCenteredButton>
          </>
        ) : (
          <FormWrapper onSubmit={onForgotPassword}>
            <StringInput
              fullWidth
              hasError={checkIfHasError('email')}
              onValueChange={onEmailChange}
              required
              value={email}
              valueName={formatMessage({ id: 'Email' })}
            />

            <SpacedCenteredButton
              type="submit"
              size="large"
              color={loading ? 'inherit' : 'primary'}>
              {loading ? (
                <CircularProgress size="2.8rem" />
              ) : (
                formatMessage({ id: 'Reset password' })
              )}
            </SpacedCenteredButton>
          </FormWrapper>
        )
      }
    />
  );
};

ForgotPasswordPage.propTypes = {
  email: PropTypes.string.isRequired,
  onEmailChange: PropTypes.func.isRequired,
  onForgotPassword: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  forgotPasswordRequestSucceeded: PropTypes.bool.isRequired
};

export default ForgotPasswordPage;
