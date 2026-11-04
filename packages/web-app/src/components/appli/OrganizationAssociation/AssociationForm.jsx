import { useRef } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useController, useForm } from 'react-hook-form';
import { Box } from '@mui/material';
import OrganizationSelect from '@/components/appli/OrganizationSelect';
import FormSubmissionError from '@/components/common/FormSubmissionError';
import { useOnlineStatus } from '@/hooks';
import { FormActionRow } from '../EntitiesForm/utils/FormContainers';

const AssociationForm = ({ onClose, onSubmit, isPending = false, error }) => {
  const { formatMessage } = useIntl();
  const isOnline = useOnlineStatus();
  const submittingRef = useRef(false);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting }
  } = useForm({
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { organization: null }
  });
  const { field, fieldState } = useController({
    name: 'organization',
    control,
    rules: {
      validate: value =>
        (value?.id != null && value.id !== '') ||
        formatMessage({ id: 'Required' })
    }
  });
  const isBusy = isPending || isSubmitting;
  const handleValidSubmit = async ({ organization }) => {
    if (!isOnline || isPending || submittingRef.current) return;
    submittingRef.current = true;
    try {
      await onSubmit({ id: organization.id, name: organization.name });
      onClose();
    } catch {
      // The association mutation retains its structured error and selection.
      // A retry links this same ID; organization creation is independent.
    } finally {
      submittingRef.current = false;
    }
  };
  return (
    <Box
      component="form"
      noValidate
      data-testid="organization-association-form"
      onSubmit={handleSubmit(handleValidSubmit)}>
      <FormSubmissionError error={error} />
      <OrganizationSelect
        value={field.value}
        onChange={field.onChange}
        onSearchChange={() => field.onChange(null)}
        clearOnBlur={false}
        disabled={isBusy}
        name={field.name}
        inputRef={field.ref}
        onBlur={field.onBlur}
        errorMessage={fieldState.error?.message}
        required
        testId="responsible-organization-search"
        creationTestId="create-responsible-organization-search-button"
      />
      <FormActionRow
        isSubmitting={isBusy}
        submitLabel={formatMessage({ id: 'Associate' })}
        submitTestId="associate-organization-button"
      />
    </Box>
  );
};

AssociationForm.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isPending: PropTypes.bool,
  error: FormSubmissionError.propTypes.error
};

export default AssociationForm;
