import { useId, useRef } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { Box, Typography } from '@mui/material';
import {
  useCreateOrganization,
  useCreatePerson,
  useOnlineStatus,
  useNotification
} from '@/hooks';
import FormSubmissionError from '@/components/common/FormSubmissionError';
import StandardDialog from '@/components/common/StandardDialog';
import { TEXT_LENGTH_LIMITS } from '@/utils/textLengthLimits';
import OrganizationBasicFields from './Organization/OrganizationBasicFields';
import { defaultOrganizationValues } from './Organization/formValues';
import { makeOrganizationData } from './Organization/transformers';
import InputText from './utils/InputText';
import LicenseBox from './utils/LicenseBox';
import { FormActionRow, FormRow } from './utils/FormContainers';

// Mount a fresh dialog for each creation. Its form lives in a portal, so the
// surrounding form stays mounted without nested HTML forms.
const RelatedEntityDialog = ({
  entityType,
  defaultName = '',
  defaultType = '',
  onSelect,
  onClose
}) => {
  const { formatMessage } = useIntl();
  const titleId = useId();
  const descriptionId = useId();
  const { locale, AVAILABLE_LANGUAGES } = useSelector(state => state.intl);
  const isOrganization = entityType === 'organizations';
  const createOrganization = useCreateOrganization({
    errorPresentation: 'inline'
  });
  const createPerson = useCreatePerson({ errorPresentation: 'inline' });
  const mutation = isOrganization ? createOrganization : createPerson;
  const isOnline = useOnlineStatus();
  const { onSuccess } = useNotification();
  const submittingRef = useRef(false);
  const errorRef = useRef(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      organization: {
        ...defaultOrganizationValues,
        name: defaultName,
        type: defaultType,
        language: AVAILABLE_LANGUAGES[locale].id
      },
      name: '',
      surname: isOrganization ? '' : defaultName
    }
  });
  const isPending = mutation.isPending || isSubmitting;

  const handleClose = () => {
    if (isPending || submittingRef.current) return;
    onClose();
  };

  const handleCreate = async data => {
    if (!isOnline || submittingRef.current || mutation.isPending) return;
    submittingRef.current = true;
    try {
      const payload = isOrganization
        ? makeOrganizationData({
            organization: {
              ...data.organization,
              name: data.organization.name.trim()
            }
          })
        : { name: data.name.trim(), surname: data.surname.trim() };
      const entity = await mutation.mutateAsync(payload);
      onSelect(entity);
      onSuccess(formatMessage({ id: 'entityCreation.created' }));
    } catch {
      // The mutation keeps its structured error; preserve every field for retry.
      requestAnimationFrame(() =>
        errorRef.current?.scrollIntoView?.({ block: 'nearest' })
      );
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <StandardDialog
      open
      fullScreenOnMobile
      disableAutoFocus
      disableRestoreFocus
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClose={handleClose}
      isBusy={isPending}
      dividers
      stackActionsOnMobile={false}
      title={formatMessage({
        id: isOrganization
          ? 'entityCreation.organization'
          : 'entityCreation.author'
      })}
      actions={
        <FormActionRow
          isNew
          isSubmitting={isPending}
          isCancelDisabled={isPending}
          onCancel={handleClose}
          submitLabel={formatMessage({
            id: 'entityCreation.createAndSelect'
          })}
          submitTestId="create-related-entity"
          sx={{ m: 0 }}
        />
      }
      slotProps={{
        paper: {
          component: 'form',
          tabIndex: -1,
          noValidate: true,
          'data-testid': 'related-entity-dialog',
          onSubmit: event => {
            // React portal events still bubble to the surrounding form.
            event.stopPropagation();
            handleSubmit(handleCreate)(event);
          }
        },
        transition: {
          // Focus once on entry, without scrolling the page behind the
          // portal or overriding validation focus after the transition.
          onEnter: node => {
            const name = isOrganization ? 'organization.name' : 'name';
            node.querySelector(`input[name="${name}"]`)?.focus({
              preventScroll: true
            });
          }
        }
      }}>
      <Typography
        id={descriptionId}
        variant="body2"
        color="text.secondary"
        sx={{ mb: 2 }}>
        {formatMessage({
          id: isOrganization
            ? 'entityCreation.organizationHelp'
            : 'entityCreation.authorHelp'
        })}
      </Typography>
      <Box
        component="fieldset"
        disabled={isPending}
        inert={isPending}
        sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
        <Box ref={errorRef}>
          <FormSubmissionError error={mutation.error} />
        </Box>
        {isOrganization ? (
          <OrganizationBasicFields control={control} errors={errors} />
        ) : (
          <Box sx={{ display: 'grid', gap: 2 }}>
            {defaultName && (
              <Typography variant="body2">
                {formatMessage(
                  { id: 'entityCreation.searchedName' },
                  { name: defaultName }
                )}
              </Typography>
            )}
            <FormRow>
              <InputText
                control={control}
                formKey="name"
                labelName="entityCreation.firstName"
                isRequired
                isError={!!errors.name}
                maxLength={TEXT_LENGTH_LIMITS.PERSON_FIRST_NAME}
                validatorFn={value =>
                  !!value.trim() || formatMessage({ id: 'Required' })
                }
              />
              <InputText
                control={control}
                formKey="surname"
                labelName="Surname"
                isRequired
                isError={!!errors.surname}
                maxLength={TEXT_LENGTH_LIMITS.PERSON_LAST_NAME}
                validatorFn={value =>
                  !!value.trim() || formatMessage({ id: 'Required' })
                }
              />
            </FormRow>
          </Box>
        )}
      </Box>
      <LicenseBox />
    </StandardDialog>
  );
};

RelatedEntityDialog.propTypes = {
  entityType: PropTypes.oneOf(['persons', 'organizations']).isRequired,
  defaultName: PropTypes.string,
  defaultType: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default RelatedEntityDialog;
