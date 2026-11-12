import { lazy, Suspense, useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography
} from '@mui/material';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import {
  AVATAR_FILE_TYPES,
  getAvatarFileError,
  prepareAvatar
} from '@/utils/avatarImage';
import ProfileAvatar from '../ProfileAvatar';
import StandardDialog from '../StandardDialog';

const AvatarCropDialog = lazy(() => import('./AvatarCropDialog'));

const AvatarEditor = ({
  avatarUrl = null,
  name = '',
  isOrganization = false,
  isPending = false,
  isDisabled = false,
  isOnline = true,
  onChange
}) => {
  const { formatMessage } = useIntl();
  const inputRef = useRef(null);
  const previewRef = useRef(null);
  const requestRef = useRef(0);
  const helpId = useId();
  const [imageUrl, setImageUrl] = useState(null);
  const [errorId, setErrorId] = useState(null);
  const [statusId, setStatusId] = useState(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const isBusy = isPreparing || isPending;
  const isBlocked = isBusy || isDisabled || !isOnline;

  useEffect(
    () => () => {
      requestRef.current += 1;
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    []
  );

  const closeCrop = () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setImageUrl(null);
    setErrorId(null);
  };

  const handleFile = async event => {
    const file = event.target.files?.[0];
    inputRef.current.value = '';
    if (!file || isBlocked) return;
    setStatusId(null);
    const fileError = getAvatarFileError(file);
    setErrorId(fileError);
    if (fileError) return;
    setIsPreparing(true);
    const request = ++requestRef.current;
    try {
      const blob = await prepareAvatar(file);
      if (request !== requestRef.current) return;
      const url = URL.createObjectURL(blob);
      previewRef.current = url;
      setImageUrl(url);
    } catch {
      if (request === requestRef.current) setErrorId('avatar.invalidImage');
    } finally {
      if (request === requestRef.current) setIsPreparing(false);
    }
  };

  const saveChange = async file => {
    if (isBlocked) return;
    setErrorId(null);
    setStatusId(null);
    try {
      await onChange(file);
      closeCrop();
      setIsRemoving(false);
      setStatusId(file ? 'avatar.saved' : 'avatar.removed');
    } catch (error) {
      let id = 'avatar.failed';
      if (error?.status === 429) id = 'Too many requests';
      else if (error?.status === 413) id = 'avatar.tooLarge';
      else if (error?.status === 400) id = 'avatar.invalidImage';
      setErrorId(id);
      throw error;
    }
  };

  return (
    <Box data-testid="avatar-editor">
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'flex-start', sm: 'center' } }}>
        <ProfileAvatar
          avatarUrl={avatarUrl}
          name={name}
          isOrganization={isOrganization}
          size={80}
        />
        <Box sx={{ minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <Button
              variant="outlined"
              startIcon={
                isPreparing ? (
                  <CircularProgress size={18} />
                ) : (
                  <AddPhotoAlternateOutlinedIcon />
                )
              }
              onClick={() => inputRef.current?.click()}
              disabled={isBlocked}
              aria-describedby={helpId}
              data-testid="avatar-select">
              {formatMessage({
                id: avatarUrl ? 'avatar.change' : 'avatar.add'
              })}
            </Button>
            {avatarUrl && (
              <Button
                color="error"
                startIcon={<DeleteOutlineIcon />}
                disabled={isBlocked}
                onClick={() => {
                  setErrorId(null);
                  setStatusId(null);
                  setIsRemoving(true);
                }}
                data-testid="avatar-remove">
                {formatMessage({ id: 'avatar.remove' })}
              </Button>
            )}
          </Stack>
          <input
            ref={inputRef}
            type="file"
            accept={AVATAR_FILE_TYPES}
            onChange={handleFile}
            hidden
            data-testid="avatar-file"
          />
          <Typography
            id={helpId}
            variant="caption"
            sx={{ mt: 1, display: 'block', color: 'grey.700' }}>
            {formatMessage({ id: 'avatar.formats' })}
          </Typography>
          <Typography
            variant="caption"
            sx={{ display: 'block', color: 'grey.700' }}>
            {formatMessage({ id: 'avatar.independentSave' })}
          </Typography>
        </Box>
      </Stack>
      <Box role="status" aria-live="polite">
        {statusId && (
          <Typography color="success.main" variant="body2" sx={{ mt: 1 }}>
            {formatMessage({ id: statusId })}
          </Typography>
        )}
      </Box>
      {errorId && !imageUrl && !isRemoving && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {formatMessage({ id: errorId })}
        </Alert>
      )}
      {!isOnline && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {formatMessage({ id: 'avatar.offline' })}
        </Typography>
      )}
      {imageUrl && (
        <Suspense
          fallback={
            <CircularProgress
              aria-label={formatMessage({ id: 'avatar.preview' })}
              sx={{ mt: 1 }}
            />
          }>
          <AvatarCropDialog
            imageUrl={imageUrl}
            isOrganization={isOrganization}
            isPending={isPending}
            isOnline={isOnline && !isDisabled}
            error={errorId ? formatMessage({ id: errorId }) : null}
            onSave={saveChange}
            onClose={closeCrop}
          />
        </Suspense>
      )}
      <StandardDialog
        open={isRemoving}
        fullWidth
        maxWidth="xs"
        title={formatMessage({ id: 'avatar.remove' })}
        onClose={isPending ? null : () => setIsRemoving(false)}
        stackActionsOnMobile
        actions={
          <>
            <Button
              variant="outlined"
              onClick={() => setIsRemoving(false)}
              disabled={isPending}>
              {formatMessage({ id: 'Cancel' })}
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={isBlocked}
              onClick={() => {
                saveChange(null).catch(() => {});
              }}
              data-testid="avatar-confirm-remove"
              startIcon={isPending ? <CircularProgress size={18} /> : null}>
              {formatMessage({ id: 'avatar.remove' })}
            </Button>
          </>
        }>
        <Typography>{formatMessage({ id: 'avatar.removeHelp' })}</Typography>
        {errorId && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {formatMessage({ id: errorId })}
          </Alert>
        )}
      </StandardDialog>
    </Box>
  );
};

AvatarEditor.propTypes = {
  avatarUrl: PropTypes.string,
  name: PropTypes.string,
  isOrganization: PropTypes.bool,
  isPending: PropTypes.bool,
  isDisabled: PropTypes.bool,
  isOnline: PropTypes.bool,
  onChange: PropTypes.func.isRequired
};

export default AvatarEditor;
