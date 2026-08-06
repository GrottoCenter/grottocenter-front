import { useIntl } from 'react-intl';
import { CircularProgress } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useEntrance } from '../../../hooks';
import { EntranceForm } from '../../../components/appli/EntitiesForm';
import Layout from '../../../components/common/Layouts/Fixed/FixedContent';
import Translate from '../../../components/common/Translate';

const EntranceEdit = () => {
  const { entranceId } = useParams();
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const { data: entrance, error } = useEntrance(entranceId);

  let content;
  if (error) {
    content = (
      <Translate>
        Error, the entrance data you are looking for is not available.
      </Translate>
    );
  } else if (!entrance) {
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
          isSensitiveLocked: entrance.isSensitiveLocked,
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
