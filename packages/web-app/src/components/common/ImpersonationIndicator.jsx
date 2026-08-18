import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import {
  Box,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Tooltip,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { clearImpersonation, setImpersonatedRole } from '@/actions/Login';
import { usePermissions } from '@/hooks';
import { IMPERSONATABLE_ROLES } from '@/utils/impersonation';

const ImpersonationIndicator = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const { isRealAdmin, isImpersonating, impersonatedRole } = usePermissions();

  const handleRoleChange = useCallback(
    event => {
      const next = event.target.value;
      if (next && next !== impersonatedRole) {
        dispatch(setImpersonatedRole(next));
      }
    },
    [dispatch, impersonatedRole]
  );

  const handleStop = useCallback(() => {
    dispatch(clearImpersonation());
  }, [dispatch]);

  // Real admins only, and only while a preview is active — the launcher on
  // the Management Tools page is what starts the mode; this banner is the
  // active-mode surface.
  if (!isRealAdmin || !isImpersonating) return null;

  const switchLabel = formatMessage({
    id: 'Switch impersonated role',
    defaultMessage: 'Switch impersonated role'
  });
  const stopLabel = formatMessage({
    id: 'Stop previewing',
    defaultMessage: 'Stop previewing'
  });
  const limitationLabel = formatMessage({
    id: 'Impersonation launcher description',
    defaultMessage:
      'This only affects what the UI shows. API responses still reflect your real access.'
  });

  return (
    <Paper
      data-testid="impersonation-indicator"
      role="status"
      aria-live="polite"
      elevation={8}
      sx={theme => ({
        position: 'fixed',
        top: theme.spacing(1),
        left: '50%',
        transform: 'translateX(-50%)',
        // Sits above the AppBar (which uses theme.zIndex.appBar) so it is
        // never eclipsed by the fixed header. Snackbars still win — they
        // are transient and must be reachable over the preview indicator.
        zIndex: theme.zIndex.appBar + 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 0.5,
        borderRadius: 999,
        maxWidth: 'calc(100vw - 32px)',
        color: theme.palette.error.contrastText,
        backgroundColor: theme.palette.error.main
      })}>
      <VisibilityIcon fontSize="small" />
      {/* Below `sm` the pill has to share the top row with the AppBar's
          burger and avatar; dropping the label keeps the role picker
          untruncated and readable — the eye icon still signals the mode. */}
      <Typography
        variant="body2"
        component="span"
        sx={{ fontWeight: 500, display: { xs: 'none', sm: 'inline' } }}>
        {formatMessage({
          id: 'Viewing site as',
          defaultMessage: 'Viewing site as'
        })}
      </Typography>
      <FormControl size="small" variant="standard">
        <Select
          data-testid="impersonation-switch-select"
          value={impersonatedRole ?? ''}
          onChange={handleRoleChange}
          disableUnderline
          inputProps={{ 'aria-label': switchLabel }}
          sx={{
            color: 'inherit',
            fontWeight: 700,
            '& .MuiSelect-select': {
              // Match the surrounding Typography line-height so the picker
              // sits on the same baseline as the label and the icon.
              py: 0,
              pr: 3,
              lineHeight: 1.43
            },
            '& .MuiSelect-icon': { color: 'inherit' }
          }}>
          {IMPERSONATABLE_ROLES.map(role => (
            <MenuItem key={role} value={role}>
              {formatMessage({ id: role, defaultMessage: role })}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Tooltip title={limitationLabel}>
        <Box
          component="span"
          tabIndex={0}
          aria-label={limitationLabel}
          sx={{ color: 'inherit', display: 'flex' }}>
          <InfoOutlinedIcon fontSize="small" />
        </Box>
      </Tooltip>
      <Tooltip title={stopLabel}>
        <IconButton
          data-testid="impersonation-stop-button"
          size="small"
          onClick={handleStop}
          aria-label={stopLabel}
          sx={{ color: 'inherit' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Paper>
  );
};

export default ImpersonationIndicator;
