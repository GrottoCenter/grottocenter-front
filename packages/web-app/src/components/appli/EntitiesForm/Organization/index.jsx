import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  useOnlineStatus,
  useCreateOrganization,
  useUpdateOrganization
} from '@/hooks';
import FormSubmissionError from '@/components/common/FormSubmissionError';
import OrganizationFields from './OrganizationFields';
import LicenseBox from '../utils/LicenseBox';
import { makeOrganizationData } from './transformers';
import { FormContainer, FormActionRow } from '../utils/FormContainers';

const defaultOrganizationValues = {
  name: '',
  type: '',
  customMessage: '',
  language: '',
  address: '',
  zipCode: '',
  city: '',
  country: 'FR',
  mail: '',
  url: '',
  latitude: '',
  longitude: ''
};

export const OrganizationForm = ({ organizationValues = null, onCancel }) => {
  const isNewOrganization = !organizationValues;
  const createOrganizationMutation = useCreateOrganization();
  const updateOrganizationMutation = useUpdateOrganization();
  const organizationMutation = isNewOrganization
    ? createOrganizationMutation
    : updateOrganizationMutation;
  const { error: organizationError, isPending: organizationLoading } =
    organizationMutation;
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();

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
    if (!isOnline || organizationLoading) return;
    try {
      const organization = await organizationMutation.mutateAsync(
        makeOrganizationData(data)
      );
      navigate(`/ui/organizations/${organization.id}`);
    } catch {
      // The mutation retains the structured error; keep the form for correction.
    }
  };

  return (
    <FormContainer>
      <form noValidate autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <FormSubmissionError error={organizationError} />
        <OrganizationFields control={control} errors={errors} />
        <FormActionRow
          isNew={isNewOrganization}
          isSubmitting={isSubmitting || organizationLoading}
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
