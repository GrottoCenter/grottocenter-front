import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import OrganizationTypeField from '@/components/common/OrganizationTypeField';
import { TEXT_LENGTH_LIMITS } from '@/utils/textLengthLimits';
import InputText from '../utils/InputText';
import InputCountry from '../utils/InputCountry';
import { FormRow } from '../utils/FormContainers';
import {
  validateOrganizationName,
  validateOrganizationUrl
} from './validation';

const OrganizationBasicFields = ({ control, errors }) => {
  const fieldErrors = errors?.organization;
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <InputText
        formKey="organization.name"
        labelName="Organization name"
        testId="organization-name"
        control={control}
        isError={!!fieldErrors?.name}
        isRequired
        maxLength={TEXT_LENGTH_LIMITS.ENTITY_NAME}
        validatorFn={validateOrganizationName}
      />
      <OrganizationTypeField control={control} name="organization.type" />
      <FormRow>
        <InputCountry
          control={control}
          formKey="organization.country"
          isRequired={false}
        />
        <InputText
          formKey="organization.city"
          labelName="City"
          control={control}
          isError={!!fieldErrors?.city}
          maxLength={TEXT_LENGTH_LIMITS.CITY}
        />
      </FormRow>
      <InputText
        formKey="organization.url"
        labelName="URL"
        control={control}
        isError={!!fieldErrors?.url}
        type="url"
        validatorFn={validateOrganizationUrl}
        maxLength={TEXT_LENGTH_LIMITS.URL}
      />
    </Box>
  );
};

OrganizationBasicFields.propTypes = {
  control: PropTypes.shape({}).isRequired,
  errors: PropTypes.shape({
    organization: PropTypes.objectOf(
      PropTypes.shape({ message: PropTypes.string })
    )
  })
};

export default OrganizationBasicFields;
