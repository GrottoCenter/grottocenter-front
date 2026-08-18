import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { setImpersonatedRole } from '@/actions/Login';
import { usePermissions } from '@/hooks';
import { IMPERSONATABLE_ROLES } from '@/utils/impersonation';

const ImpersonationLauncher = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const { isRealAdmin, isImpersonating } = usePermissions();
  const [selectedRole, setSelectedRole] = useState('Moderator');

  const handleSelectChange = useCallback(event => {
    setSelectedRole(event.target.value);
  }, []);

  const handleStart = useCallback(() => {
    dispatch(setImpersonatedRole(selectedRole));
  }, [dispatch, selectedRole]);

  // Belt-and-braces: the parent Dashboard section is already admin-gated, but
  // the component enforces the invariant so it stays safe if reused.
  if (!isRealAdmin) return null;

  return (
    <Card variant="outlined">
      <CardContent sx={{ position: 'relative', p: 2, pt: 3 }}>
        <Chip
          variant="outlined"
          size="small"
          label={formatMessage({ id: 'Administrator' })}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        />
        <Box
          sx={{
            mb: 0.5,
            color: 'primary.main',
            display: 'flex',
            lineHeight: 0,
            '& svg': { fontSize: 36 }
          }}>
          <VisibilityIcon />
        </Box>
        <Typography variant="subtitle1" fontWeight={600}>
          {formatMessage({
            id: 'Preview the site as another role',
            defaultMessage: 'Preview the site as another role'
          })}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {formatMessage({
            id: 'Impersonation launcher description',
            defaultMessage:
              'Be careful API responses still reflect your real access'
          })}
        </Typography>
        {isImpersonating && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {formatMessage({
              id: 'Preview already active',
              defaultMessage:
                'A preview is already active. Use the indicator at the top of the page to switch role or stop.'
            })}
          </Alert>
        )}
        <FormControl
          size="small"
          fullWidth
          sx={{ mt: 2 }}
          disabled={isImpersonating}>
          <InputLabel id="impersonation-role-label">
            {formatMessage({ id: 'Role', defaultMessage: 'Role' })}
          </InputLabel>
          <Select
            data-testid="impersonation-role-select"
            labelId="impersonation-role-label"
            value={selectedRole}
            label={formatMessage({ id: 'Role', defaultMessage: 'Role' })}
            onChange={handleSelectChange}>
            {IMPERSONATABLE_ROLES.map(role => (
              <MenuItem key={role} value={role}>
                {formatMessage({ id: role, defaultMessage: role })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
        <Button
          data-testid="impersonation-start-button"
          variant="outlined"
          size="small"
          onClick={handleStart}
          disabled={isImpersonating}
          startIcon={<VisibilityIcon />}>
          {formatMessage({
            id: 'Start preview',
            defaultMessage: 'Start preview'
          })}
        </Button>
      </CardActions>
    </Card>
  );
};

export default ImpersonationLauncher;
