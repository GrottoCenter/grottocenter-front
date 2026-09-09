import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Skeleton, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';
import { useIntl } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';

import CustomIcon from '@/components/common/CustomIcon';
import FetchErrorState from '@/components/common/FetchErrorState';
import ContributionMetadata from '@/components/common/Contribution/ContributionMetadata';
import {
  DeleteConfirmationDialog,
  DeletedCard,
  DELETED_ENTITIES
} from '@/components/common/card/Deleted';
import LinkedEntityCards from '@/components/common/entitiesList/LinkedEntityCards';
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
  usePatchGuideline,
  usePermissions,
  useRestoreGuideline
} from '@/hooks';
import GuidelinePropTypes from '@/types/guideline.type';

const getId = value => value?.id ?? value?.iso ?? value?.code ?? value;
// Scope mutations use geographic ISO identifiers when available, while page
// links keep the entity's primary id.
const getScopeId = value => value?.iso ?? value?.id ?? value?.code ?? value;

const getName = value => value?.name ?? value?.label ?? String(getId(value));

const GuidelineScope = ({ guideline, onUnlink, isUnlinking }) => {
  const { formatMessage } = useIntl();
  const countries = guideline.countries ?? [];
  const regions = guideline.regions ?? [];
  const massifs = guideline.massifs ?? [];
  const entities = [
    ...countries.map(country => ({
      id: getId(country),
      associationId: getScopeId(country),
      type: 'country',
      scopeKey: 'countries',
      iconType: 'country',
      label: getName(country),
      secondary: formatMessage({ id: 'Country' }),
      url: `/ui/countries/${getId(country)}`
    })),
    ...regions.map(region => {
      const regionId = getId(region);
      const countryId = region?.countryId ?? String(regionId).split('-')[0];
      return {
        id: regionId,
        associationId: getScopeId(region),
        type: 'region',
        scopeKey: 'regions',
        iconType: 'country',
        label: getName(region),
        secondary: formatMessage({ id: 'Region' }),
        url: `/ui/countries/${countryId}/regions/${regionId}`
      };
    }),
    ...massifs.map(massif => ({
      id: getId(massif),
      associationId: getScopeId(massif),
      type: 'massif',
      scopeKey: 'massifs',
      iconType: 'massif',
      label: getName(massif),
      secondary: formatMessage({ id: 'Massif' }),
      url: `/ui/massifs/${getId(massif)}`
    }))
  ];

  return (
    <LinkedEntityCards
      entities={entities}
      emptyMessage={<Typography>-</Typography>}
      onUnlink={onUnlink}
      isUnlinking={isUnlinking}
    />
  );
};

GuidelineScope.propTypes = {
  guideline: GuidelinePropTypes.isRequired,
  onUnlink: PropTypes.func,
  isUnlinking: PropTypes.bool
};

const GuidelinePage = () => {
  const { guidelineId } = useParams();
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const { onError } = useNotification();
  const deleteMutation = useDeleteGuideline();
  const patchMutation = usePatchGuideline();
  const restoreMutation = useRestoreGuideline();
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeletePermanent, setDeletePermanent] = useState(false);
  const { data, error, isPending, fetchStatus, refetch } =
    useGuideline(guidelineId);

  const isDeleted = Boolean(data?.isDeleted);
  const hasError =
    (!data && Boolean(error)) || (!data && fetchStatus === 'paused');
  const snapshotUrl = useSnapshotUrl({
    id: Number(guidelineId),
    type: 'guidelines',
    isDeleted
  });

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({
        id: guidelineId,
        isPermanent: isDeletePermanent
      });
      if (isDeletePermanent) {
        navigate('/ui/guidelines', { replace: true });
      }
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
    } catch {
      onError(
        formatMessage({
          id: 'guidelines.restore_error',
          defaultMessage: 'Failed to restore the guideline'
        })
      );
    }
  };

  const handleUnlinkScope = async entity => {
    if (!data || patchMutation.isPending) return;

    const scopes = {
      countries: (data.countries ?? []).map(getScopeId),
      regions: (data.regions ?? []).map(getScopeId),
      massifs: (data.massifs ?? []).map(getScopeId)
    };
    scopes[entity.scopeKey] = scopes[entity.scopeKey].filter(
      id => String(id) !== String(entity.associationId)
    );
    await patchMutation.mutateAsync({ id: data.id, ...scopes });
  };

  const canModerate = permissions.isModerator || permissions.isAdmin;
  const isActionLoading = deleteMutation.isPending || restoreMutation.isPending;
  const actions = data ? (
    <ResponsiveActions
      loading={isActionLoading}
      loadingLabel={formatMessage({ id: 'Loading ...' })}
      items={[
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
          onClick: () => {
            setDeletePermanent(false);
            setDeleteDialogOpen(true);
          },
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
      <DeleteConfirmationDialog
        entityType={DELETED_ENTITIES.guideline}
        isOpen={isDeleteDialogOpen}
        isLoading={deleteMutation.isPending}
        isPermanent={isDeletePermanent}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirmation={handleDelete}
      />
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
            {data?.isDeleted && (
              <DeletedCard
                entityType={DELETED_ENTITIES.guideline}
                entity={data}
                isLoading={isActionLoading}
                onRestorePress={canModerate ? handleRestore : undefined}
                onPermanentDeletePress={
                  canModerate
                    ? () => {
                        setDeletePermanent(true);
                        setDeleteDialogOpen(true);
                      }
                    : undefined
                }
              />
            )}
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
                  <GuidelineScope
                    guideline={data}
                    onUnlink={
                      permissions.isAuth && !isDeleted
                        ? handleUnlinkScope
                        : undefined
                    }
                    isUnlinking={patchMutation.isPending}
                  />
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
