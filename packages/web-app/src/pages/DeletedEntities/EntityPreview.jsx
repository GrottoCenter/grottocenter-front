import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  CircularProgress,
  Stack,
  Typography,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { apiGet } from '@/api/client';
import AppLink from '@/components/common/AppLink';
import ContributionMetadata from '@/components/common/Contribution/ContributionMetadata';
import FormSubmissionError from '@/components/common/FormSubmissionError';
import StandardDialog from '@/components/common/StandardDialog';
import {
  DELETED_ENTITY_RESOURCES,
  getDeletedEntityName
} from '@/utils/deletedEntities';
import EntityIcon from './EntityIcon';
import EntitySummary from './EntitySummary';

const EntityPreview = ({ resource, entity, onClose }) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const config = DELETED_ENTITY_RESOURCES[resource];
  const query = useQuery({
    queryKey: config.keys.detail(entity.id),
    queryFn: ({ signal }) =>
      apiGet(`${config.collectionUrl}/${entity.id}`, { signal }),
    retry: false
  });
  const { data } = query;
  const descriptions = data?.descriptions ?? [];
  return (
    <StandardDialog
      open
      fullWidth
      fullScreen={isMobile}
      scrollable
      maxWidth="md"
      onClose={onClose}
      title={
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <EntityIcon resource={resource} entity={data ?? entity} />
          <span>{getDeletedEntityName(data ?? entity)}</span>
          <Typography component="span" sx={{ color: 'grey.600' }}>
            #{entity.id}
          </Typography>
        </Stack>
      }
      actions={
        <Button component={AppLink} to={`${config.entityType.url}${entity.id}`}>
          {formatMessage({ id: 'Details' })}
        </Button>
      }>
      {query.isPending && <CircularProgress size={24} />}
      <FormSubmissionError error={query.error} />
      {query.error && (
        <Button onClick={() => query.refetch()}>
          {formatMessage({ id: 'Retry' })}
        </Button>
      )}
      {data && (
        <Stack spacing={1.5}>
          <EntitySummary resource={resource} entity={data} />
          {data.description && (
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>
              {data.description}
            </Typography>
          )}
          {descriptions.map(description => (
            <Stack key={description.id} spacing={0.5}>
              {description.title && (
                <Typography variant="h5" component="h3">
                  {description.title}
                </Typography>
              )}
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                {description.body}
              </Typography>
            </Stack>
          ))}
          {[data.address, data.postalCode, data.mail, data.url]
            .filter(Boolean)
            .map(value => (
              <Typography key={value}>{value}</Typography>
            ))}
          <ContributionMetadata
            createdBy={data.author}
            createdAt={data.dateInscription}
            updatedBy={data.reviewer}
            updatedAt={data.dateReviewed}
          />
        </Stack>
      )}
    </StandardDialog>
  );
};

EntityPreview.propTypes = {
  resource: PropTypes.string.isRequired,
  entity: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
  }).isRequired,
  onClose: PropTypes.func.isRequired
};

export default EntityPreview;
