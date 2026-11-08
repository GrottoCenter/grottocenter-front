import PropTypes from 'prop-types';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { Box, Checkbox, FormControlLabel } from '@mui/material';

import CaveAutoCompleteSearch from '@/components/common/AutoCompleteSearch/CaveAutoCompleteSearch';
import CustomIcon from '@/components/common/CustomIcon';
import FormSubmissionError from '@/components/common/FormSubmissionError';
import { useCave } from '@/hooks';
import pointType from '@/types/point.type';
import { TEXT_LENGTH_LIMITS } from '@/utils/textLengthLimits';
import CoordinateFormSection from '../utils/CoordinateFormSection';
import InputText from '../utils/InputText';
import {
  FormContainer,
  FormSection,
  FormActionRow
} from '../utils/FormContainers';

const PointForm = ({ values, isNew, onSubmit, onCancel, error }) => {
  const { formatMessage } = useIntl();
  const { data: cave } = useCave(values?.caveId);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    mode: 'onTouched',
    reValidateMode: 'onChange',
    shouldUnregister: true,
    defaultValues: {
      label: values?.label ?? '',
      underground: values?.underground ?? false,
      cave: values?.caveId
        ? { id: values.caveId, name: String(values.caveId) }
        : null,
      latitude: values?.latitude ?? '',
      longitude: values?.longitude ?? ''
    }
  });
  const underground = useWatch({ control, name: 'underground' });

  const handleValidSubmit = async data => {
    // TEMPORARY GrottoCenter/grottocenter-api#1978: replace caveId defaults,
    // search selection and serialization together with entranceId/networkId.
    // Remove the legacy field, not a fallback: the new API will reject caveId.
    const body = {
      label: data.label.trim(),
      underground: data.underground,
      caveId: data.cave?.id != null ? Number(data.cave.id) : null
    };
    if (data.underground === false) {
      body.latitude = Number(String(data.latitude).replace(',', '.'));
      body.longitude = Number(String(data.longitude).replace(',', '.'));
    }
    // Hidden underground coordinates are never requested or sent. In PATCH,
    // omitting them also preserves legacy coordinates when editing a label.
    try {
      await onSubmit(body);
    } catch {
      // The owning mutation supplies the inline error without losing the form.
    }
  };

  return (
    <FormContainer>
      <form
        onSubmit={handleSubmit(handleValidSubmit)}
        noValidate
        data-testid="point-form">
        <FormSubmissionError error={error} />
        <FormSection title="Information">
          <InputText
            control={control}
            formKey="label"
            labelName="Name"
            testId="point-label"
            isRequired
            isError={Boolean(errors.label)}
            maxLength={TEXT_LENGTH_LIMITS.ENTITY_NAME}
            validatorFn={value =>
              Boolean(value?.trim()) || formatMessage({ id: 'Required' })
            }
          />
          <Controller
            control={control}
            name="underground"
            render={({ field }) => (
              <FormControlLabel
                sx={{ my: 2 }}
                control={
                  <Checkbox
                    name={field.name}
                    checked={field.value}
                    onChange={event => field.onChange(event.target.checked)}
                    onBlur={field.onBlur}
                    slotProps={{
                      input: {
                        ref: field.ref,
                        'data-testid': 'point-underground'
                      }
                    }}
                  />
                }
                label={
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                    <span aria-hidden="true">
                      <CustomIcon type="underground" size={24} />
                    </span>
                    {formatMessage({ id: 'points.underground' })}
                  </Box>
                }
              />
            )}
          />
          <Controller
            control={control}
            name="cave"
            rules={{
              // Read the submitted classification, not a watched render value.
              validate: (value, formValues) =>
                formValues.underground !== true ||
                Boolean(value?.id) ||
                formatMessage({ id: 'Required' })
            }}
            render={({ field, fieldState }) => (
              <CaveAutoCompleteSearch
                value={
                  cave && String(field.value?.id) === String(cave.id)
                    ? { ...field.value, name: cave.name }
                    : field.value
                }
                onSelection={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
                required={underground === true}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </FormSection>
        {underground === false && (
          <FormSection title="Location">
            <CoordinateFormSection
              control={control}
              formLatitudeKey="latitude"
              formLongitudeKey="longitude"
              required
              latitudeError={errors.latitude?.message}
              longitudeError={errors.longitude?.message}
            />
          </FormSection>
        )}
        <FormActionRow
          isNew={isNew}
          isSubmitting={isSubmitting}
          onCancel={onCancel}
          submitTestId="point-submit"
        />
      </form>
    </FormContainer>
  );
};

PointForm.propTypes = {
  values: pointType,
  isNew: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  error: FormSubmissionError.propTypes.error
};

export default PointForm;
