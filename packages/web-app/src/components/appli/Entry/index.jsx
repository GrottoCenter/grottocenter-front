import React, { useEffect, useState, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import Skeleton from '@mui/material/Skeleton';
import { Box, Breadcrumbs, Card, Link, Typography } from '@mui/material';

import FixedLayout from '../../common/Layouts/Fixed';
import FixedContent from '../../common/Layouts/Fixed/FixedContent';
import CustomIcon from '../../common/CustomIcon';

import Properties from './Properties';
import Descriptions from '../Descriptions';
import Locations from './Locations';
import Riggings from './Riggings/Riggings';
import Comments from './Comments/index';
import Documents from './Documents';
import Histories from './Histories';
import { deleteEntrance } from '../../../actions/Entrance/DeleteEntrance';
import { restoreEntrance } from '../../../actions/Entrance/RestoreEntrance';
import { usePermissions, useUserProperties, useExplored } from '../../../hooks';
import StandardDialog from '../../common/StandardDialog';
import { EntranceForm } from '../EntitiesForm';
import SensitiveCaveWarning from './SensitiveCaveWarning';
import AuthorAndDate from '../../common/Contribution/AuthorAndDate';
import Alert from '../../common/Alert';
import Map from '../../common/Maps/MapMultipleMarkers';
import { EntrancePropTypes } from '../../../types/entrance.type';
import {
  DeletedCard,
  DeleteConfirmationDialog,
  DELETED_ENTITIES
} from '../../common/card/Deleted';

const HalfSplitContainer = styled('div')`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    flex-direction: row;
    align-items: stretch;
    gap: ${({ theme }) => theme.spacing(3)};
  }
`;

export const Entry = ({ isLoading, error, entrance }) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const { entranceId } = useParams();
  const { isAuth, isAdmin, isModerator } = usePermissions();
  const componentRef = useRef();
  const [isEditing, setEditing] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [isDeleteConfirmationPermanent, setIsDeleteConfirmationPermanent] =
    useState(false);
  const [wantedDeletedState, setWantedDeletedState] = useState(false);
  const userId = useUserProperties()?.id ?? null;
  const { isExplored, isExploredLoading, handleToggleExplored } = useExplored({
    caveId: entrance?.cave?.id,
    entranceId: entrance?.id,
    userId
  });
  const mapPositions = useMemo(() => (entrance ? [entrance] : []), [entrance]);

  useEffect(() => {
    if (entrance) setWantedDeletedState(entrance.isDeleted);
  }, [entrance]);

  let onDelete = null;
  if (!entrance?.isDeleted && isModerator) {
    onDelete = () => {
      setIsDeleteConfirmationPermanent(false);
      setIsDeleteConfirmationOpen(true);
    };
  }

  const onDeletePress = (entityId, isPermanent) => {
    setWantedDeletedState(true);
    dispatch(deleteEntrance({ id: entranceId, entityId, isPermanent }));
    if (isPermanent) navigate('/', { replace: true });
  };
  const onRestorePress = () => {
    setWantedDeletedState(false);
    dispatch(restoreEntrance({ id: entranceId }));
  };

  const isActionLoading = wantedDeletedState !== entrance?.isDeleted;

  return (
    <div ref={componentRef}>
      <FixedLayout>
        {entrance && (
          <FixedContent
            displayShare
            subheader={
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between">
                <Breadcrumbs
                  separator="·"
                  sx={{ fontSize: { xs: '1.2rem', md: '1.7rem' } }}>
                  {entrance.country && (
                    <Link
                      component={RouterLink}
                      to={`/ui/countries/${entrance.country}`}
                      underline="hover"
                      color="inherit"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                      <CustomIcon type="country" size={16} />
                      {entrance.country}
                    </Link>
                  )}
                  {entrance.massifs?.map(massif => (
                    <Link
                      key={massif.id}
                      component={RouterLink}
                      to={`/ui/massifs/${massif.id}`}
                      underline="hover"
                      color="inherit"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                      <CustomIcon type="massif" size={16} />
                      {massif.name}
                    </Link>
                  ))}
                  {entrance.cave?.entrances?.length > 1 && (
                    <Link
                      component={RouterLink}
                      to={`/ui/caves/${entrance.cave.id}`}
                      underline="hover"
                      color="inherit"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                      <CustomIcon type="network" size={16} />
                      {entrance.cave.name}
                    </Link>
                  )}
                </Breadcrumbs>
              </Box>
            }
            title={entrance.name ?? ''}
            icon={<CustomIcon type="entrance" />}
            onEdit={
              isAuth && !entrance.isDeleted ? () => setEditing(true) : undefined
            }
            onDelete={onDelete}
            isExplored={isAuth && entrance?.cave?.id ? isExplored : null}
            isExploredLoading={isExploredLoading}
            onToggleExplored={
              isAuth && entrance?.cave?.id && !entrance?.isDeleted
                ? handleToggleExplored
                : undefined
            }
            printRef={componentRef}
            entranceSnapshot={{
              id: entrance.id,
              type: 'entrances',
              isNetwork: entrance.cave?.entrances?.length > 1
            }}
            snapshot={{
              id: entrance.id,
              type: 'entrances',
              isNetwork: entrance.cave?.entrances?.length > 1,
              getAll: true
            }}
            footer={
              (entrance.author || entrance.reviewer || entrance.language) && (
                <Typography component="div" variant="caption">
                  {entrance.author && (
                    <AuthorAndDate
                      author={entrance.author}
                      verb="Created"
                      date={entrance.dateInscription}
                    />
                  )}
                  {entrance.author && entrance.reviewer && ' · '}
                  {entrance.reviewer && (
                    <AuthorAndDate
                      author={entrance.reviewer}
                      verb="Updated"
                      date={entrance.dateReviewed}
                    />
                  )}
                  {entrance.language &&
                    (entrance.author || entrance.reviewer) &&
                    ' · '}
                  {entrance.language &&
                    `${formatMessage({ id: 'Language' })} : ${entrance.language.toUpperCase()}`}
                </Typography>
              )
            }
            content={
              <>
                {entrance.isDeleted && (
                  <DeletedCard
                    entityType={DELETED_ENTITIES.entrance}
                    entity={entrance}
                    isLoading={isActionLoading}
                    onRestorePress={onRestorePress}
                    onPermanentDeletePress={() => {
                      setIsDeleteConfirmationPermanent(true);
                      setIsDeleteConfirmationOpen(true);
                    }}
                  />
                )}
                <DeleteConfirmationDialog
                  entityType={DELETED_ENTITIES.entrance}
                  isOpen={isDeleteConfirmationOpen}
                  isLoading={isActionLoading}
                  isPermanent={isDeleteConfirmationPermanent}
                  onClose={() => setIsDeleteConfirmationOpen(false)}
                  onConfirmation={entity => {
                    onDeletePress(entity?.id, isDeleteConfirmationPermanent);
                  }}
                />

                {entrance.isSensitive && <SensitiveCaveWarning />}
                <HalfSplitContainer>
                  {(!entrance.isSensitive || isAdmin) && (
                    <Box sx={{ flex: 1, minHeight: 200 }}>
                      <Map positions={mapPositions} loading={isLoading} />
                    </Box>
                  )}
                  <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <Properties
                      entrance={entrance}
                      dataQuality={entrance.dataQuality}
                    />
                  </Box>
                </HalfSplitContainer>
              </>
            }
          />
        )}
        {isLoading && (
          <Card sx={{ padding: 3 }}>
            <Skeleton height={300} />
            <Skeleton height={80} />
            <Skeleton height={100} />
            <Skeleton height={150} />
            <Skeleton height={100} />
          </Card>
        )}
        {error && (
          <Card sx={{ padding: 3 }}>
            <Alert
              title={formatMessage({
                id: 'Error, the entrance data you are looking for is not available.'
              })}
              severity="error"
            />
          </Card>
        )}
        {entrance && (
          <>
            {(isAuth || entrance.locations.length > 0) && (
              <Locations
                locations={entrance.locations}
                entranceId={entrance.id}
                isSensitive={entrance.isSensitive}
                isEditAllowed={!entrance.isDeleted}
              />
            )}
            {(isAuth || entrance.descriptions.length > 0) && (
              <Descriptions
                descriptions={entrance.descriptions}
                entityType="entrance"
                entityId={entrance.id}
                isEditAllowed={!entrance.isDeleted}
              />
            )}
            {(isAuth || entrance.riggings.length > 0) && (
              <Riggings
                riggings={entrance.riggings}
                entranceId={entrance.id}
                isEditAllowed={!entrance.isDeleted}
              />
            )}
            {(isAuth || entrance.documents.length > 0) && (
              <Documents
                documents={entrance.documents}
                entranceId={entrance.id}
                isEditAllowed={!entrance.isDeleted}
              />
            )}
            {(isAuth || entrance.histories.length > 0) && (
              <Histories
                histories={entrance.histories}
                entranceId={entrance.id}
                isEditAllowed={!entrance.isDeleted}
              />
            )}
            {(isAuth || entrance.comments.length > 0) && (
              <Comments
                comments={entrance.comments}
                entranceId={entrance.id}
                isEditAllowed={!entrance.isDeleted}
              />
            )}

            {isAuth && (
              <StandardDialog
                fullWidth
                maxWidth="md"
                open={isEditing}
                onClose={() => setEditing(false)}
                scrollable
                title={formatMessage({ id: 'Entrance edition' })}>
                <EntranceForm
                  entranceValues={{
                    country: entrance.country,
                    depth: entrance.depth,
                    length: entrance.length,
                    id: entrance.id,
                    isSensitive: entrance.isSensitive,
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
                    latitude: entrance?.latitude,
                    longitude: entrance?.longitude,
                    altitude: entrance.altitude,
                    yearDiscovery: entrance.discoveryYear
                  }}
                  caveValues={{
                    ...entrance.cave,
                    name: entrance.cave?.name,
                    language: entrance.cave?.language
                  }}
                />
              </StandardDialog>
            )}
          </>
        )}
      </FixedLayout>
    </div>
  );
};

Entry.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.shape({}),
  entrance: EntrancePropTypes
};

export default Entry;
