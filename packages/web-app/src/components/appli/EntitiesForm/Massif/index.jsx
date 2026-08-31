import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';

import { Button, CircularProgress } from '@mui/material';
import { FormContainer, FormActionRow } from '../utils/FormContainers';
import LicenseBox from '../utils/LicenseBox';
import StandardDialog from '../../../common/StandardDialog';
import Alert from '../../../common/Alert';
import { MassifTypes } from '../../../../types/massif.type';
import FormProgressInfo from '../utils/FormProgressInfo';
import {
  useCreateMassif,
  useMarkMassifSensitive,
  useNotification,
  usePermissions,
  usePreviewSensitiveMassif,
  useSetMassifSensitiveLock,
  useUnmarkMassifSensitive,
  useUpdateMassif,
  useUpdateName
} from '../../../../hooks';

import MassifFields from './MassifFields';
import MassifSensitivityControl from './MassifSensitivityControl';

const defaultMassifValues = {
  name: '',
  language: '',
  geogPolygon: null,
  isSensitive: false,
  isSensitiveLocked: false
};

const FALLBACK_ERROR_MESSAGE =
  'The server rejected the submission. Please review your polygon and try again.';

const is4xxError = error => error?.status >= 400 && error?.status < 500;

const getErrorCode = error => error?.body?.code || null;

const getErrorMessage = error => {
  if (error?.body?.message) return error.body.message;
  if (error?.message && error.message !== String(error.status)) {
    return error.message;
  }
  return null;
};

const hasPolygonChanged = (polygon, initialPolygon) =>
  JSON.stringify(polygon) !== JSON.stringify(initialPolygon);

export const MassifForm = ({ massifValues, onCancel }) => {
  const { formatMessage } = useIntl();
  const { onWarning, onError, onSuccess } = useNotification();
  const { isAdmin } = usePermissions();
  const isNewMassif = !massifValues;

  const [polygonErrors, setPolygonErrors] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSubmissionSuccessful, setIsSubmissionSuccessful] = useState(false);
  const [preview, setPreview] = useState(null);

  const wasSensitive = !!massifValues?.isSensitive;
  const wasLocked = !!massifValues?.isSensitiveLocked;

  const createMassifMutation = useCreateMassif();
  const markMassifMutation = useMarkMassifSensitive();
  const setMassifLockMutation = useSetMassifSensitiveLock();
  const unmarkMassifMutation = useUnmarkMassifSensitive();
  const updateMassifMutation = useUpdateMassif();
  const updateNameMutation = useUpdateName();
  const previewSensitiveMassif = usePreviewSensitiveMassif();
  const activeMassifMutation = isNewMassif
    ? createMassifMutation
    : updateMassifMutation;
  const massifError = activeMassifMutation.error;
  const massifLoading = activeMassifMutation.isPending;
  const massifData = activeMassifMutation.data;
  const nameError = updateNameMutation.error;
  const nameLoading = updateNameMutation.isPending;

  const { locale, AVAILABLE_LANGUAGES } = useSelector(state => state.intl);
  defaultMassifValues.language = AVAILABLE_LANGUAGES[locale].id;

  const geoJson = useMemo(
    () => JSON.parse(massifValues?.geogPolygon ?? null),
    [massifValues]
  );

  const {
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      massif: massifValues
        ? {
            nameId: massifValues.names[0]?.id,
            name: massifValues.names[0]?.name,
            language: massifValues.language,
            geogPolygon: geoJson,
            isSensitive: wasSensitive,
            isSensitiveLocked: wasLocked
          }
        : defaultMassifValues
    }
  });

  const isSensitive = !!watch('massif.isSensitive');
  const isSensitiveLocked = !!watch('massif.isSensitiveLocked');

  const handleReset = useCallback(() => {
    setIsSubmissionSuccessful(false);
    reset(undefined, { keepValues: true, keepErrors: false });
  }, [reset]);

  // Detect 4xx errors and show them as a toast notification
  useEffect(() => {
    const error = massifError || nameError;
    if (error && is4xxError(error)) {
      const code = getErrorCode(error);
      const rawMessage = getErrorMessage(error);
      // Use the error code as i18n key if available, fall back to raw message,
      // then to a generic translated fallback.
      const message = code
        ? formatMessage({
            id: code,
            defaultMessage: rawMessage || FALLBACK_ERROR_MESSAGE
          })
        : rawMessage || formatMessage({ id: FALLBACK_ERROR_MESSAGE });
      onError(message);
      handleReset();
    }
  }, [massifError, nameError, handleReset, onError, formatMessage]);

  // Reports what the cascade actually did. The counts only exist on the
  // marking endpoint: unmarking never touches entrances.
  const notifyCascadeResult = result => {
    const count = result?.count ?? preview?.count ?? 0;
    // The preview and mutation endpoints expose the same value under
    // `lockedCount` and `skippedLockedCount`, respectively.
    const lockedCount = result?.skippedLockedCount ?? preview?.lockedCount ?? 0;
    let messageId;
    if (lockedCount > 0) {
      messageId =
        'Massif marked as sensitive. {count} entrances affected, {lockedCount} locked entrances skipped.';
    } else if (count > 0) {
      messageId = 'Massif marked as sensitive. {count} entrances affected.';
    } else {
      messageId = 'Massif marked sensitive with no entrances affected.';
    }
    onSuccess(formatMessage({ id: messageId }, { count, lockedCount }));
  };

  const onSubmit = async data => {
    setIsSubmissionSuccessful(false);
    if (data.massif.geogPolygon?.coordinates?.length === 0) {
      return;
    }

    const nextSensitive = !!data.massif.isSensitive;
    const nextLocked = !!data.massif.isSensitiveLocked;
    const sensitivityChanged = isAdmin && nextSensitive !== wasSensitive;
    const lockChanged = isAdmin && nextLocked !== wasLocked;

    try {
      if (isNewMassif) {
        const created = await createMassifMutation.mutateAsync({
          name: data.massif.name,
          descriptionAndNameLanguage: { id: data.massif.language },
          geogPolygon: data.massif.geogPolygon,
          // Creation cascades server-side inside its own transaction, so the
          // flag travels with the massif rather than through mark-sensitive.
          ...(nextSensitive ? { isSensitive: true } : {})
        });
        // The create endpoint drops isSensitiveLocked, so the lock needs its
        // own call once the massif exists.
        if (nextLocked) {
          await setMassifLockMutation.mutateAsync({
            id: created.id,
            isSensitiveLocked: true
          });
        }
        setIsSubmissionSuccessful(true);
        return;
      }

      if (data.massif.name !== massifValues.name) {
        await updateNameMutation.mutateAsync({
          id: data.massif.nameId,
          name: data.massif.name
        });
      }

      const body = { id: massifValues.id };
      if (hasPolygonChanged(data.massif.geogPolygon, geoJson)) {
        body.geogPolygon = data.massif.geogPolygon;
      }
      // Unlocking has to land before the cascade — the API refuses
      // mark/unmark-sensitive while the massif is locked. Locking, conversely,
      // waits until after it.
      if (lockChanged && !nextLocked) {
        body.isSensitiveLocked = false;
      }

      await updateMassifMutation.mutateAsync(body);

      let cascadeResult = null;
      let wasUnmarked = false;
      if (sensitivityChanged) {
        if (nextSensitive) {
          cascadeResult = await markMassifMutation.mutateAsync(massifValues.id);
        } else {
          await unmarkMassifMutation.mutateAsync(massifValues.id);
          wasUnmarked = true;
        }
      }

      if (lockChanged && nextLocked) {
        await setMassifLockMutation.mutateAsync({
          id: massifValues.id,
          isSensitiveLocked: true
        });
      }

      if (cascadeResult) notifyCascadeResult(cascadeResult);
      if (wasUnmarked) {
        onSuccess(formatMessage({ id: 'Massif unmarked as sensitive.' }));
      }
      setIsSubmissionSuccessful(true);
    } catch (error) {
      if (error?.status === 403) {
        onError(
          formatMessage({
            id: 'Only administrators can modify massif sensitivity.'
          })
        );
      } else {
        onError(
          error?.message ?? formatMessage({ id: FALLBACK_ERROR_MESSAGE })
        );
      }
    }
  };

  const handleFormSubmit = async e => {
    e.preventDefault();
    if (polygonErrors) {
      return;
    }
    const editingElements = document.querySelectorAll('.leaflet-editing-icon');
    const visibleEditingElements = Array.from(editingElements).filter(
      el => el.offsetParent !== null && getComputedStyle(el).display !== 'none'
    );
    if (visibleEditingElements.length > 0) {
      onWarning(
        formatMessage({
          id: 'Please finish editing the polygon before submitting.'
        })
      );
      return;
    }

    // Changing sensitivity is confirmed here rather than when the switch is
    // flipped, so the counts shown are the ones about to be applied.
    const nextSensitive = !!getValues('massif.isSensitive');
    if (isAdmin && nextSensitive !== wasSensitive) {
      const isPolygonChanged = hasPolygonChanged(
        getValues('massif.geogPolygon'),
        geoJson
      );
      if (!isNewMassif && nextSensitive && !isPolygonChanged) {
        setIsPreviewLoading(true);
        try {
          setPreview(await previewSensitiveMassif(massifValues.id));
        } catch {
          // Preview is informational: fall back to the generic wording.
          setPreview(null);
        } finally {
          setIsPreviewLoading(false);
        }
      } else {
        // The preview endpoint only knows the persisted polygon. Showing its
        // counts while a new polygon is still local would be misleading.
        setPreview(null);
      }
      setIsConfirmOpen(true);
      return;
    }

    handleSubmit(onSubmit)();
  };

  const handleConfirmCancel = () => {
    setIsConfirmOpen(false);
    setPreview(null);
  };

  const handleConfirmSubmit = () => {
    setIsConfirmOpen(false);
    handleSubmit(onSubmit)();
  };

  const willBeSensitive = !!getValues('massif.isSensitive');
  const confirmTitle = formatMessage({
    id: willBeSensitive ? 'Enable sensitivity' : 'Remove sensitivity'
  });

  let confirmBody;
  if (!willBeSensitive) {
    confirmBody = formatMessage({
      id: 'Removing sensitivity from the massif will not automatically remove the sensitivity flag from individual entrances. Those flags must be managed separately. Do you want to continue?'
    });
  } else if (preview) {
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
    confirmBody = formatMessage({ id: bodyId }, { count, lockedCount });
  } else {
    confirmBody = formatMessage({
      id: 'Entrances within the massif polygon will be marked as sensitive. This designation must be based on applicable legislation. Do you want to continue?'
    });
  }

  if (
    isSubmissionSuccessful &&
    !massifLoading &&
    !nameLoading &&
    !is4xxError(massifError) &&
    !is4xxError(nameError)
  ) {
    return (
      <FormProgressInfo
        isLoading={false}
        isError={!!(massifError || nameError)}
        labelError={
          massifError?.message ||
          nameError?.message ||
          (isNewMassif
            ? 'An error occurred when creating a massif.'
            : 'An error occurred when updating a massif.')
        }
        resetFn={handleReset}
        getRedirectFn={() => (massifData ? `/ui/massifs/${massifData.id}` : '')}
      />
    );
  }

  return (
    <FormContainer>
      <form autoComplete="off" onSubmit={handleFormSubmit}>
        <MassifFields
          control={control}
          errors={errors}
          geoJson={geoJson}
          onValidationChange={setPolygonErrors}
        />
        {/* Sensitivity follows from the area drawn above, so it reads after
            the map rather than before it. */}
        <MassifSensitivityControl
          isSensitive={isSensitive}
          onSensitiveChange={value => setValue('massif.isSensitive', value)}
          isLocked={isSensitiveLocked}
          onLockChange={value => setValue('massif.isSensitiveLocked', value)}
          wasSensitive={wasSensitive}
        />
        <FormActionRow
          isNew={isNewMassif}
          isSubmitting={
            isSubmitting || massifLoading || nameLoading || isPreviewLoading
          }
          disabled={polygonErrors}
          onCancel={onCancel}
        />
      </form>
      <StandardDialog
        open={isConfirmOpen}
        onClose={handleConfirmCancel}
        title={confirmTitle}
        actions={
          <>
            <Button onClick={handleConfirmCancel} variant="outlined">
              {formatMessage({ id: 'Cancel' })}
            </Button>
            <Button
              onClick={handleConfirmSubmit}
              color="warning"
              variant="contained">
              {isSubmitting ? (
                <CircularProgress size={24} />
              ) : (
                formatMessage({ id: 'Confirm' })
              )}
            </Button>
          </>
        }>
        <Alert severity="warning" disableMargins content={confirmBody} />
      </StandardDialog>
      <LicenseBox />
    </FormContainer>
  );
};

MassifForm.propTypes = {
  massifValues: MassifTypes,
  onCancel: PropTypes.func
};

export default MassifForm;
