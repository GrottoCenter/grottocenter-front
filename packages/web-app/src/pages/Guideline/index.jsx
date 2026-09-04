import { useState } from 'react';
import { Box, Button, Skeleton, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import { useIntl } from 'react-intl';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import CustomIcon from '@/components/common/CustomIcon';
import FetchErrorState from '@/components/common/FetchErrorState';
import ContributionMetadata from '@/components/common/Contribution/ContributionMetadata';
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
  usePermissions,
  useRestoreGuideline
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

const GuidelinePage = () => {
  const { guidelineId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const { onError } = useNotification();
  const deleteMutation = useDeleteGuideline();
  const restoreMutation = useRestoreGuideline();
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { data, error, isPending, fetchStatus, refetch } =
    useGuideline(guidelineId);
  const isDeletedFromUrl =
    new URLSearchParams(location.search).get('isDeleted') === 'true';
  const isDeleted = Boolean(data?.isDeleted || isDeletedFromUrl);
  const hasError =
    (!data && Boolean(error)) || (!data && fetchStatus === 'paused');
  const snapshotUrl = useSnapshotUrl({
    id: Number(guidelineId),
    type: 'guidelines',
    isDeleted
  });

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id: guidelineId, isPermanent: false });
      setDeleteDialogOpen(false);
      // The public detail endpoint deliberately returns 404 for soft-deleted
      // guidelines. Keep the known deletion state in the URL so the page stays
      // restorable across a reload without pretending every 404 is deleted.
      navigate(`/ui/guidelines/${guidelineId}?isDeleted=true`, {
        replace: true
      });
    } catch {
      onError(
        formatMessage({
          id: 'guidelines.delete_error',
          defaultMessage: 'Failed to delete the guideline'
        })
      );
    }
  };

  const handleRestore = async () => {
    try {
      await restoreMutation.mutateAsync({ id: guidelineId });
      navigate(`/ui/guidelines/${guidelineId}`, { replace: true });
      await refetch();
    } catch {
      onError(
        formatMessage({
          id: 'guidelines.restore_error',
          defaultMessage: 'Failed to restore the guideline'
        })
      );
    }
  };

  const canModerate = permissions.isModerator || permissions.isAdmin;
  const actions =
    data || isDeletedFromUrl ? (
      <ResponsiveActions
        loading={deleteMutation.isPending || restoreMutation.isPending}
        loadingLabel={formatMessage({ id: 'Loading ...' })}
        items={[
          {
            key: 'restore',
            icon: <RestoreFromTrashIcon />,
            label: formatMessage({ id: 'Restore' }),
            onClick: handleRestore,
            hidden: !canModerate || !isDeleted
          },
          {
            key: 'edit',
            icon: <EditIcon />,
            label: formatMessage({ id: 'Edit' }),
            href: `/ui/guidelines/${guidelineId}/edit`,
            hidden: !permissions.isAuth || isDeleted
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
            hidden: !canModerate || isDeleted
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
            {formatMessage({ id: 'Cancel' })}
          </Button>,
          <Button
            key="confirm"
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
            onClick={handleDelete}>
            {formatMessage({ id: 'Delete' })}
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
              title={formatMessage({ id: 'guidelines.description' })}
              content={
                <>
                  {isPending ? (
                    <Skeleton variant="text" height={80} />
                  ) : (
                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                      {data?.description ?? '-'}
                    </Typography>
                  )}
                  <Box data-testid="guideline-metadata">
                    {isPending ? (
                      <Skeleton width={320} sx={{ mt: 1 }} />
                    ) : (
                      <ContributionMetadata
                        createdBy={data?.author}
                        createdAt={data?.dateInscription}
                        updatedBy={data?.reviewer}
                        updatedAt={data?.dateReviewed}
                        language={data?.language}
                      />
                    )}
                  </Box>
                </>
              }
            />
            <ScrollableContent
              dense
              collapsible={false}
              title={formatMessage({ id: 'Applies to' })}
              content={
                isPending || !data ? (
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
