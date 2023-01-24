import React, { useEffect, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { isNil } from 'ramda';
import { useDispatch, useSelector } from 'react-redux';
import { useGeolocation } from 'rooks';

import { updateEntrance } from '../../../../actions/Entrance/UpdateEntrance';
import { postEntrance } from '../../../../actions/Entrance/CreateEntrance';
import {
  postCaveAndEntrance,
  updateCaveAndEntrance
} from '../../../../actions/CaveAndEntrance';

import { FormContainer, FormActionRow } from '../utils/FormContainers';
import LicenseBox from '../utils/LicenseBox';
import FormProgressInfo from '../utils/FormProgressInfo';
import EditTypeSelection from './EditTypeSelection';
import EntranceDetail from './EntranceDetail';
import CaveDetail from './CaveDetail';
import { makeCaveData, makeEntranceData } from './transformers';
import { ENTRANCE_ONLY, ENTRANCE_AND_CAVE } from './caveType';

const defaultCaveValues = {
  language: '',
  name: '',
  descriptions: [],
  isDiving: false,
  depth: '',
  length: '',
  temperature: '',
  massif: '',
  country: 'FR'
};

const defaultEntranceValues = {
  name: '',
  description: '',
  descriptionTitle: '',
  isSensitive: false,
  language: '',
  latitude: '',
  longitude: '',
  country: 'FR',
  yearDiscovery: ''
};

export const EntranceForm = ({ caveValues = null, entranceValues = null }) => {
  const isNewEntrance = entranceValues === null || caveValues === null;
  const geolocation = useGeolocation();
  const latitude = geolocation?.lat;
  const longitude = geolocation?.lng;

  const { locale, AVAILABLE_LANGUAGES } = useSelector(state => state.intl);

  defaultCaveValues.language = AVAILABLE_LANGUAGES[locale].id;
  defaultEntranceValues.language = AVAILABLE_LANGUAGES[locale].id;
  const {
    error: entranceError,
    loading: entranceLoading,
    data: entranceData
  } = useSelector(state =>
    isNewEntrance ? state.createEntrance : state.updateEntrance
  );
  const { error: caveError, loading: caveLoading } = useSelector(state =>
    isNewEntrance ? state.createCave : state.updateCave
  );
  const dispatch = useDispatch();
  const entityTypeInitialValue = useMemo(
    () =>
      caveValues?.entrances.length > 1 ? ENTRANCE_ONLY : ENTRANCE_AND_CAVE,
    [caveValues?.entrances.length]
  );
  const [entityType, setEntityType] = useState(entityTypeInitialValue);

  const {
    handleSubmit,
    reset,
    control,
    getValues,
    formState: { errors, isDirty, isSubmitting, isSubmitSuccessful }
  } = useForm({
    defaultValues: {
      entrance: entranceValues || defaultEntranceValues,
      cave: caveValues || defaultCaveValues
    }
  });

  // TODO set latitude & longitude from the selected Entry
  // TODO set country from position
  useEffect(() => {
    if (isNil(entranceValues?.latitude) || isNil(entranceValues?.longitude)) {
      const values = getValues();
      reset({
        ...values,
        entrance: {
          ...values.entrance,
          latitude,
          longitude
        }
      });
    }
  }, [entranceValues, getValues, latitude, longitude, reset]);

  const handleUpdateEntityType = type => {
    setEntityType(type);
    reset({ ...getValues() });
  };

  const handleReset = useCallback(() => {
    reset({ cave: defaultCaveValues, entrance: defaultEntranceValues });
  }, [reset]);

  const onSubmit = async data => {
    const caveData = {
      ...makeCaveData(data),
      id: caveValues?.id
    };
    const entranceDataFmt = {
      ...makeEntranceData(data, entityType),
      id: entranceValues?.id
    };

    if (isNewEntrance) {
      if (entityType === ENTRANCE_AND_CAVE) {
        dispatch(postCaveAndEntrance(caveData, entranceDataFmt));
      } else {
        dispatch(postEntrance(entranceDataFmt));
      }
    } else if (entityType === ENTRANCE_AND_CAVE) {
      dispatch(updateCaveAndEntrance(caveData, entranceDataFmt));
    } else {
      dispatch(updateEntrance(entranceDataFmt));
    }
  };

  if (isSubmitSuccessful) {
    return (
      <FormProgressInfo
        isLoading={
          caveLoading || entranceLoading || (isNewEntrance && !entranceData)
        }
        isError={!!(entranceError || caveError)}
        labelLoading={
          isNewEntrance ? 'Creating entrance...' : 'Updating entrance...'
        }
        labelError="A server error occurred"
        resetFn={handleReset}
        getRedirectFn={() =>
          isNewEntrance ? `/ui/entrances/${entranceData.id}` : ''
        }
      />
    );
  }

  return (
    <FormContainer>
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <EditTypeSelection
          control={control}
          errors={errors}
          entityType={entityType}
          updateEntityType={handleUpdateEntityType}
          allowMoveFromCave={!isNewEntrance}
          entranceId={entranceValues?.id}
          reset={handleReset}
          disabled={!isNewEntrance}
        />
        <EntranceDetail
          control={control}
          errors={errors}
          getValues={getValues}
        />
        <CaveDetail
          control={control}
          errors={errors}
          isReadonly={!isNewEntrance && entityType === ENTRANCE_ONLY}
        />
        <FormActionRow
          isDirty={isDirty}
          isNew={isNewEntrance}
          isSubmitting={isSubmitting}
          onReset={handleReset}
          isResetAllowed={isNewEntrance}
        />
      </form>

      <LicenseBox />
    </FormContainer>
  );
};

EntranceForm.propTypes = {
  entranceValues: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    descriptionTitle: PropTypes.string,
    language: PropTypes.string,
    latitude: PropTypes.number,
    longitude: PropTypes.number
  }),
  caveValues: PropTypes.shape({
    name: PropTypes.string,
    language: PropTypes.string,
    isDiving: PropTypes.bool,
    depth: PropTypes.number,
    length: PropTypes.number
  })
};

export default EntranceForm;
