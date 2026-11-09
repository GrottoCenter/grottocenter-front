import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useQuery } from '@tanstack/react-query';
import { Stack, Typography } from '@mui/material';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import { apiGet } from '@/api/client';
import AppLink from '@/components/common/AppLink';
import {
  DELETED_ENTITY_RESOURCES,
  getDeletedEntityName
} from '@/utils/deletedEntities';

const MergeDestination = ({ resource, id }) => {
  const { formatMessage } = useIntl();
  const config = DELETED_ENTITY_RESOURCES[resource];
  const { data: destination, error } = useQuery({
    queryKey: config.keys.detail(id),
    queryFn: ({ signal }) =>
      apiGet(`${config.collectionUrl}/${id}`, { signal }),
    retry: false
  });
  return (
    <Stack
      direction="row"
      spacing={0.75}
      sx={{ alignItems: 'center', mt: 0.5 }}>
      <CallMergeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
      {destination ? (
        <AppLink to={`${config.entityType.url}${id}`}>
          {getDeletedEntityName(destination)}
        </AppLink>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {formatMessage({
            id: error ? 'unexpected error' : 'Loading ...'
          })}
        </Typography>
      )}
    </Stack>
  );
};

MergeDestination.propTypes = {
  resource: PropTypes.string.isRequired,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

export default MergeDestination;
