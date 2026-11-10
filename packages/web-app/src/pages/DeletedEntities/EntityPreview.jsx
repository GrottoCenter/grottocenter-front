import { lazy, Suspense } from 'react';
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
import FormSubmissionError from '@/components/common/FormSubmissionError';
import StandardDialog from '@/components/common/StandardDialog';
import { DELETED_ENTITY_RESOURCES } from '@/utils/deletedEntities';
import EntityIcon from './EntityIcon';

const Entry = lazy(() => import('@/components/appli/Entry'));
const Network = lazy(() => import('@/components/appli/Network'));
const Massif = lazy(() => import('@/components/appli/Massif/Massif'));
const Organization = lazy(() => import('@/components/appli/Organization'));
const DocumentDetails = lazy(() => import('@/pages/DocumentDetails'));
const Guideline = lazy(() => import('@/pages/Guideline'));

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
  const renderDetails = () => {
    switch (resource) {
      case 'entrances':
        return <Entry entrance={data} isLoading={false} isPreview />;
      case 'caves':
        return <Network cave={data} isLoading={false} isPreview />;
      case 'massifs':
        return <Massif massif={data} isLoading={false} isPreview />;
      case 'organizations':
        return <Organization organization={data} isLoading={false} isPreview />;
      case 'documents':
        return <DocumentDetails id={entity.id} isPreview />;
      case 'guidelines':
        return <Guideline id={entity.id} isPreview />;
      default:
        return null;
    }
  };
  return (
    <StandardDialog
      open
      fullWidth
      fullScreen={isMobile}
      dense={isMobile}
      scrollable
      maxWidth="lg"
      onClose={onClose}
      titleComponent="div"
      title={
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <EntityIcon resource={resource} entity={data ?? entity} />
          <span>{formatMessage({ id: 'Preview' })}</span>
          <Typography component="span" sx={{ color: 'grey.600' }}>
            #{entity.id}
          </Typography>
        </Stack>
      }>
      {query.isPending && <CircularProgress size={24} />}
      <FormSubmissionError error={query.error} />
      {query.error && (
        <Button onClick={() => query.refetch()}>
          {formatMessage({ id: 'Retry' })}
        </Button>
      )}
      {data && (
        <Suspense fallback={<CircularProgress size={24} />}>
          {renderDetails()}
        </Suspense>
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
