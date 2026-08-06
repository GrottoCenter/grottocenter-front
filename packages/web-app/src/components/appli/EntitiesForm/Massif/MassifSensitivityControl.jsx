import { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import {
  Button,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import StandardDialog from '../../../common/StandardDialog';
import Alert from '../../../common/Alert';
import SensitivityLockToggle from '../../../common/SensitivityLockToggle';
import {
  useMarkMassifSensitive,
  useNotification,
  usePermissions,
  usePreviewSensitiveMassif,
  useSetMassifSensitiveLock,
  useUnmarkMassifSensitive
} from '../../../../hooks';
import { MassifTypes } from '../../../../types/massif.type';

const MassifSensitivityControl = ({ massif }) => {
  const { formatMessage } = useIntl();
  const notification = useNotification();
  const permissions = usePermissions();
  const markMutation = useMarkMassifSensitive();
  const unmarkMutation = useUnmarkMassifSensitive();
  const lockMutation = useSetMassifSensitiveLock();
  const previewSensitiveMassif = usePreviewSensitiveMassif();

  const isSensitive = massif?.isSensitive;
  const { isAdmin } = permissions;
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [optimisticSensitive, setOptimisticSensitive] = useState(!!isSensitive);
  const [isLocked, setIsLocked] = useState(!!massif?.isSensitiveLocked);
  const [isLockLoading, setIsLockLoading] = useState(false);

  useEffect(() => {
    setOptimisticSensitive(!!isSensitive);
  }, [isSensitive]);

  useEffect(() => {
    setIsLocked(!!massif?.isSensitiveLocked);
  }, [massif?.isSensitiveLocked]);

  if (!isAdmin || !massif?.id) return null;

  const notifyActionError = error => {
    if (error.status === 403) {
      notification.onError(
        formatMessage({
          id: 'Only administrators can modify massif sensitivity.'
        })
      );
    } else {
      notification.onError(error.message);
    }
  };

  const handleToggle = async () => {
    if (!isSensitive) {
      // Flow for enabling: Preview -> Confirm -> Mark
      setIsPreviewLoading(true);
      try {
        setPreview(await previewSensitiveMassif(massif.id));
        setIsConfirmOpen(true);
      } catch {
        // Fallback if preview fails: still show dialog but without count
        setPreview(null);
        setIsConfirmOpen(true);
      } finally {
        setIsPreviewLoading(false);
      }
    } else {
      // Flow for disabling: Confirm -> Unmark
      setIsConfirmOpen(true);
    }
  };

  const handleLockToggle = async nextIsLocked => {
    const previousIsLocked = isLocked;
    setIsLocked(nextIsLocked);
    setIsLockLoading(true);
    try {
      await lockMutation.mutateAsync({
        id: massif.id,
        isSensitiveLocked: nextIsLocked
      });
    } catch (error) {
      setIsLocked(previousIsLocked);
      notifyActionError(error);
    } finally {
      setIsLockLoading(false);
    }
  };

  const handleCancel = () => {
    setIsConfirmOpen(false);
  };

  const handleConfirm = async () => {
    setIsActionLoading(true);
    try {
      if (!isSensitive) {
        const result = await markMutation.mutateAsync(massif.id);
        const count = result?.count ?? preview?.count ?? 0;
        const lockedCount =
          result?.skippedLockedCount ?? preview?.lockedCount ?? 0;
        let messageId;
        if (lockedCount > 0) {
          messageId =
            'Massif marked as sensitive. {count} entrances affected, {lockedCount} locked entrances skipped.';
        } else if (count > 0) {
          messageId = 'Massif marked as sensitive. {count} entrances affected.';
        } else {
          messageId = 'Massif marked sensitive with no entrances affected.';
        }
        notification.onSuccess(
          formatMessage({ id: messageId }, { count, lockedCount })
        );
      } else {
        // Unmarking never cascades to entrances, so it reports no counts.
        await unmarkMutation.mutateAsync(massif.id);
        notification.onSuccess(
          formatMessage({ id: 'Massif unmarked as sensitive.' })
        );
      }
      setOptimisticSensitive(!isSensitive);
      setIsConfirmOpen(false);
    } catch (error) {
      setIsConfirmOpen(false);
      notifyActionError(error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const dialogTitle = formatMessage({
    id: isSensitive ? 'Remove sensitivity' : 'Enable sensitivity'
  });

  let dialogBody;
  if (!isSensitive) {
    if (preview !== null) {
      const { count, lockedCount } = preview;
      let bodyId;
      if (count > 0 && lockedCount > 0) {
        bodyId =
          'This action will mark {count} entrances as sensitive. {lockedCount} locked entrances will be skipped. This designation must be based on applicable legislation. Do you want to continue?';
      } else if (count > 0) {
        bodyId =
          'This action will mark {count} entrances as sensitive. This designation must be based on applicable legislation. Do you want to continue?';
      } else if (lockedCount > 0) {
        bodyId =
          'No entrances will be affected because the {lockedCount} entrances of this massif have a locked sensitivity, but the massif will still be marked as sensitive. This designation must be based on applicable legislation. Do you want to continue?';
      } else {
        bodyId =
          'No entrances will be affected but the massif will still be marked as sensitive. This designation must be based on applicable legislation. Do you want to continue?';
      }
      dialogBody = formatMessage({ id: bodyId }, { count, lockedCount });
    } else {
      dialogBody = formatMessage({
        id: 'Entrances within the massif polygon will be marked as sensitive. This designation must be based on applicable legislation. Do you want to continue?'
      });
    }
  } else {
    dialogBody = formatMessage({
      id: 'Removing sensitivity from the massif will not automatically remove the sensitivity flag from individual entrances. Those flags must be managed separately. Do you want to continue?'
    });
  }

  return (
    <Box
      sx={{
        mt: 2,
        mb: 2,
        p: 1,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1
      }}>
      <Typography variant="h5" component="h3" gutterBottom>
        {formatMessage({ id: 'Sensitivity Management' })}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={optimisticSensitive}
              onChange={handleToggle}
              disabled={isLocked || isPreviewLoading || isActionLoading}
            />
          }
          label={formatMessage({ id: 'Sensitive massif' })}
        />
        <SensitivityLockToggle
          isLocked={isLocked}
          onChange={handleLockToggle}
          disabled={isLockLoading}
        />
        {isLockLoading && <CircularProgress size={20} />}
      </Box>
      {isLocked && (
        <Alert
          severity="info"
          content={formatMessage({
            id: 'The sensitivity of this massif is locked. Unlock it to change its sensitivity.'
          })}
        />
      )}
      <Typography variant="body2" color="textSecondary">
        {formatMessage({
          id: isSensitive
            ? 'Removing sensitivity from the massif will not automatically remove the sensitivity flag from individual entrances.'
            : 'Enabling sensitivity will cascade to all entrances within the massif polygon. The designation must be based on applicable legislation.'
        })}
      </Typography>
      {isPreviewLoading && <CircularProgress size={24} sx={{ ml: 1 }} />}
      <StandardDialog
        open={isConfirmOpen}
        onClose={handleCancel}
        title={dialogTitle}
        actions={
          <>
            <Button onClick={handleCancel} disabled={isActionLoading}>
              {formatMessage({ id: 'Cancel' })}
            </Button>
            <Button
              onClick={handleConfirm}
              color="primary"
              variant="contained"
              disabled={isActionLoading}>
              {isActionLoading ? (
                <CircularProgress size={24} />
              ) : (
                formatMessage({ id: 'Confirm' })
              )}
            </Button>
          </>
        }>
        <Typography>{dialogBody}</Typography>
      </StandardDialog>
    </Box>
  );
};

MassifSensitivityControl.propTypes = {
  massif: MassifTypes
};

export default MassifSensitivityControl;
