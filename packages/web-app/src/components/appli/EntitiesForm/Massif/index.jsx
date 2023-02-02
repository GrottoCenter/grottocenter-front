import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';

import { postMassif } from '../../../../actions/Massif/CreateMassif';
import { updateMassif } from '../../../../actions/Massif/UpdateMassif';
import { updateDescription } from '../../../../actions/Description/UpdateDescription';
import { postDescription } from '../../../../actions/Description/CreateDescription';
import { updateName } from '../../../../actions/Name';
import { FormContainer, FormActionRow } from '../utils/FormContainers';
import LicenseBox from '../utils/LicenseBox';
import FormProgressInfo from '../utils/FormProgressInfo';

import MassifFields from './MassifFields';
import { makeMassifPostData, makeMassifPutData } from './transformers';

const defaultMassifValues = {
  name: '',
  description: '',
  descriptionTitle: '',
  language: '',
  geoJson: null
};

export const MassifForm = ({ massifValues }) => {
  const isNewMassif = !massifValues;
  const isNewDescription = massifValues ? !massifValues.descriptionId : true;
  const {
    error: massifError,
    loading: massifLoading,
    data: massifData
  } = useSelector(state =>
    isNewMassif ? state.createMassif : state.updateMassif
  );
  const { error: nameError, loading: nameLoading } = useSelector(
    state => state.updateName
  );

  const { locale, AVAILABLE_LANGUAGES } = useSelector(state => state.intl);
  defaultMassifValues.language = AVAILABLE_LANGUAGES[locale].id;

  const { error: descriptionError, loading: descriptionLoading } = useSelector(
    state =>
      isNewDescription ? state.createDescription : state.updateDescription
  );

  const dispatch = useDispatch();

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty, isSubmitting, isSubmitSuccessful }
  } = useForm({
    defaultValues: {
      massif: massifValues ?? defaultMassifValues
    }
  });

  const handleReset = useCallback(() => {
    reset({ massif: massifValues || defaultMassifValues });
  }, [massifValues, reset]);

  const onSubmit = async data => {
    if (isNewMassif) {
      const massifToPost = makeMassifPostData(data);
      dispatch(postMassif(massifToPost));
    } else {
      if (data.massif.name !== massifValues.name) {
        dispatch(
          updateName({
            id: massifValues.nameId,
            name: data.massif.name
          })
        );
      }

      if (
        data.massif.description !== massifValues.description ||
        data.massif.descriptionTitle !== massifValues.descriptionTitle
      ) {
        if (isNewDescription) {
          dispatch(
            postDescription({
              body: data.massif.description,
              language: data.massif.language,
              title: data.massif.descriptionTitle,
              massifId: massifValues.massifId
            })
          );
        } else {
          dispatch(
            updateDescription({
              id: data.massif.descriptionId,
              body: data.massif.description,
              title: data.massif.descriptionTitle
            })
          );
        }
      }

      const massifToUpdate = makeMassifPutData(data, massifValues);
      dispatch(updateMassif(massifToUpdate));
    }
  };

  if (isSubmitSuccessful) {
    return (
      <FormProgressInfo
        isLoading={
          massifLoading || nameLoading || descriptionLoading || !massifData
        }
        isError={!!(massifError || nameError || descriptionError)}
        labelLoading={isNewMassif ? 'Creating massif...' : 'Updating massif...'}
        labelError={
          isNewMassif
            ? 'An error occurred when creating a massif.'
            : 'An error occurred when updating a massif.'
        }
        resetFn={handleReset}
        getRedirectFn={() => `/ui/massifs/${massifData.id}`}
      />
    );
  }

  return (
    <FormContainer>
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <MassifFields
          control={control}
          errors={errors}
          isNewDescription={isNewDescription}
          geoJson={
            massifValues ? massifValues.geoJson : defaultMassifValues.geoJson
          }
        />
        <FormActionRow
          isDirty={isDirty}
          isNew={isNewMassif}
          isSubmitting={isSubmitting}
          onReset={handleReset}
        />
      </form>
      <LicenseBox />
    </FormContainer>
  );
};

MassifForm.propTypes = {
  massifValues: PropTypes.shape({
    description: PropTypes.string,
    descriptionId: PropTypes.string,
    descriptionTitle: PropTypes.string,
    massifId: PropTypes.string,
    name: PropTypes.string,
    nameId: PropTypes.string,
    geoJson: PropTypes.string
  })
};

export default MassifForm;
