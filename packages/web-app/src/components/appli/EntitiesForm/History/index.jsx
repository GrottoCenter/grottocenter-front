import PropTypes from 'prop-types';
import { HistoryPropTypes } from '@/types/entrance.type';
import TextContributionForm from '../utils/TextContributionForm';

const CreateHistoryForm = ({ closeForm, onSubmit, values, isNewHistory }) => (
  <TextContributionForm
    closeForm={closeForm}
    onSubmit={onSubmit}
    values={values}
    isNew={isNewHistory}
    hasTitle={false}
  />
);

CreateHistoryForm.propTypes = {
  closeForm: PropTypes.func,
  isNewHistory: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  values: HistoryPropTypes
};

export default CreateHistoryForm;
