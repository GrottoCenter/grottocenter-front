import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useQuery } from '@tanstack/react-query';
import { Stack, Typography } from '@mui/material';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import { apiGet } from '@/api/client';
import AppLink from '@/components/common/AppLink';
import { STALE } from '@/conf/queryClient';
import {
  DELETED_ENTITY_RESOURCES,
  getDeletedEntityName
} from '@/utils/deletedEntities';

const MergeDestination = ({ resource, id }) => {
  const { formatMessage } = useIntl();
  const config = DELETED_ENTITY_RESOURCES[resource];
  const { data: destination, isPending } = useQuery({
    queryKey: config.keys.detail(id),
    queryFn: ({ signal }) =>
      apiGet(`${config.collectionUrl}/${id}`, { signal }),
    retry: false,
    staleTime: STALE.STANDARD
  });
  return (
    <Stack
      direction="row"
      spacing={0.75}
      sx={{ alignItems: 'center', mt: 0.5 }}>
      <CallMergeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
      {isPending ? (
        <Typography variant="body2" color="text.secondary">
          {formatMessage({ id: 'Loading ...' })}
        </Typography>
      ) : (
        <AppLink to={`${config.entityType.url}${id}`}>
          {destination ? getDeletedEntityName(destination) : `#${id}`}
        </AppLink>
      )}
    </Stack>
  );
};

MergeDestination.propTypes = {
  resource: PropTypes.string.isRequired,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

export default MergeDestination;
