import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { FormGroup, FormControlLabel, Switch, Typography, Box, CircularProgress, Alert } from '@mui/material';

import { getNotificationPreferences } from '../../../../actions/Person/GetNotificationPreferences';
import { updateNotificationPreferences } from '../../../../actions/Person/UpdateNotificationPreferences';
import REDUCER_STATUS from '../../../../reducers/ReducerStatus';

const NotificationPreferences = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const { preferences, status, error, updateStatus, updateError } = useSelector(state => state.notificationPreferences);

  useEffect(() => {
    dispatch(getNotificationPreferences());
  }, [dispatch]);

  const handleChange = (field) => (event) => {
    dispatch(updateNotificationPreferences({ [field]: event.target.checked }));
  };

  if (status === REDUCER_STATUS.LOADING && !preferences) {
    return <CircularProgress />;
  }

  if (status === REDUCER_STATUS.FAILED && !preferences) {
    return <Alert severity="error">{error || 'Failed to load preferences'}</Alert>;
  }

  return (
    <Box mt={4} mb={4}>
      <Typography variant="h6" gutterBottom>
        {formatMessage({ id: 'Notification Preferences', defaultMessage: 'Notification Preferences' })}
      </Typography>
      {updateStatus === REDUCER_STATUS.FAILED && (
        <Alert severity="error" sx={{ mb: 2 }}>{updateError || 'Failed to update preferences'}</Alert>
      )}
      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              checked={!!preferences?.send_notification_by_email}
              onChange={handleChange('send_notification_by_email')}
              disabled={updateStatus === REDUCER_STATUS.LOADING}
            />
          }
          label={formatMessage({ id: 'Email notifications for subscriptions', defaultMessage: 'Email notifications for subscriptions' })}
        />
        <FormControlLabel
          control={
            <Switch
              checked={!!preferences?.send_message_notification_by_email}
              onChange={handleChange('send_message_notification_by_email')}
              disabled={updateStatus === REDUCER_STATUS.LOADING}
            />
          }
          label={formatMessage({ id: 'Email notifications for messages', defaultMessage: 'Email notifications for messages' })}
        />
      </FormGroup>
    </Box>
  );
};

export default NotificationPreferences;
