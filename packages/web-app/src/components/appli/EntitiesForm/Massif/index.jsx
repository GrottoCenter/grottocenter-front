import React, { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';

import { postMassif } from '../../../../actions/Massif/CreateMassif';
import { updateMassif } from '../../../../actions/Massif/UpdateMassif';
import { updateDescription } from '../../../../actions/Description/UpdateDescription';
import { postDescription } from '../../../../actions/Description/CreateDescription';
import { updateName } from '../../../../actions/Name';
import { FormContainer, FormActionRow } from '../utils/FormContainers';
import LicenseBox from '../utils/LicenseBox';
import { MassifTypes } from '../../../../types/massif.type';
import FormProgressInfo from '../utils/FormProgressInfo';

import MassifFields from './MassifFields';

const defaultMassifValues = {
  name: '',
  language: '',
  descriptionId: null,
  descriptionTitle: '',
  descriptionBody: '',
  geogPolygon: null
};

export const MassifForm = ({ massifValues }) => {
  const isNewMassif = !massifValues;
  const isNewDescription = massifValues?.descriptions?.length === 0 ?? true;

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

  const geoJson = useMemo(
    () => JSON.parse(massifValues?.geogPolygon ?? null),
    [massifValues]
  );

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty, isSubmitting, isSubmitSuccessful }
  } = useForm({
    defaultValues: {
      massif: massifValues
        ? {
            nameId: massifValues.names[0]?.id,
            name: massifValues.names[0]?.name,
            language: massifValues.language,
            descriptionId: massifValues.descriptions[0]?.id,
            descriptionTitle: massifValues.descriptions[0]?.title,
            descriptionBody: massifValues.descriptions[0]?.body,
            geogPolygon: massifValues.geogPolygon
          }
        : defaultMassifValues
    }
  });

  const handleReset = useCallback(() => {
    reset({ massif: massifValues || defaultMassifValues });
  }, [massifValues, reset]);

  const onSubmit = async data => {
    if (isNewMassif) {
      dispatch(
        postMassif({
          name: data.massif.name,
          description: data.massif.descriptionBody,
          descriptionTitle: data.massif.descriptionTitle,
          descriptionAndNameLanguage: { id: data.massif.language },
          geogPolygon: data.massif.geoJson
        })
      );
    } else {
      if (data.massif.name !== massifValues.name) {
        dispatch(
          updateName({
            id: data.massif.nameId,
            name: data.massif.name
          })
        );
      }

      if (
        data.massif.descriptionBody !== massifValues.descriptionBody ||
        data.massif.descriptionTitle !== massifValues.descriptionTitle
      ) {
        if (isNewDescription) {
          dispatch(
            postDescription({
              body: data.massif.descriptionBody,
              language: data.massif.language,
              title: data.massif.descriptionTitle,
              massif: massifValues.id
            })
          );
        } else {
          dispatch(
            updateDescription({
              id: data.massif.descriptionId,
              body: data.massif.descriptionBody,
              title: data.massif.descriptionTitle
            })
          );
        }
      }

      const body = { id: massifValues.id };
      if (JSON.stringify(data.massif.geogPolygon) !== JSON.stringify(geoJson)) {
        body.geogPolygon = data.massif.geogPolygon;
      }
      dispatch(updateMassif(body));
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
          geoJson={geoJson}
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
  massifValues: MassifTypes
};

export default MassifForm;
