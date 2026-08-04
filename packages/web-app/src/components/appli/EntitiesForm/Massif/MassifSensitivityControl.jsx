import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
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
import { previewSensitiveMassif } from '../../../../actions/Massif/PreviewSensitiveMassif';
import { markMassifSensitive } from '../../../../actions/Massif/MarkSensitiveMassif';
import { unmarkMassifSensitive } from '../../../../actions/Massif/UnmarkSensitiveMassif';
import { useNotification, usePermissions } from '../../../../hooks';
import { MassifTypes } from '../../../../types/massif.type';

const MassifSensitivityControl = ({ massif }) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const notification = useNotification();
  const permissions = usePermissions();

  const isSensitive = massif?.isSensitive;
  const { isAdmin } = permissions;
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewCount, setPreviewCount] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [optimisticSensitive, setOptimisticSensitive] = useState(!!isSensitive);

  useEffect(() => {
    setOptimisticSensitive(!!isSensitive);
  }, [isSensitive]);

  if (!isAdmin || !massif?.id) return null;

  const handleToggle = async () => {
    if (!isSensitive) {
      // Flow for enabling: Preview -> Confirm -> Mark
      setIsPreviewLoading(true);
      try {
        const count = await dispatch(previewSensitiveMassif(massif.id));
        setPreviewCount(count);
        setIsConfirmOpen(true);
      } catch (error) {
        // Fallback if preview fails: still show dialog but without count
        setPreviewCount(null);
        setIsConfirmOpen(true);
      } finally {
        setIsPreviewLoading(false);
      }
    } else {
      // Flow for disabling: Confirm -> Unmark
      setIsConfirmOpen(true);
    }
  };

  const handleCancel = () => {
    setIsConfirmOpen(false);
  };

  const handleConfirm = async () => {
    setIsActionLoading(true);
    try {
      if (!isSensitive) {
        await dispatch(markMassifSensitive(massif.id));
        const count = previewCount ?? 0;
        notification.onSuccess(
          formatMessage(
            {
              id:
                count > 0
                  ? 'Massif marked as sensitive. {count} entrances affected.'
                  : 'Massif marked sensitive with no entrances affected.'
            },
            { count }
          )
        );
      } else {
        await dispatch(unmarkMassifSensitive(massif.id));
        notification.onSuccess(
          formatMessage({ id: 'Massif unmarked as sensitive.' })
        );
      }
      setOptimisticSensitive(!isSensitive);
      setIsConfirmOpen(false);
    } catch (error) {
      setIsConfirmOpen(false);
      if (error.status === 403) {
        notification.onError(
          formatMessage({
            id: 'Only administrators can modify massif sensitivity.'
          })
        );
      } else {
        notification.onError(error.message);
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const dialogTitle = formatMessage({
    id: isSensitive ? 'Remove sensitivity' : 'Enable sensitivity'
  });

  let dialogBody;
  if (!isSensitive) {
    if (previewCount !== null) {
      dialogBody = formatMessage(
        {
          id:
            previewCount > 0
              ? 'This action will mark {count} entrances as sensitive. This designation must be based on applicable legislation. Do you want to continue?'
              : 'No entrances will be affected but the massif will still be marked as sensitive. This designation must be based on applicable legislation. Do you want to continue?'
        },
        { count: previewCount }
      );
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
      <FormControlLabel
        control={
          <Switch
            checked={optimisticSensitive}
            onChange={handleToggle}
            disabled={isPreviewLoading || isActionLoading}
          />
        }
        label={formatMessage({ id: 'Sensitive massif' })}
      />
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
