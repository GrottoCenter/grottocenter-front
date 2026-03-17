import React, { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';

import { postMassif } from '../../../../actions/Massif/CreateMassif';
import { updateMassif } from '../../../../actions/Massif/UpdateMassif';
import { updateName } from '../../../../actions/Name';
import { FormContainer, FormActionRow } from '../utils/FormContainers';
import LicenseBox from '../utils/LicenseBox';
import { MassifTypes } from '../../../../types/massif.type';
import FormProgressInfo from '../utils/FormProgressInfo';

import MassifFields from './MassifFields';

const defaultMassifValues = {
  name: '',
  language: '',
  descriptionTitle: '',
  descriptionBody: '',
  geogPolygon: null
};

export const MassifForm = ({ massifValues }) => {
  const { formatMessage } = useIntl();
  const isNewMassif = !massifValues;

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
            geogPolygon: massifValues.geogPolygon
          }
        : defaultMassifValues
    }
  });

  const handleReset = useCallback(() => {
    reset(undefined, { keepValues: true, keepErrors: false });
  }, [reset]);

  const handleFormSubmit = e => {
    const editingElements = document.querySelectorAll('.leaflet-editing-icon');
    const visibleEditingElements = Array.from(editingElements).filter(
      el => el.offsetParent !== null && getComputedStyle(el).display !== 'none'
    );
    if (visibleEditingElements.length > 0) {
      e.preventDefault();
      alert(
        formatMessage({
          id: 'Please finish editing the polygon before submitting.'
        })
      );
      return;
    }
    handleSubmit(onSubmit)(e);
  };

  const onSubmit = async data => {
    if (data.massif.geogPolygon?.coordinates?.length === 0) {
      return;
    }

    if (isNewMassif) {
      dispatch(
        postMassif({
          name: data.massif.name,
          description: data.massif.descriptionBody,
          descriptionTitle: data.massif.descriptionTitle,
          descriptionAndNameLanguage: { id: data.massif.language },
          geogPolygon: data.massif.geogPolygon
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
          (massifLoading || nameLoading) && !(massifError || nameError)
        }
        isError={!!(massifError || nameError)}
        labelLoading={isNewMassif ? 'Creating massif...' : 'Updating massif...'}
        labelError={
          massifError?.message ||
          nameError?.message ||
          (isNewMassif
            ? 'An error occurred when creating a massif.'
            : 'An error occurred when updating a massif.')
        }
        resetFn={handleReset}
        getRedirectFn={() => (massifData ? `/ui/massifs/${massifData.id}` : '')}
      />
    );
  }

  return (
    <FormContainer>
      <form autoComplete="off" onSubmit={handleFormSubmit}>
        <MassifFields
          control={control}
          errors={errors}
          geoJson={geoJson}
          isNew={isNewMassif}
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
