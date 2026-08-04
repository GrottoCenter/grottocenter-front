import { useEffect } from 'react';
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
    // Skip fetch if Redux already holds fresh data for this entrance (navigating
    // from the entrance view). Trade-off: data could be stale if another session
    // edited it concurrently, but the entrance view page will refetch after save.
    // entrance is intentionally excluded from deps — we only want to run when
    // entranceId changes, not when Redux state updates mid-flight.
    if (String(entrance?.id) === String(entranceId)) return;
    dispatch(fetchEntrance(entranceId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entranceId, dispatch]);

  const isStale = entrance && String(entrance.id) !== String(entranceId);

  let content;
  if (error) {
    content = (
      <Translate>
        Error, the entrance data you are looking for is not available.
      </Translate>
    );
  } else if (!entrance || isStale) {
    content = <CircularProgress />;
  } else {
    content = (
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
    );
  }

  return (
    <Layout
      title={
        entrance?.name || formatMessage({ id: 'Loading the entrance data...' })
      }
      content={content}
    />
  );
};

export default EntranceEdit;
