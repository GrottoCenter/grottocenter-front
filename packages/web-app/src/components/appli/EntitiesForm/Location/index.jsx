import PropTypes from 'prop-types';
import { LocationPropTypes } from '@/types/entrance.type';
import TextContributionForm from '../utils/TextContributionForm';

const CreateLocationForm = ({ closeForm, onSubmit, values, isNewLocation }) => (
  <TextContributionForm
    closeForm={closeForm}
    onSubmit={onSubmit}
    values={values}
    isNew={isNewLocation}
  />
);

CreateLocationForm.propTypes = {
  closeForm: PropTypes.func,
  isNewLocation: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  values: LocationPropTypes
};

export default CreateLocationForm;
