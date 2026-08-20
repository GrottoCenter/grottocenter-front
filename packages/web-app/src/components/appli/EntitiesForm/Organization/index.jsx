import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useUpdateName } from '../../../../hooks';
import { postOrganization } from '../../../../actions/Organization/CreateOrganization';
import { updateOrganization } from '../../../../actions/Organization/UpdateOrganization';
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
  const {
    error: organizationError,
    isLoading: organizationLoading,
    data: organizationData
  } = useSelector(state =>
    isNewOrganization ? state.createOrganization : state.updateOrganization
  );
  const updateNameMutation = useUpdateName();
  const nameError = updateNameMutation.error;
  const nameLoading = updateNameMutation.isPending;

  const { locale, AVAILABLE_LANGUAGES } = useSelector(state => state.intl);
  defaultOrganizationValues.language = AVAILABLE_LANGUAGES[locale].id;

  const dispatch = useDispatch();

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
      dispatch(postOrganization(organizationToPost));
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
      dispatch(updateOrganization(organizationToUpdate));
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
