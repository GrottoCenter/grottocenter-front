import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { updateName } from '../../../../actions/Name';
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

export const OrganizationForm = ({ organizationValues = null }) => {
  const isNewOrganization = !organizationValues;
  const {
    error: organizationError,
    isLoading: organizationLoading,
    data: organizationData
  } = useSelector(state =>
    isNewOrganization ? state.createOrganization : state.updateOrganization
  );
  const { error: nameError, loading: nameLoading } = useSelector(
    state => state.updateName
  );

  const { locale, AVAILABLE_LANGUAGES } = useSelector(state => state.intl);
  defaultOrganizationValues.language = AVAILABLE_LANGUAGES[locale].id;

  const dispatch = useDispatch();

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty, isSubmitting, isSubmitSuccessful }
  } = useForm({
    defaultValues: {
      organization: organizationValues || defaultOrganizationValues
    }
  });

  const handleReset = useCallback(() => {
    reset({ organization: organizationValues || defaultOrganizationValues });
  }, [organizationValues, reset]);

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
        dispatch(
          updateName({
            id: organizationValues.nameId,
            name: data.organization.name
          })
        );
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
            ? 'An error occurred when creating a organzation.'
            : 'An error occurred when updating a organzation.'
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
          isDirty={isDirty}
          isNew={isNewOrganization}
          isSubmitting={isSubmitting}
          onReset={handleReset}
        />
      </form>
      <LicenseBox />
    </FormContainer>
  );
};

OrganizationForm.propTypes = {
  organizationValues: PropTypes.shape({})
};

export default OrganizationForm;
