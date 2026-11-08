import { useMemo, useState } from 'react';
import { Box, CircularProgress, Paper, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useIntl } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';

import PointDocuments from '@/components/appli/Point/PointDocuments';
import { getUndergroundLocation } from '@/components/appli/Point/location';
import { getPointAssociation } from '@/components/appli/Point/association';
import SensitiveCaveWarning from '@/components/appli/Entry/SensitiveCaveWarning';
import SensitiveLocationPlaceholder from '@/components/appli/Entry/SensitiveLocationPlaceholder';
import CustomIcon from '@/components/common/CustomIcon';
import AppLink from '@/components/common/AppLink';
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
import FetchErrorState from '@/components/common/FetchErrorState';
import ResponsiveActions from '@/components/common/Layouts/ResponsiveActions';
import SectionStack from '@/components/common/Layouts/SectionStack';
import ScrollableContent from '@/components/common/Layouts/Fixed/ScrollableContent';
import Property from '@/components/common/Properties/Property';
import CoordinatesProperty from '@/components/common/Properties/CoordinatesProperty';
import InfoSection from '@/components/common/InfoSection';
import Map from '@/components/common/Maps/MapMultipleMarkers';
import { PointMarker } from '@/components/common/Maps/common/Markers/Components/PointMarker';
import { makeIconTooltip } from '@/components/common/Maps/common/Markers/tooltipHelpers';
import { pointIcon } from '@/assets/icons';
import {
  useCave,
  useEntrance,
  useDeletePoint,
  usePoint,
  usePointPositions,
  usePermissions,
  useOnlineStatus
} from '@/hooks';

const pointTooltip = point => makeIconTooltip(pointIcon, point.label);

const Point = () => {
  const { pointId } = useParams();
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const isOnline = useOnlineStatus();
  const query = usePoint(pointId);
  const point = query.data;
  // TEMPORARY https://github.com/GrottoCenter/grottocenter-api/issues/1978:
  // DELETE legacyCaveId, `?? legacyCaveId` and its hasLocationSource branch.
  // The new API rejects caveId; use only entrance/network association objects.
  const legacyCaveId =
    point && !('entrance' in point || 'network' in point)
      ? point.caveId
      : undefined;
  const caveQuery = useCave(point?.network?.id ?? legacyCaveId);
  const entranceQuery = useEntrance(point?.entrance?.id);
  const cave = caveQuery.data;
  const association = getPointAssociation(point, cave);
  const locationQuery = point?.entrance ? entranceQuery : caveQuery;
  const deleteMutation = useDeletePoint();
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const isDeleted = Boolean(point?.isDeleted);
  const canModerate = permissions.isModerator || permissions.isAdmin;
  const embeddedPositions = point?.positions ?? [];
  const hasPartialPositions =
    (point?.positionCount ?? 0) > embeddedPositions.length;
  const positionsQuery = usePointPositions(pointId, {
    enabled: hasPartialPositions && (!isDeleted || canModerate)
  });
  const documentPositions = hasPartialPositions
    ? (positionsQuery.data?.positions ?? embeddedPositions)
    : embeddedPositions;
  const hasPositionDocuments =
    documentPositions.length > 0 || hasPartialPositions;
  const undergroundLocation = useMemo(
    () =>
      getUndergroundLocation(
        point?.entrance
          ? [entranceQuery.data].filter(Boolean)
          : cave?.entrances,
        permissions.isAdmin
      ),
    [point?.entrance, entranceQuery.data, cave, permissions.isAdmin]
  );
  const hasCoordinates =
    Number.isFinite(point?.latitude) && Number.isFinite(point?.longitude);
  const hasSurfaceLocation = point?.underground === false && hasCoordinates;
  const isUnderground = point?.underground === true;
  const location = isUnderground
    ? undergroundLocation.coordinates
    : hasSurfaceLocation && point;
  const positions = useMemo(
    () => (location ? [{ ...point, ...location }] : []),
    [point, location]
  );
  const hasLocationSource = Boolean(
    point?.entrance?.id || point?.network?.id || legacyCaveId
  );
  const isLocationPending =
    isUnderground && hasLocationSource && locationQuery.isPending;
  const hasLocationError =
    isUnderground &&
    hasLocationSource &&
    (locationQuery.error || locationQuery.isPaused);
  const isLocationProtected = isUnderground && undergroundLocation.isSensitive;
  const canShowLocation = !isLocationProtected || permissions.isAdmin;
  const hasError = query.error || query.isPaused;

  const handleDelete = async () => {
    await deleteMutation.mutateAsync({ id: pointId });
    setDeleteOpen(false);
    navigate('/ui/points', { replace: true });
  };

  if (isDeleted && !canModerate) {
    return <Deleted entityType={DELETED_ENTITIES.point} entity={point} />;
  }

  let locationContent = (
    <Box
      sx={{
        flex: 1,
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'secondary.veryLight',
        borderRadius: 1,
        p: 2
      }}>
      <Typography variant="body2" color="text.secondary">
        {formatMessage({ id: 'points.noKnownLocation' })}
      </Typography>
    </Box>
  );
  if (isLocationPending && !hasLocationError) {
    locationContent = (
      <Box sx={{ flex: 1, display: 'grid', placeItems: 'center' }}>
        <CircularProgress aria-label={formatMessage({ id: 'Loading ...' })} />
      </Box>
    );
  } else if (hasLocationError) {
    locationContent = (
      <FetchErrorState
        error={locationQuery.error}
        isPaused={locationQuery.isPaused}
        messageId="points.locationFetchError"
        onRetry={locationQuery.refetch}
      />
    );
  } else if (!canShowLocation) {
    locationContent = <SensitiveLocationPlaceholder />;
  } else if (location) {
    locationContent = (
      <Box data-testid="point-map" sx={{ flex: 1, display: 'flex' }}>
        <Map
          positions={positions}
          markerIcon={PointMarker}
          tooltipContent={pointTooltip}
          style={{ minHeight: 300 }}
        />
      </Box>
    );
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
                collapsible={false}
                content={
                  <>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: 'stretch',
                        gap: { xs: 1, sm: 2 }
                      }}>
                      <Box
                        data-testid="point-location"
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          minHeight: 300,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1
                        }}>
                        {isLocationProtected &&
                          permissions.isAdmin &&
                          !isLocationPending &&
                          !hasLocationError && (
                            <SensitiveCaveWarning
                              isLocked={undergroundLocation.isSensitiveLocked}
                            />
                          )}
                        {locationContent}
                      </Box>
                      <Box
                        data-testid="point-properties"
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1
                        }}>
                        {hasSurfaceLocation && (
                          <Paper
                            variant="outlined"
                            sx={{ p: 1, borderRadius: 2, bgcolor: 'grey.50' }}>
                            <InfoSection
                              component="h2"
                              title={formatMessage({ id: 'Location' })}>
                              <CoordinatesProperty
                                latitude={point.latitude}
                                longitude={point.longitude}
                              />
                            </InfoSection>
                          </Paper>
                        )}
                        {(point.underground === true ||
                          association ||
                          hasPositionDocuments) && (
                          <Paper
                            variant="outlined"
                            sx={{ p: 1, borderRadius: 2, bgcolor: 'grey.50' }}>
                            <InfoSection
                              component="h2"
                              title={formatMessage({ id: 'Characteristics' })}>
                              {point.underground === true && (
                                <Property
                                  value={formatMessage({
                                    id: 'points.underground'
                                  })}
                                  icon={<CustomIcon type="underground" />}
                                  secondary
                                />
                              )}
                              {association && (
                                <Property
                                  label={formatMessage({
                                    id:
                                      association.type === 'entrance'
                                        ? 'Entrance'
                                        : 'Network'
                                  })}
                                  value={
                                    association.name ?? String(association.id)
                                  }
                                  url={
                                    association.type === 'entrance'
                                      ? `/ui/entrances/${association.id}`
                                      : `/ui/caves/${association.id}`
                                  }
                                  icon={<CustomIcon type={association.type} />}
                                />
                              )}
                              {hasPositionDocuments && (
                                <Property
                                  label={formatMessage({
                                    id: 'points.appearsOn'
                                  })}
                                  icon={<CustomIcon type="bibliography" />}
                                  value={
                                    <Box
                                      data-testid="point-position-documents"
                                      sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 0.5
                                      }}>
                                      {documentPositions.map(position => (
                                        <AppLink
                                          key={position.documentId}
                                          to={`/ui/documents/${position.documentId}`}>
                                          {position.document?.title?.trim() ||
                                            String(position.documentId)}
                                        </AppLink>
                                      ))}
                                      {hasPartialPositions &&
                                        positionsQuery.isFetching && (
                                          <CircularProgress
                                            size={20}
                                            aria-label={formatMessage({
                                              id: 'Loading ...'
                                            })}
                                          />
                                        )}
                                      {hasPartialPositions &&
                                        (positionsQuery.error ||
                                          positionsQuery.isPaused) && (
                                          <FetchErrorState
                                            error={positionsQuery.error}
                                            isPaused={positionsQuery.isPaused}
                                            messageId="points.positionDocumentsFetchError"
                                            onRetry={positionsQuery.refetch}
                                          />
                                        )}
                                    </Box>
                                  }
                                />
                              )}
                            </InfoSection>
                          </Paper>
                        )}
                      </Box>
                    </Box>
                    <ContributionMetadata
                      createdBy={point.author}
                      createdAt={point.dateInscription}
                      updatedBy={point.reviewer}
                      updatedAt={point.dateReviewed}
                    />
                  </>
                }
              />
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
