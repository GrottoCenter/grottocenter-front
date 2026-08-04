import { useState } from 'react';
import { FormControlLabel, Paper, Switch, Typography } from '@mui/material';
import ChangePasswordForm from './index';

const HydratedChangePasswordForm = () => {
  const [changePasswordRequestSucceeded, setChangePasswordRequestSucceeded] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  return (
    <>
      <Paper
        style={{ margin: '1.25rem', padding: '1.25rem', width: '300px' }}
        align="center">
        <Typography variant="h2">Story controls</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={loading}
              onChange={event => setLoading(event.target.checked)}
              name="Loading"
              color="primary"
            />
          }
          label="Loading"
        />
      </Paper>
      <ChangePasswordForm
        password={password}
        passwordConfirmation={passwordConfirmation}
        onPasswordChange={setPassword}
        onPasswordConfirmationChange={setPasswordConfirmation}
        onChangePassword={() => setChangePasswordRequestSucceeded(true)}
        loading={loading}
        changePasswordRequestSucceeded={changePasswordRequestSucceeded}
      />
    </>
  );
};

const meta = {
  title: 'Change password form',
  component: ChangePasswordForm
};

export default meta;

export const FormWithoutErrorManagement = {
  name: 'Form (without error management)',
  render: () => <HydratedChangePasswordForm />
};
