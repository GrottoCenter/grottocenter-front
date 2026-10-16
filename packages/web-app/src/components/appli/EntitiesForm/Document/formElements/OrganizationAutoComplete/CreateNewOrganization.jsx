import { useContext, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Box } from '@mui/material';
import { useIntl } from 'react-intl';
import AddIcon from '@mui/icons-material/Add';
import PropTypes from 'prop-types';

import { useCreateOrganization, useOnlineStatus } from '@/hooks';
import ActionButton from '@/components/common/ActionButton';
import FormSubmissionError from '@/components/common/FormSubmissionError';
import OrganizationTypeField from '@/components/common/OrganizationTypeField';
import InputText from '@/components/appli/EntitiesForm/utils/InputText';
import { TEXT_LENGTH_LIMITS } from '@/utils/textLengthLimits';
import { DocumentFormContext } from '../../Provider';

const CreateNewOrganization = ({
  defaultValue = '',
  enabled,
  onCreateSuccess,
  contextValueName = null
}) => {
  const {
    isPending,
    error,
    mutateAsync,
    reset: resetMutation
  } = useCreateOrganization();
  const { updateAttribute } = useContext(DocumentFormContext);
  const { formatMessage } = useIntl();
  const isOnline = useOnlineStatus();
  const {
    control,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isSubmitting }
  } = useForm({
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { name: defaultValue, type: '' }
  });

  useEffect(() => {
    if (enabled) {
      reset({ name: defaultValue, type: '' });
      resetMutation();
      setFocus('name');
    }
  }, [enabled, defaultValue, reset, resetMutation, setFocus]);

  const handleCreate = handleSubmit(async ({ name, type }) => {
    if (!enabled || !isOnline || isPending) return;
    try {
      const organization = await mutateAsync({
        name: { text: name.trim() },
        type
      });
      if (contextValueName) {
        updateAttribute(contextValueName, organization);
        if (contextValueName === 'partOf') {
          updateAttribute('editor', organization.editor ?? null);
          updateAttribute('library', organization.library ?? null);
        }
      }
      reset({ name: '', type: '' });
      onCreateSuccess(organization);
    } catch {
      // Keep the input and structured mutation error available for correction.
    }
  });

  return (
    <Box
      data-testid="create-organization-panel"
      sx={{ display: 'grid', gap: 1, width: '100%' }}
      onKeyDown={event => {
        // This panel is inside the document form: Enter in the name input must
        // create the organization without submitting the surrounding document.
        if (event.key === 'Enter' && event.target.name === 'name') {
          event.preventDefault();
          event.stopPropagation();
          handleCreate();
        }
      }}>
      <InputText
        control={control}
        formKey="name"
        labelName="Name"
        testId="inline-organization-name"
        isError={!!errors.name}
        isRequired
        isDisabled={isPending}
        maxLength={TEXT_LENGTH_LIMITS.ENTITY_NAME}
        validatorFn={value =>
          !!value?.trim() || formatMessage({ id: 'Required' })
        }
      />
      <OrganizationTypeField
        control={control}
        name="type"
        disabled={isPending}
      />
      <FormSubmissionError error={error} />
      <ActionButton
        color="secondary"
        type="button"
        label={formatMessage({ id: 'create' })}
        onClick={handleCreate}
        disabled={!enabled || !isOnline || isPending || isSubmitting}
        loading={isPending || isSubmitting}
        icon={<AddIcon />}
      />
    </Box>
  );
};

CreateNewOrganization.propTypes = {
  defaultValue: PropTypes.string,
  enabled: PropTypes.bool.isRequired,
  onCreateSuccess: PropTypes.func.isRequired,
  contextValueName: PropTypes.string
};

export default CreateNewOrganization;
