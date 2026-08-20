import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import {
  useCreateOrganization,
  useUpdateOrganization,
  useUpdateName
} from '../../../../hooks';
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
  isPartner: false,
  customMessage: '',
  description: '',
  descriptionTitle: '',
  language: '',
  address: '',
  addressLine2: '',
  zipCode: null,
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

  const { locale, AVAILABLE_LANGUAGES } = useSelector(state => state.intl);
  defaultOrganizationValues.language = AVAILABLE_LANGUAGES[locale].id;

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting, isSubmitSuccessful }
  } = useForm({
    defaultValues: {
      organization: organizationValues || defaultOrganizationValues
    }
  });

  const handleReset = useCallback(() => {
    reset(undefined, { keepValues: true, keepErrors: false });
  }, [reset]);

  const onSubmit = async data => {
    /* eslint-disable no-param-reassign */
    if (data?.organization?.longitude)
      data.organization.longitude = normelizeCoordinate(
        data.organization.longitude
      );
    if (data?.organization?.latitude)
      data.organization.latitude = normelizeCoordinate(
        data.organization.latitude
      );
    /* eslint-enable no-param-reassign */

    if (isNewOrganization) {
      const organizationToPost = makePostOrganizationData(data);
      createOrganizationMutation.mutate(organizationToPost);
    } else {
      if (data.organization.name !== organizationValues) {
        updateNameMutation.mutate({
          id: organizationValues.nameId,
          name: data.organization.name
        });
      }

      const organizationToUpdate = makePutOrganizationData(
        data,
        organizationValues
      );
      updateOrganizationMutation.mutate(organizationToUpdate);
    }
  };

  if (isSubmitSuccessful) {
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
        resetFn={handleReset}
        getRedirectFn={() => `/ui/organizations/${organizationData.id}`}
      />
    );
  }

  return (
    <FormContainer>
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <OrganizationFields
          isNewOrganization={isNewOrganization}
          control={control}
          errors={errors}
        />
        <FormActionRow
          isNew={isNewOrganization}
          isSubmitting={isSubmitting}
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
