import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';

import { updateEntrance } from '../../../../actions/Entrance/UpdateEntrance';
import { postEntrance } from '../../../../actions/Entrance/CreateEntrance';
import {
  postCaveAndEntrance,
  updateCaveAndEntrance
} from '../../../../actions/CaveAndEntrance';

import { FormContainer, FormActionRow } from '../utils/FormContainers';
import { normelizeCoordinate } from '../utils/InputCoordinate';
import { usePermissions } from '../../../../hooks';
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
  massif: ''
};

const isCoordEmpty = v => v === '' || v === null || v === undefined;

const defaultEntranceValues = {
  name: '',
  description: '',
  descriptionTitle: '',
  isSensitive: false,
  hasBat: false,
  dangerFlooding: false,
  dangerCo2: false,
  dangerRockfall: false,
  dangerPollution: false,
  needCleanGear: false,
  needStayOnTrail: false,
  hasRules: false,
  isTouristic: false,
  language: '',
  latitude: '',
  longitude: '',
  altitude: '',
  yearDiscovery: ''
};

export const EntranceForm = ({
  caveValues = null,
  entranceValues = null,
  onCancel
}) => {
  const isNewEntrance = entranceValues === null || caveValues === null;

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
      caveValues?.entrances?.length > 1 ? ENTRANCE_ONLY : ENTRANCE_AND_CAVE,
    [caveValues?.entrances?.length]
  );
  const [entityType, setEntityType] = useState(entityTypeInitialValue);
  const { isAdmin } = usePermissions();
  const isSensitiveDisabled = !isAdmin && (entranceValues?.isSensitive ?? false);

  const defaultFormValues = useMemo(
    () => ({
      entrance: { ...defaultEntranceValues, ...(entranceValues ?? {}) },
      cave: caveValues || defaultCaveValues
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const {
    handleSubmit,
    reset,
    control,
    getValues,
    watch,
    formState: { errors, isSubmitting, isSubmitSuccessful }
  } = useForm({ defaultValues: defaultFormValues });

  const [lat, lng, caveName, caveLanguage, entranceName, entranceLanguage] =
    watch([
      'entrance.latitude',
      'entrance.longitude',
      'cave.name',
      'cave.language',
      'entrance.name',
      'entrance.language'
    ]);

  const isSubmitDisabled =
    (!isSensitiveDisabled && (isCoordEmpty(lat) || isCoordEmpty(lng))) ||
    (entityType === ENTRANCE_AND_CAVE
      ? !caveName || !caveLanguage
      : !entranceName || !entranceLanguage);

  const handleUpdateEntityType = type => {
    setEntityType(type);
    reset({ ...getValues() });
  };

  const handleReset = useCallback(() => {
    reset(undefined, { keepValues: true, keepErrors: false });
  }, [reset]);

  const onSubmit = async data => {
    /* eslint-disable no-param-reassign */
    if (data?.entrance?.longitude)
      data.entrance.longitude = normelizeCoordinate(data.entrance.longitude);
    if (data?.entrance?.latitude)
      data.entrance.latitude = normelizeCoordinate(data.entrance.latitude);
    /* eslint-enable no-param-reassign */

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
    } else {
      const caveUnchanged =
        entityType !== ENTRANCE_AND_CAVE ||
        (!!caveValues &&
          caveData.name.text === caveValues.name &&
          caveData.name.language === caveValues.language &&
          (caveData.depth || 0) === (Number(caveValues.depth) || 0) &&
          (caveData.length || 0) === (Number(caveValues.length) || 0) &&
          (caveData.temperature || 0) === (Number(caveValues.temperature) || 0) &&
          Boolean(caveData.isDiving) === Boolean(caveValues.isDiving));

      const entranceUnchanged =
        !!entranceValues &&
        entranceDataFmt.name.text === entranceValues.name &&
        entranceDataFmt.name.language === entranceValues.language &&
        Boolean(entranceDataFmt.isSensitive) === Boolean(entranceValues.isSensitive) &&
        Boolean(entranceDataFmt.hasBat) === Boolean(entranceValues.hasBat) &&
        Boolean(entranceDataFmt.dangerFlooding) === Boolean(entranceValues.dangerFlooding) &&
        Boolean(entranceDataFmt.dangerCo2) === Boolean(entranceValues.dangerCo2) &&
        Boolean(entranceDataFmt.dangerRockfall) === Boolean(entranceValues.dangerRockfall) &&
        Boolean(entranceDataFmt.dangerPollution) === Boolean(entranceValues.dangerPollution) &&
        Boolean(entranceDataFmt.needCleanGear) === Boolean(entranceValues.needCleanGear) &&
        Boolean(entranceDataFmt.needStayOnTrail) === Boolean(entranceValues.needStayOnTrail) &&
        Boolean(entranceDataFmt.hasRules) === Boolean(entranceValues.hasRules) &&
        Boolean(entranceDataFmt.isTouristic) === Boolean(entranceValues.isTouristic) &&
        (entranceDataFmt.altitude ?? null) === (entranceValues.altitude ? Number(entranceValues.altitude) : null) &&
        (entranceDataFmt.yearDiscovery ?? null) === (entranceValues.yearDiscovery ? Number(entranceValues.yearDiscovery) : null) &&
        (entranceDataFmt.longitude === undefined || String(entranceDataFmt.longitude) === String(entranceValues.longitude ?? '')) &&
        (entranceDataFmt.latitude === undefined || String(entranceDataFmt.latitude) === String(entranceValues.latitude ?? ''));

      if (caveUnchanged && entranceUnchanged) {
        // nothing to save
      } else if (entityType === ENTRANCE_AND_CAVE && !caveUnchanged) {
        dispatch(updateCaveAndEntrance(caveData, entranceDataFmt));
      } else {
        dispatch(updateEntrance(entranceDataFmt));
      }
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
          isNewEntrance
            ? `/ui/entrances/${entranceData.id}`
            : `/ui/entrances/${entranceValues.id}`
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
          isNew={isNewEntrance}
          isSubmitting={isSubmitting}
          disabled={isSubmitDisabled}
          onCancel={onCancel}
        />
      </form>

      <LicenseBox />
    </FormContainer>
  );
};

EntranceForm.propTypes = {
  entranceValues: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    description: PropTypes.string,
    descriptionTitle: PropTypes.string,
    language: PropTypes.string,
    latitude: PropTypes.number,
    longitude: PropTypes.number,
    isSensitive: PropTypes.bool,
    hasBat: PropTypes.bool,
    dangerFlooding: PropTypes.bool,
    dangerCo2: PropTypes.bool,
    dangerRockfall: PropTypes.bool,
    dangerPollution: PropTypes.bool,
    needCleanGear: PropTypes.bool,
    needStayOnTrail: PropTypes.bool,
    hasRules: PropTypes.bool,
    isTouristic: PropTypes.bool
  }),
  caveValues: PropTypes.shape({
    name: PropTypes.string,
    language: PropTypes.string,
    isDiving: PropTypes.bool,
    depth: PropTypes.number,
    length: PropTypes.number
  }),
  onCancel: PropTypes.func
};

export default EntranceForm;
