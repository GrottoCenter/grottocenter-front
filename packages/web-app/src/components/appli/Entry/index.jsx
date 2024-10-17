import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import Skeleton from '@mui/material/Skeleton';
import { Box, Card } from '@mui/material';

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
import { usePermissions } from '../../../hooks';
import StandardDialog from '../../common/StandardDialog';
import { EntranceForm } from '../EntitiesForm';
import SensitiveCaveWarning from './SensitiveCaveWarning';
import AuthorAndDate from '../../common/Contribution/AuthorAndDate';
import Alert from '../../common/Alert';
import Map from '../../common/Maps/MapMultipleMarkers';
import { EntrancePropTypes } from '../../../types/entrance.type';
import { SnapshotButton } from './Snapshots/UtilityFunction';
import {
  DeletedCard,
  DeleteConfirmationDialog,
  DELETED_ENTITIES
} from '../../common/card/Deleted';

const HalfSplitContainer = styled('div')(
  ({ theme }) => `
  display: flex;
  flex-direction: column;
  ${theme.breakpoints.up('lg')} {
    flex-direction: row;
  }
`
);

const SnapshotButtonStyled = styled(SnapshotButton)`
  margin-left: auto;
`;

export const Entry = ({ isLoading, error, entrance }) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const { entranceId } = useParams();
  const permissions = usePermissions();
  const componentRef = useRef();
  const [isEditing, setEditing] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [isDeleteConfirmationPermanent, setIsDeleteConfirmationPermanent] =
    useState(false);
  const [wantedDeletedState, setWantedDeletedState] = useState(false);

  useEffect(() => {
    if (entrance) setWantedDeletedState(entrance.isDeleted);
  }, [entrance]);

  let onDelete = null;
  if (!entrance?.isDeleted && permissions.isModerator) {
    onDelete = () => {
      setIsDeleteConfirmationPermanent(false);
      setIsDeleteConfirmationOpen(true);
    };
  }

  const onDeletePress = (entityId, isPermanent) => {
    setWantedDeletedState(true);
    dispatch(deleteEntrance({ id: entranceId, entityId, isPermanent }));
    if (isPermanent) navigate.replace('/', { replace: true });
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
            title={entrance.name ?? ''}
            icon={<CustomIcon type="entry" />}
            onEdit={
              permissions.isAuth && !entrance.isDeleted
                ? () => setEditing(true)
                : undefined
            }
            onDelete={onDelete}
            printRef={componentRef}
            snapshot={{
              id: entrance.id,
              type: 'entrances',
              isNetwork: entrance.cave?.entrances.length > 1,
              getAll: true
            }}
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
                  isSearchMandatory={
                    isDeleteConfirmationPermanent &&
                    (entrance?.entrances ?? []).length > 0
                  }
                  onClose={() => setIsDeleteConfirmationOpen(false)}
                  onConfirmation={entity => {
                    onDeletePress(entity?.id, isDeleteConfirmationPermanent);
                  }}
                />

                {entrance.isSensitive && <SensitiveCaveWarning />}
                <HalfSplitContainer>
                  <Map positions={[entrance]} loading={isLoading} />

                  <Properties entrance={entrance} />
                </HalfSplitContainer>
              </>
            }
            footer={
              <>
                {entrance.author && (
                  <AuthorAndDate
                    author={entrance.author}
                    verb="Created"
                    date={entrance.dateInscription}
                  />
                )}
                {entrance.reviewer && (
                  <AuthorAndDate
                    author={entrance.reviewer}
                    verb="Updated"
                    date={entrance.dateReviewed}
                  />
                )}
                <SnapshotButtonStyled
                  size="small"
                  variant="outlined"
                  color="primary"
                  id={entrance.id}
                  type="entrances"
                  isNetwork={entrance.cave?.entrances.length > 1}
                  label={formatMessage({ id: 'Revisions' })}
                  content={{
                    ...entrance,
                    latitude: entrance?.latitude,
                    longitude: entrance?.longitude,
                    cave: entrance?.cave?.id,
                    caveName: entrance?.cave?.name
                  }}
                />
              </>
            }
          />
        )}
        {isLoading && (
          <Card sx={{ padding: 3 }}>
            <Box style={{ display: 'flex', justifyContent: 'center' }}>
              <Skeleton height={300} width={800} /> {/* Map Skeleton */}
            </Box>
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
            {(permissions.isAuth || entrance.locations.length > 0) && (
              <Locations
                locations={entrance.locations}
                entranceId={entrance.id}
                isSensitive={entrance.isSensitive}
                isEditAllowed={!entrance.isDeleted}
              />
            )}
            {(permissions.isAuth || entrance.descriptions.length > 0) && (
              <Descriptions
                descriptions={entrance.descriptions}
                entityType="entrance"
                entityId={entrance.id}
                isEditAllowed={!entrance.isDeleted}
              />
            )}
            {(permissions.isAuth || entrance.riggings.length > 0) && (
              <Riggings
                riggings={entrance.riggings}
                entranceId={entrance.id}
                isEditAllowed={!entrance.isDeleted}
              />
            )}
            {(permissions.isAuth || entrance.documents.length > 0) && (
              <Documents
                documents={entrance.documents}
                entranceId={entrance.id}
                isEditAllowed={!entrance.isDeleted}
              />
            )}
            {(permissions.isAuth || entrance.histories.length > 0) && (
              <Histories
                histories={entrance.histories}
                entranceId={entrance.id}
                isEditAllowed={!entrance.isDeleted}
              />
            )}
            {(permissions.isAuth || entrance.comments.length > 0) && (
              <Comments
                comments={entrance.comments}
                entranceId={entrance.id}
                isEditAllowed={!entrance.isDeleted}
              />
            )}

            {permissions.isAuth && (
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
                    name: entrance.name,
                    language: entrance.language,
                    latitude: entrance?.latitude,
                    longitude: entrance?.longitude,
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
