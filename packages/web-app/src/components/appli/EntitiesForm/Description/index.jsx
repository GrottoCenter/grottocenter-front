import PropTypes from 'prop-types';
import { DescriptionPropTypes } from '@/types/description.type';
import TextContributionForm from '../utils/TextContributionForm';

const CreateDescriptionForm = ({
  closeForm,
  onSubmit,
  values,
  isNewDescription
}) => (
  <TextContributionForm
    closeForm={closeForm}
    onSubmit={onSubmit}
    values={values}
    isNew={isNewDescription}
  />
);

CreateDescriptionForm.propTypes = {
  closeForm: PropTypes.func,
  isNewDescription: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  values: DescriptionPropTypes
};

export default CreateDescriptionForm;
