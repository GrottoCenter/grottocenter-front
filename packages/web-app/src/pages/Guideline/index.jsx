import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Skeleton, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';
import { useIntl } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';

import CustomIcon from '@/components/common/CustomIcon';
import FetchErrorState from '@/components/common/FetchErrorState';
import AppLink from '@/components/common/AppLink';
import StandardDialog from '@/components/common/StandardDialog';
import LinkedEntitiesList, {
  ListElement
} from '@/components/common/LinkedEntitiesList';
import PageContainer from '@/components/common/Layouts/PageContainer';
import PageHeader from '@/components/common/Layouts/PageHeader';
import ResponsiveActions from '@/components/common/Layouts/ResponsiveActions';
import SectionStack from '@/components/common/Layouts/SectionStack';
import ScrollableContent from '@/components/common/Layouts/Fixed/ScrollableContent';
import { useSnapshotUrl } from '@/components/appli/Entry/Snapshots/UtilityFunction';
import {
  useDeleteGuideline,
  useGuideline,
  useNotification,
  usePermissions
} from '@/hooks';
import GuidelinePropTypes from '@/types/guideline.type';

const getId = value => value?.id ?? value?.iso ?? value?.code ?? value;

// TODO(api#1782): once the detail endpoint guarantees hydrated relations,
// remove the ID fallback and rely on the returned readable `name`.
const getName = value => value?.name ?? value?.label ?? String(getId(value));

const GuidelineScope = ({ guideline }) => {
  const { formatMessage } = useIntl();
  const countries = guideline.countries ?? [];
  const regions = guideline.regions ?? [];
  const massifs = guideline.massifs ?? [];

  if (countries.length + regions.length + massifs.length === 0) {
    return <Typography>-</Typography>;
  }

  return (
    <LinkedEntitiesList>
      {countries.map(country => (
        <ListElement
          key={`country-${getId(country)}`}
          icon={<CustomIcon type="country" />}
          value={getName(country)}
          secondary={formatMessage({ id: 'Country' })}
          url={`/ui/countries/${getId(country)}`}
        />
      ))}
      {regions.map(region => {
        const regionId = getId(region);
        const countryId = region?.countryId ?? String(regionId).split('-')[0];
        return (
          <ListElement
            key={`region-${regionId}`}
            icon={<CustomIcon type="country" />}
            value={getName(region)}
            secondary={formatMessage({ id: 'Region' })}
            url={`/ui/countries/${countryId}/regions/${regionId}`}
          />
        );
      })}
      {massifs.map(massif => (
        <ListElement
          key={`massif-${getId(massif)}`}
          icon={<CustomIcon type="massif" />}
          value={getName(massif)}
          secondary={formatMessage({ id: 'Massif' })}
          url={`/ui/massifs/${getId(massif)}`}
        />
      ))}
    </LinkedEntitiesList>
  );
};

GuidelineScope.propTypes = {
  guideline: GuidelinePropTypes.isRequired
};

const GuidelineMetadata = ({ guideline, isLoading }) => {
  const { formatDate, formatMessage } = useIntl();
  if (isLoading) return <Skeleton width={320} />;

  const formatMetadataDate = date =>
    date
      ? formatDate(date, {
          year: '2-digit',
          month: '2-digit',
          day: '2-digit'
        })
      : null;
  const makeContribution = (key, verbId, contributor, date) => {
    const contributorName = contributor?.nickname ?? contributor?.name;
    if (!contributorName && !date) return null;
    const verb = formatMessage({ id: verbId });
    const prefix = contributorName
      ? formatMessage({ id: 'author.by' }, { verb })
      : verb;
    return (
      <span key={key}>
        {prefix}
        {contributorName && (
          <>
            {' '}
            {contributor?.id ? (
              <AppLink to={`/ui/persons/${contributor.id}`}>
                {contributorName}
              </AppLink>
            ) : (
              contributorName
            )}
          </>
        )}
        {date && ` ${formatMetadataDate(date)}`}
      </span>
    );
  };

  const languageId = guideline?.language?.id ?? guideline?.language;
  const language = languageId
    ? String(languageId).toLocaleUpperCase()
    : (guideline?.language?.refName ?? guideline?.language?.name);
  const metadata = [
    makeContribution(
      'created',
      'Created',
      guideline?.author,
      guideline?.dateInscription
    ),
    makeContribution(
      'updated',
      'Updated',
      guideline?.reviewer,
      guideline?.dateReviewed
    ),
    language ? (
      <span key="language">
        {formatMessage({ id: 'Language' })} : {language}
      </span>
    ) : null
  ].filter(Boolean);

  if (metadata.length === 0) return null;
  return (
    <Typography
      data-testid="guideline-metadata"
      variant="caption"
      color="textSecondary">
      {metadata.map((item, index) => (
        <span key={item.key}>
          {index > 0 && ' · '}
          {item}
        </span>
      ))}
    </Typography>
  );
};

GuidelineMetadata.propTypes = {
  guideline: GuidelinePropTypes,
  isLoading: PropTypes.bool.isRequired
};

const GuidelinePage = () => {
  const { guidelineId } = useParams();
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const { onError } = useNotification();
  const deleteMutation = useDeleteGuideline();
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { data, error, isPending, fetchStatus, refetch } =
    useGuideline(guidelineId);
  const hasError = Boolean(error) || fetchStatus === 'paused';
  const snapshotUrl = useSnapshotUrl({
    id: Number(guidelineId),
    type: 'guidelines',
    isDeleted: data?.isDeleted
  });

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id: guidelineId, isPermanent: false });
      setDeleteDialogOpen(false);
      // TODO(api#1782): stay on a deleted guideline and expose Restore once
      // GET /api/v1/guidelines/:id can reload soft-deleted guidelines.
      navigate('/ui/guidelines', { replace: true });
    } catch {
      onError(
        formatMessage({
          id: 'guidelines.delete_error',
          defaultMessage: 'Failed to delete the guideline'
        })
      );
    }
  };

  const actions = data ? (
    <ResponsiveActions
      loading={deleteMutation.isPending}
      loadingLabel={formatMessage({ id: 'Loading ...' })}
      items={[
        {
          key: 'edit',
          icon: <EditIcon />,
          label: formatMessage({ id: 'Edit' }),
          href: `/ui/guidelines/${guidelineId}/edit`,
          hidden: !permissions.isAuth || data.isDeleted
        },
        {
          key: 'history',
          icon: <ManageHistoryIcon />,
          label: formatMessage({ id: 'History' }),
          href: snapshotUrl
        },
        {
          key: 'delete',
          icon: <DeleteIcon />,
          label: formatMessage({ id: 'Delete' }),
          onClick: () => setDeleteDialogOpen(true),
          destructive: true,
          hidden: !permissions.isModerator || data.isDeleted
        }
      ]}
    />
  ) : null;

  return (
    <PageContainer>
      <PageHeader
        title={data?.title ?? <Skeleton width={240} />}
        icon={<CustomIcon type="guidelines" />}
        actions={actions}
      />
      <StandardDialog
        open={isDeleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title={formatMessage({ id: 'Delete' })}
        actions={[
          <Button
            key="cancel"
            variant="outlined"
            onClick={() => setDeleteDialogOpen(false)}>
            {formatMessage({ id: 'No' })}
          </Button>,
          <Button
            key="confirm"
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
            onClick={handleDelete}>
            {formatMessage({ id: 'Yes' })}
          </Button>
        ]}>
        {data &&
          formatMessage(
            { id: 'delete-confirmation-dialog' },
            { entityFmt: data.title }
          )}
      </StandardDialog>
      <SectionStack>
        {hasError ? (
          <FetchErrorState
            error={error}
            isPaused={fetchStatus === 'paused'}
            messageId="guidelines.public.fetch_error"
            onRetry={refetch}
          />
        ) : (
          <>
            <ScrollableContent
              dense
              collapsible={false}
              title={formatMessage({ id: 'Description' })}
              content={
                <>
                  {isPending ? (
                    <Skeleton variant="text" height={80} />
                  ) : (
                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                      {data?.description ?? '-'}
                    </Typography>
                  )}
                  <Box sx={{ mt: 0.5, mb: -1 }}>
                    <GuidelineMetadata guideline={data} isLoading={isPending} />
                  </Box>
                </>
              }
            />
            <ScrollableContent
              dense
              collapsible={false}
              title={formatMessage({ id: 'Applies to' })}
              content={
                isPending ? (
                  <Skeleton variant="rounded" height={80} />
                ) : (
                  <GuidelineScope guideline={data} />
                )
              }
            />
          </>
        )}
      </SectionStack>
    </PageContainer>
  );
};

export default GuidelinePage;
