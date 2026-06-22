import React, { useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEntrance } from '../../../actions/Entrance/GetEntrance';
import { EntranceForm } from '../../../components/appli/EntitiesForm';
import Layout from '../../../components/common/Layouts/Fixed/FixedContent';
import Translate from '../../../components/common/Translate';

const EntranceEdit = () => {
  const { entranceId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();

  const { data: entrance, error } = useSelector(state => state.entrance);
  const entranceDataId = useSelector(state => state.entrance.data?.id);
  const fetchedForRef = useRef(null);

  useEffect(() => {
    // Skip fetch if Redux already holds fresh data for this entrance.
    // Trade-off: data could be stale if another session edited it concurrently,
    // but this is acceptable — the entrance view page will refetch after save anyway.
    // fetchedForRef guards against a double-dispatch: FETCH_ENTRANCE_LOADING sets
    // data=undefined, which would re-trigger this effect via entranceDataId changing.
    if (String(entranceDataId) === String(entranceId)) return;
    if (fetchedForRef.current === entranceId) return;
    fetchedForRef.current = entranceId;
    dispatch(fetchEntrance(entranceId));
  }, [entranceId, dispatch, entranceDataId]);

  const isStale = entrance && String(entrance.id) !== String(entranceId);

  return (
    <Layout
      title={
        entrance?.name ||
        formatMessage({ id: 'Loading the entrance data...' })
      }
      content={
        error ? (
          <Translate>
            Error, the entrance data you are looking for is not available.
          </Translate>
        ) : !entrance || isStale ? (
          <CircularProgress />
        ) : (
          <EntranceForm
            onCancel={() => navigate(`/ui/entrances/${entranceId}`)}
            entranceValues={{
              country: entrance.country,
              depth: entrance.depth,
              length: entrance.length,
              id: entrance.id,
              isSensitive: entrance.isSensitive,
              hasBat: entrance.hasBat,
              dangerFlooding: entrance.dangerFlooding,
              dangerCo2: entrance.dangerCo2,
              dangerRockfall: entrance.dangerRockfall,
              dangerPollution: entrance.dangerPollution,
              needCleanGear: entrance.needCleanGear,
              needStayOnTrail: entrance.needStayOnTrail,
              hasRules: entrance.hasRules,
              isTouristic: entrance.isTouristic,
              name: entrance.name,
              language: entrance.language,
              latitude: entrance.latitude,
              longitude: entrance.longitude,
              altitude: entrance.altitude,
              yearDiscovery: entrance.discoveryYear
            }}
            caveValues={{
              ...entrance.cave,
              name: entrance.cave?.name,
              language: entrance.cave?.language
            }}
          />
        )
      }
    />
  );
};

export default EntranceEdit;
