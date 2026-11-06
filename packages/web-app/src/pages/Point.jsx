import { useMemo, useState } from 'react';
import { Alert, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useIntl } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';

import PointDocuments from '@/components/appli/Point/PointDocuments';
import CustomIcon from '@/components/common/CustomIcon';
import ContributionMetadata from '@/components/common/Contribution/ContributionMetadata';
import {
  DeleteConfirmationDialog,
  Deleted,
  DeletedCard,
  DELETED_ENTITIES
} from '@/components/common/card/Deleted';
import PageContainer from '@/components/common/Layouts/PageContainer';
import PageHeader from '@/components/common/Layouts/PageHeader';
import EntityPageTabs from '@/components/common/Layouts/EntityPageTabs';
import ResponsiveActions from '@/components/common/Layouts/ResponsiveActions';
import SectionStack from '@/components/common/Layouts/SectionStack';
import ScrollableContent from '@/components/common/Layouts/Fixed/ScrollableContent';
import Property from '@/components/common/Properties/Property';
import Map from '@/components/common/Maps/MapMultipleMarkers';
import { PointMarker } from '@/components/common/Maps/common/Markers/Components/PointMarker';
import { makeIconTooltip } from '@/components/common/Maps/common/Markers/tooltipHelpers';
import { pointIcon } from '@/assets/icons';
import {
  useCave,
  useDeletePoint,
  usePoint,
  usePermissions,
  useOnlineStatus
} from '@/hooks';
import { getPointLocationMessageId } from '@/utils/points';

const pointTooltip = point => makeIconTooltip(pointIcon, point.label);

const Point = () => {
  const { pointId } = useParams();
  const navigate = useNavigate();
  const { formatMessage, formatNumber } = useIntl();
  const permissions = usePermissions();
  const isOnline = useOnlineStatus();
  const query = usePoint(pointId);
  const point = query.data;
  const { data: cave } = useCave(point?.caveId);
  const deleteMutation = useDeletePoint();
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const isDeleted = Boolean(point?.isDeleted);
  const canModerate = permissions.isModerator || permissions.isAdmin;
  const positions = useMemo(() => (point ? [point] : []), [point]);
  const hasCoordinates =
    Number.isFinite(point?.latitude) && Number.isFinite(point?.longitude);
  const hasError = query.error || query.isPaused;

  const handleDelete = async () => {
    await deleteMutation.mutateAsync({ id: pointId });
    setDeleteOpen(false);
    navigate('/ui/points', { replace: true });
  };

  if (isDeleted && !canModerate) {
    return <Deleted entityType={DELETED_ENTITIES.point} entity={point} />;
  }

  // The current Point API exposes documents and SVG positions, but no
  // observations collection or read endpoint. Do not infer that none exist,
  // or invent a request; observation browsing will follow its API contract.
  return (
    <PageContainer>
      <PageHeader
        title={point?.label ?? (hasError ? '' : undefined)}
        icon={<CustomIcon type="point" />}
        actions={
          point ? (
            <ResponsiveActions
              loading={deleteMutation.isPending}
              loadingLabel={formatMessage({ id: 'Loading ...' })}
              items={[
                {
                  key: 'edit',
                  icon: <EditIcon />,
                  label: formatMessage({ id: 'Edit' }),
                  href: `/ui/points/${pointId}/edit`,
                  hidden: !permissions.isAuth || isDeleted,
                  disabled: !isOnline
                },
                {
                  key: 'delete',
                  icon: <DeleteIcon />,
                  label: formatMessage({ id: 'Delete' }),
                  onClick: () => setDeleteOpen(true),
                  destructive: true,
                  hidden: !permissions.isAuth || !canModerate || isDeleted,
                  disabled: !isOnline
                }
              ]}
            />
          ) : null
        }
      />
      <EntityPageTabs
        isLoading={query.isPending}
        error={query.error}
        isPaused={query.isPaused}
        onRetry={query.refetch}
        errorMessageId={
          query.error?.status === 404 ? 'points.notFound' : 'points.fetchError'
        }
        tabs={[
          {
            id: 'information'
          },
          {
            id: 'documents',
            count: point?.documents?.length,
            disabled:
              Boolean(point) &&
              !permissions.isAuth &&
              (point.documents?.length ?? 0) === 0
          }
        ]}
        panels={{
          information: point && (
            <SectionStack>
              {isDeleted && (
                <DeletedCard
                  entityType={DELETED_ENTITIES.point}
                  entity={point}
                />
              )}
              <ScrollableContent
                title={formatMessage({ id: 'Information' })}
                collapsible={false}
                content={
                  <>
                    <Property
                      label={formatMessage({ id: 'Depth' })}
                      value={formatMessage({
                        id: getPointLocationMessageId(point.underground)
                      })}
                    />
                    {point.caveId && (
                      <Property
                        label={formatMessage({ id: 'Cave' })}
                        value={cave?.name ?? String(point.caveId)}
                        url={`/ui/caves/${point.caveId}`}
                      />
                    )}
                    {point.underground === null && (
                      <Alert severity="info" sx={{ my: 1 }}>
                        {formatMessage({ id: 'points.unclassified' })}
                      </Alert>
                    )}
                    <ContributionMetadata
                      createdBy={point.author}
                      createdAt={point.dateInscription}
                      updatedBy={point.reviewer}
                      updatedAt={point.dateReviewed}
                    />
                  </>
                }
              />
              {point.underground === false && hasCoordinates && (
                <ScrollableContent
                  title={formatMessage({ id: 'Location' })}
                  collapsible={false}
                  content={
                    <>
                      <Box data-testid="point-map">
                        <Map
                          positions={positions}
                          markerIcon={PointMarker}
                          tooltipContent={pointTooltip}
                        />
                      </Box>
                      <Property
                        label={formatMessage({ id: 'Latitude' })}
                        value={formatNumber(point.latitude, {
                          maximumFractionDigits: 6
                        })}
                      />
                      <Property
                        label={formatMessage({ id: 'Longitude' })}
                        value={formatNumber(point.longitude, {
                          maximumFractionDigits: 6
                        })}
                      />
                    </>
                  }
                />
              )}
            </SectionStack>
          ),
          documents: point && (
            <PointDocuments
              pointId={point.id}
              documents={point.documents ?? []}
              isDeleted={isDeleted}
            />
          )
        }}
      />
      {!hasError && point && (
        <DeleteConfirmationDialog
          entityType={DELETED_ENTITIES.point}
          entityId={point.id}
          entityName={point.label}
          isOpen={isDeleteOpen}
          isLoading={deleteMutation.isPending}
          error={deleteMutation.error}
          isPermanent={false}
          onClose={() => {
            setDeleteOpen(false);
            deleteMutation.reset();
          }}
          onConfirmation={handleDelete}
        />
      )}
    </PageContainer>
  );
};

export default Point;
