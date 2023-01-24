import React, { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import { updateCave } from '../../../../actions/Cave/UpdateCave';
import { FormContainer, FormActionRow, FormRow } from '../utils/FormContainers';
import InputText from '../utils/InputText';
import InputLanguage from '../utils/InputLanguage';
import FormProgressInfo from '../utils/FormProgressInfo';
import CaveDetail from '../Entrance/CaveDetail';
import makeNetworkData from './transformers';

// A Network can't be created. It's always starting with an entrance with a cave and then,
// entrance are being attached to the initial cave to form a network.
export const NetworkForm = ({ networkValues }) => {
  const {
    error: networkError,
    loading: networkLoading,
    data: networkData
  } = useSelector(state => state.updateCave);

  const dispatch = useDispatch();
  const defaultNetworkValue = useRef({ ...networkValues });

  const { locale, AVAILABLE_LANGUAGES } = useSelector(state => state.intl);
  if (!defaultNetworkValue.current.language)
    defaultNetworkValue.current.language = AVAILABLE_LANGUAGES[locale].id;

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty, isSubmitting, isSubmitSuccessful }
  } = useForm({
    defaultValues: {
      cave: defaultNetworkValue.current
    }
  });

  const handleReset = useCallback(() => {
    reset({ cave: defaultNetworkValue.current });
  }, [defaultNetworkValue, reset]);

  const onSubmit = async data => {
    dispatch(updateCave(makeNetworkData(data.cave)));
  };

  if (isSubmitSuccessful) {
    return (
      <FormProgressInfo
        isLoading={networkLoading || !networkData}
        isError={!!networkError}
        labelLoading="Updating network..."
        labelError="'An error occurred when updating the network!'"
        resetFn={handleReset}
        getRedirectFn={() => `/ui/caves/${networkData.id}`}
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

        <CaveDetail control={control} errors={errors} />

        <FormActionRow
          isDirty={isDirty}
          isNew={false}
          isSubmitting={isSubmitting}
          onReset={handleReset}
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
    isDivingCave: PropTypes.bool,
    language: PropTypes.string.isRequired,
    length: PropTypes.number,
    name: PropTypes.string.isRequired,
    temperature: PropTypes.number
  }).isRequired
};

export default NetworkForm;
