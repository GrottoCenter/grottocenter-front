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
import { useIntl } from 'react-intl';
import { usePermissions, useNotification } from '../../../../hooks';
import FormProgressInfo from '../utils/FormProgressInfo';
import LicenseBox from '../utils/LicenseBox';
import EditTypeSelection from './EditTypeSelection';
import EntranceDetail from './EntranceDetail';
import CaveDetail from './CaveDetail';
import EntranceAttributes from './EntranceAttributes';
import NetworkLinkSection from './NetworkLinkSection';
import NetworkMembershipSection from './NetworkMembershipSection';
import {
  makeCaveData,
  makeEntranceData,
  hasCaveChanged,
  hasEntranceChanged
} from './transformers';
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
  const { formatMessage } = useIntl();
  const { onInfo } = useNotification();
  const entityTypeInitialValue = useMemo(
    () =>
      caveValues?.entrances?.length > 1 ? ENTRANCE_ONLY : ENTRANCE_AND_CAVE,
    [caveValues?.entrances?.length]
  );
  const [entityType, setEntityType] = useState(entityTypeInitialValue);
  // The name of the cave/network selected via search in create mode (edit
  // mode already knows it statically from caveValues). Not a form value: used
  // only to render a named link to that network in CaveDetail.
  const [selectedCave, setSelectedCave] = useState(null);
  const { isAdmin } = usePermissions();
  const isSensitiveDisabled =
    !isAdmin && (entranceValues?.isSensitive ?? false);

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

  const [
    lat,
    lng,
    caveName,
    caveLanguage,
    entranceName,
    entranceLanguage,
    caveId
  ] = watch([
    'entrance.latitude',
    'entrance.longitude',
    'cave.name',
    'cave.language',
    'entrance.name',
    'entrance.language',
    'cave.id'
  ]);

  const isSubmitDisabled =
    (!isSensitiveDisabled && (isCoordEmpty(lat) || isCoordEmpty(lng))) ||
    (entityType === ENTRANCE_AND_CAVE
      ? !caveName || !caveLanguage
      : !caveId || !entranceName || !entranceLanguage);

  const handleUpdateEntityType = type => {
    setEntityType(type);
    const values = getValues();
    // Clear any previously linked network's data on every toggle (both
    // directions): otherwise cave.id/depth/length/... from an earlier search
    // selection lingers in the form even after the search box is cleared or
    // the checkbox is unchecked and rechecked, showing a stale "shared
    // network" link/values for a network that's no longer actually selected.
    reset({
      ...values,
      cave: {
        ...values.cave,
        id: null,
        depth: null,
        length: null,
        temperature: null,
        isDiving: false
      }
    });
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
        !hasCaveChanged(caveData, caveValues);

      const entranceUnchanged = !hasEntranceChanged(
        entranceDataFmt,
        entranceValues
      );

      if (caveUnchanged && entranceUnchanged) {
        onInfo(formatMessage({ id: 'No changes detected' }));
        return;
      }
      if (entityType === ENTRANCE_AND_CAVE && !caveUnchanged) {
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
          isNewEntrance={isNewEntrance}
        />
        <EntranceDetail
          control={control}
          errors={errors}
          getValues={getValues}
          isNewEntrance={isNewEntrance}
        />
        {isNewEntrance ? (
          <NetworkLinkSection
            control={control}
            errors={errors}
            entityType={entityType}
            updateEntityType={handleUpdateEntityType}
            reset={handleReset}
            selectedCave={selectedCave}
            onSelectedCaveChange={setSelectedCave}
          />
        ) : (
          <NetworkMembershipSection
            entranceId={entranceValues?.id}
            isNetwork={entityType === ENTRANCE_ONLY}
            networkSize={caveValues?.entrances?.length}
            caveId={caveValues?.id}
            caveName={caveValues?.name}
          />
        )}
        <CaveDetail
          control={control}
          errors={errors}
          isReadonly={entityType === ENTRANCE_ONLY}
          isShared={entityType === ENTRANCE_ONLY}
          caveId={caveId}
          caveName={isNewEntrance ? selectedCave?.name : caveValues?.name}
        />
        <EntranceAttributes control={control} />
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
