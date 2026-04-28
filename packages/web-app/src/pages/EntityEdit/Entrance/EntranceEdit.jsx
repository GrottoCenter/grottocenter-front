import React, { useEffect } from 'react';
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

  useEffect(() => {
    dispatch(fetchEntrance(entranceId));
  }, [entranceId, dispatch]);

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
