import { useState } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import {
  useOnlineStatus,
  useCreateOrganization,
  useUpdateOrganization,
  useUpdateName
} from '@/hooks';
import FormSubmissionError from '@/components/common/FormSubmissionError';
import FormProgressInfo from '../utils/FormProgressInfo';
import { normelizeCoordinate } from '../utils/InputCoordinate';
import OrganizationFields from './OrganizationFields';
import LicenseBox from '../utils/LicenseBox';
import {
  makePostOrganizationData,
  makePutOrganizationData
} from './transformers';
import { FormContainer, FormActionRow } from '../utils/FormContainers';

const defaultOrganizationValues = {
  name: '',
  type: '',
  isPartner: false,
  customMessage: '',
  description: '',
  descriptionTitle: '',
  language: '',
  address: '',
  addressLine2: '',
  zipCode: '',
  city: '',
  country: 'FR',
  phone: '',
  mail: '',
  url: '',
  latitude: '',
  longitude: '',
  logo: ''
};

export const OrganizationForm = ({ organizationValues = null, onCancel }) => {
  const isNewOrganization = !organizationValues;
  const createOrganizationMutation = useCreateOrganization();
  const updateOrganizationMutation = useUpdateOrganization();
  const organizationMutation = isNewOrganization
    ? createOrganizationMutation
    : updateOrganizationMutation;
  const {
    error: organizationError,
    isPending: organizationLoading,
    data: organizationData
  } = organizationMutation;
  const updateNameMutation = useUpdateName();
  const nameError = updateNameMutation.error;
  const nameLoading = updateNameMutation.isPending;
  const isOnline = useOnlineStatus();
  const [isSaved, setIsSaved] = useState(false);

  const { locale, AVAILABLE_LANGUAGES } = useSelector(state => state.intl);

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting }
  } = useForm({
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      organization: {
        ...defaultOrganizationValues,
        language: AVAILABLE_LANGUAGES[locale].id,
        ...organizationValues,
        type: organizationValues?.type ?? ''
      }
    }
  });

  const onSubmit = async data => {
    if (!isOnline || organizationLoading || nameLoading) return;
    const normalizedData = {
      organization: {
        ...data.organization,
        longitude: normelizeCoordinate(data.organization.longitude),
        latitude: normelizeCoordinate(data.organization.latitude)
      }
    };

    try {
      if (isNewOrganization) {
        await createOrganizationMutation.mutateAsync(
          makePostOrganizationData(normalizedData)
        );
      } else {
        if (data.organization.name !== organizationValues.name) {
          await updateNameMutation.mutateAsync({
            id: organizationValues.nameId,
            name: data.organization.name
          });
        }
        await updateOrganizationMutation.mutateAsync(
          makePutOrganizationData(normalizedData, organizationValues)
        );
      }
      setIsSaved(true);
    } catch {
      // The mutation retains the structured error; keep the form for correction.
    }
  };

  if (isSaved) {
    return (
      <FormProgressInfo
        isLoading={organizationLoading || nameLoading || !organizationData}
        isError={!!(organizationError || nameError)}
        labelLoading={
          isNewOrganization
            ? 'Creating organization...'
            : 'Updating organization...'
        }
        labelError={
          isNewOrganization
            ? 'An error occurred when creating a organization.'
            : 'An error occurred when updating a organization.'
        }
        resetFn={() => setIsSaved(false)}
        getRedirectFn={() => `/ui/organizations/${organizationData.id}`}
      />
    );
  }

  return (
    <FormContainer>
      <form noValidate autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <FormSubmissionError error={organizationError || nameError} />
        <OrganizationFields
          isNewOrganization={isNewOrganization}
          control={control}
          errors={errors}
        />
        <FormActionRow
          isNew={isNewOrganization}
          isSubmitting={isSubmitting || organizationLoading || nameLoading}
          onCancel={onCancel}
        />
      </form>
      <LicenseBox />
    </FormContainer>
  );
};

OrganizationForm.propTypes = {
  organizationValues: PropTypes.shape({}),
  onCancel: PropTypes.func
};

export default OrganizationForm;
