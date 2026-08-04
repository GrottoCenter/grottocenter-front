import React from 'react';
import { action } from 'storybook/actions';
import { Button, CircularProgress, Divider, Switch } from '@mui/material';
import FaceIcon from '@mui/icons-material/Face';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';

import Translate from '../Translate';
import StandardDialog from '../StandardDialog';
import LoginForm from './index';

const DefaultLoginForm = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  return (
    <LoginForm
      email={email}
      onEmailChange={setEmail}
      password={password}
      onPasswordChange={setPassword}
    />
  );
};

const StoryControlsWrapper = styled('div')`
  background-color: ${({ theme }) => theme.palette.primary.light};
  font-size: 0.9375rem;
  left: 0;
  padding: 0.3125rem;
  position: absolute;
  right: 0;
  top: -75px;
`;

const TitleWrapper = styled('div')`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledDivider = styled(Divider)`
  flex-grow: 1;
`;

const Title = () => (
  <TitleWrapper>
    <StyledDivider color="primary" />
    <FaceIcon color="primary" />
    <StyledDivider />
  </TitleWrapper>
);

const DialogLoginForm = ({
  isOpen = true,
  serverError = '',
  initialEmail = '',
  initialPassword = ''
}) => {
  const [email, setEmail] = React.useState(initialEmail);
  const [password, setPassword] = React.useState(initialPassword);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasErrors, setHasErrors] = React.useState(false);

  return (
    <StandardDialog
      buttonType="button"
      open={isOpen}
      onClose={action('onClose')}
      title={<Title />}
      actions={[
        <Button
          type="button"
          size="large"
          onClick={action('onLogin')}
          color={isLoading ? 'inherit' : 'primary'}
          key={0}>
          {isLoading ? (
            <CircularProgress size="1.75rem" />
          ) : (
            <Translate>Log in</Translate>
          )}
        </Button>
      ]}>
      <StoryControlsWrapper>
        <div>
          <b>Form State StoryControls</b>
        </div>
        <Switch
          checked={isLoading}
          onChange={event => setIsLoading(event.target.checked)}
          color="primary"
          inputProps={{ 'aria-label': 'primary checkbox' }}
        />
        <span>Is loading</span>

        <Switch
          checked={hasErrors}
          onChange={event => setHasErrors(event.target.checked)}
          color="primary"
          inputProps={{ 'aria-label': 'primary checkbox' }}
        />
        <span>Has errors</span>
      </StoryControlsWrapper>

      <LoginForm
        email={email}
        onEmailChange={setEmail}
        password={password}
        onPasswordChange={setPassword}
        emailError={hasErrors ? 'You must provide a valid email.' : ''}
        passwordError={hasErrors ? 'You must provide a password.' : ''}
        serverError={hasErrors ? serverError : ''}
      />
    </StandardDialog>
  );
};

DialogLoginForm.propTypes = {
  serverError: PropTypes.string,
  initialEmail: PropTypes.string,
  initialPassword: PropTypes.string,
  isOpen: PropTypes.bool
};

const meta = {
  title: 'Login',
  component: LoginForm
};

export default meta;

export const Default = {
  render: () => <DefaultLoginForm />
};

export const InDialog = {
  name: 'In Dialog',
  render: () => <DialogLoginForm serverError="Invalid email or password." />
};
