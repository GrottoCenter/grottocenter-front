import { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { useUpdateCave } from '../../../../hooks';
import { FormContainer, FormActionRow, FormRow } from '../utils/FormContainers';
import InputText from '../utils/InputText';
import InputLanguage from '../utils/InputLanguage';
import FormProgressInfo from '../utils/FormProgressInfo';
import CaveDetail from '../Entrance/CaveDetail';

// A Network can't be created. It's always starting with an entrance with a cave and then,
// entrance are being attached to the initial cave to form a network.
export const NetworkForm = ({ networkValues, onCancel }) => {
  const updateCaveMutation = useUpdateCave();
  const defaultNetworkValue = useRef({ ...networkValues });

  const { locale, AVAILABLE_LANGUAGES } = useSelector(state => state.intl);
  if (!defaultNetworkValue.current.language)
    defaultNetworkValue.current.language = AVAILABLE_LANGUAGES[locale].id;

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting, isSubmitSuccessful }
  } = useForm({
    defaultValues: {
      cave: defaultNetworkValue.current
    }
  });

  const handleReset = useCallback(() => {
    reset(undefined, { keepValues: true, keepErrors: false });
  }, [reset]);

  const onSubmit = async data => {
    updateCaveMutation.mutate({
      depth: data.cave.depth,
      id: data.cave.id,
      isDiving: data.cave.isDiving,
      length: data.cave.length,
      name: {
        language: data.cave.language,
        text: data.cave.name
      },
      temperature: data.cave.temperature
    });
  };

  if (isSubmitSuccessful) {
    return (
      <FormProgressInfo
        isLoading={updateCaveMutation.isPending || !updateCaveMutation.data}
        isError={updateCaveMutation.isError}
        labelLoading="Updating network..."
        labelError="'An error occurred when updating the network!'"
        resetFn={handleReset}
        getRedirectFn={() => `/ui/caves/${updateCaveMutation.data?.id}`}
      />
    );
  }

  return (
    <FormContainer>
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <FormRow>
          <InputText
            formKey="cave.name"
            labelName="Cave name"
            control={control}
            isError={!!errors?.cave?.name}
            isRequired
          />

          <InputLanguage
            formKey="cave.language"
            control={control}
            isError={!!errors?.cave?.language}
          />
        </FormRow>

        <CaveDetail
          control={control}
          errors={errors}
          showEntranceFields={false}
        />

        <FormActionRow
          isNew={false}
          isSubmitting={isSubmitting}
          onCancel={onCancel}
        />
      </form>
    </FormContainer>
  );
};

NetworkForm.propTypes = {
  networkValues: PropTypes.shape({
    depth: PropTypes.number,
    entrances: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired
      })
    ).isRequired,
    isDiving: PropTypes.bool,
    language: PropTypes.string.isRequired,
    length: PropTypes.number,
    name: PropTypes.string.isRequired,
    temperature: PropTypes.number
  }).isRequired,
  onCancel: PropTypes.func
};

export default NetworkForm;
