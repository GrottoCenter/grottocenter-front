import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';

import { FormContainer, FormActionRow } from '../utils/FormContainers';
import LicenseBox from '../utils/LicenseBox';
import { MassifTypes } from '../../../../types/massif.type';
import FormProgressInfo from '../utils/FormProgressInfo';
import {
  useCreateMassif,
  useUpdateMassif,
  useUpdateName,
  useNotification
} from '../../../../hooks';

import MassifFields from './MassifFields';
import MassifSensitivityControl from './MassifSensitivityControl';

const defaultMassifValues = {
  name: '',
  language: '',
  geogPolygon: null
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

export const MassifForm = ({ massifValues, onCancel }) => {
  const { formatMessage } = useIntl();
  const { onWarning, onError } = useNotification();
  const isNewMassif = !massifValues;

  const [polygonErrors, setPolygonErrors] = useState(false);

  const createMassifMutation = useCreateMassif();
  const updateMassifMutation = useUpdateMassif();
  const updateNameMutation = useUpdateName();
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
    formState: { errors, isSubmitting, isSubmitSuccessful }
  } = useForm({
    defaultValues: {
      massif: massifValues
        ? {
            nameId: massifValues.names[0]?.id,
            name: massifValues.names[0]?.name,
            language: massifValues.language,
            geogPolygon: massifValues.geogPolygon
          }
        : defaultMassifValues
    }
  });

  const handleReset = useCallback(() => {
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

  const onSubmit = async data => {
    if (data.massif.geogPolygon?.coordinates?.length === 0) {
      return;
    }

    if (isNewMassif) {
      createMassifMutation.mutate({
        name: data.massif.name,
        descriptionAndNameLanguage: { id: data.massif.language },
        geogPolygon: data.massif.geogPolygon
      });
    } else {
      if (data.massif.name !== massifValues.name) {
        updateNameMutation.mutate({
          id: data.massif.nameId,
          name: data.massif.name
        });
      }

      const body = { id: massifValues.id };
      if (JSON.stringify(data.massif.geogPolygon) !== JSON.stringify(geoJson)) {
        body.geogPolygon = data.massif.geogPolygon;
      }
      updateMassifMutation.mutate(body);
    }
  };

  const handleFormSubmit = e => {
    if (polygonErrors) {
      e.preventDefault();
      return;
    }
    const editingElements = document.querySelectorAll('.leaflet-editing-icon');
    const visibleEditingElements = Array.from(editingElements).filter(
      el => el.offsetParent !== null && getComputedStyle(el).display !== 'none'
    );
    if (visibleEditingElements.length > 0) {
      e.preventDefault();
      onWarning(
        formatMessage({
          id: 'Please finish editing the polygon before submitting.'
        })
      );
      return;
    }
    handleSubmit(onSubmit)(e);
  };

  if (
    isSubmitSuccessful &&
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
      {!isNewMassif && <MassifSensitivityControl massif={massifValues} />}
      <form autoComplete="off" onSubmit={handleFormSubmit}>
        <MassifFields
          control={control}
          errors={errors}
          geoJson={geoJson}
          onValidationChange={setPolygonErrors}
        />
        <FormActionRow
          isNew={isNewMassif}
          isSubmitting={isSubmitting || massifLoading || nameLoading}
          disabled={polygonErrors}
          onCancel={onCancel}
        />
      </form>
      <LicenseBox />
    </FormContainer>
  );
};

MassifForm.propTypes = {
  massifValues: MassifTypes,
  onCancel: PropTypes.func
};

export default MassifForm;
