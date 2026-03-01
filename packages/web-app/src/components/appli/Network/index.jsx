import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Skeleton from '@mui/material/Skeleton';
import { Box, Card } from '@mui/material';

import { usePermissions, useUserProperties } from '../../../hooks';
import { linkCave } from '../../../actions/Cave/LinkCave';
import { unlinkCave } from '../../../actions/Cave/UnlinkCave';
import FixedLayout from '../../common/Layouts/Fixed';
import FixedContent from '../../common/Layouts/Fixed/FixedContent';
import CustomIcon from '../../common/CustomIcon';
import EntrancesMap from './EntrancesMap';
import Properties from './Properties';
import { deleteCave } from '../../../actions/Cave/DeleteCave';
import { restoreCave } from '../../../actions/Cave/RestoreCave';
import EntrancesSelector from './EntrancesSelector';
import { NetworkForm } from '../EntitiesForm';
import StandardDialog from '../../common/StandardDialog';
import AuthorAndDate from '../../common/Contribution/AuthorAndDate';
import Alert from '../../common/Alert';
import EntrancesList from './EntrancesList';
import Descriptions from '../Descriptions';
import { filterValidPositions } from '../../common/Maps/MapMultipleMarkers';
import { CavePropTypes } from '../../../types/cave.type';
import {
  DeletedCard,
  DeleteConfirmationDialog,
  DELETED_ENTITIES
} from '../../common/card/Deleted';
import { fetchPerson } from '../../../actions/Person/GetPerson';

export const Network = ({ isLoading, error, cave }) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const { caveId } = useParams();
  const { isAuth, isModerator } = usePermissions();
  const componentRef = useRef();
  const [isEditing, setEditing] = useState(false);
  const [selectedEntrancesId, setSelectedEntrancesId] = useState([]);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [isDeleteConfirmationPermanent, setIsDeleteConfirmationPermanent] =
    useState(false);
  const [wantedDeletedState, setWantedDeletedState] = useState(false);
  const userId = useUserProperties()?.id ?? null;
  const [isExploredLoading, setIsExploredLoading] = useState(false);
  const [isExplored, setIsExplored] = useState(false);
  const { person, error: personError } = useSelector(state => state.person);
  const exploredNetworks = person?.exploredNetworks;

  useEffect(() => {
    if (cave) setWantedDeletedState(cave.isDeleted);
  }, [cave]);

  let onDelete = null;
  if (!cave?.isDeleted && isModerator) {
    onDelete = () => {
      setIsDeleteConfirmationPermanent(false);
      setIsDeleteConfirmationOpen(true);
    };
  }

  const onDeletePress = (entityId, isPermanent) => {
    setWantedDeletedState(true);
    dispatch(deleteCave({ id: caveId, entityId, isPermanent }));
    if (isPermanent) navigate('/', { replace: true });
  };
  const onRestorePress = () => {
    setWantedDeletedState(false);
    dispatch(restoreCave({ id: caveId }));
  };

  useEffect(() => {
    if (userId && !person && !personError) {
      dispatch(fetchPerson(userId));
    }
  }, [userId, person, personError, dispatch]);

  useEffect(() => {
    if (cave?.id) {
      const explored =
        exploredNetworks?.some(n => n?.id === cave?.id);
      setIsExplored(explored);
    }
  }, [exploredNetworks, cave?.id]);

  const handleToggleExplored = async () => {
    if (!userId || !caveId) return;

    setIsExploredLoading(true);
    try {
      if (isExplored) {
        await dispatch(unlinkCave(caveId, userId, false));
      } else {
        await dispatch(linkCave(caveId, userId, false));
      }
      setIsExplored(!isExplored);
    } catch (error) {
      console.error('Error toggling explored status:', error);
      setIsExplored(isExplored);
    } finally {
      setIsExploredLoading(false);
    }
  };

  const isActionLoading = wantedDeletedState !== cave?.isDeleted;

  return (
    <div ref={componentRef}>
      <FixedLayout
        fixedContent={
          cave && (
            <FixedContent
              title={cave?.name ?? ''}
              icon={<CustomIcon type="network" />}
              onEdit={
                isAuth && !cave?.isDeleted
                  ? () => setEditing(true)
                  : undefined
              }
              onDelete={onDelete}
              isExplored={isAuth && caveId ? isExplored : null}
              isExploredLoading={isExploredLoading}
              onToggleExplored={isAuth && caveId && !cave?.isDeleted ? handleToggleExplored : undefined}
              printRef={componentRef}
              content={
                <>
                  {cave.isDeleted && (
                    <DeletedCard
                      entityType={DELETED_ENTITIES.network}
                      entity={cave}
                      isLoading={isActionLoading}
                      onRestorePress={onRestorePress}
                      onPermanentDeletePress={() => {
                        setIsDeleteConfirmationPermanent(true);
                        setIsDeleteConfirmationOpen(true);
                      }}
                    />
                  )}
                  <DeleteConfirmationDialog
                    entityType={DELETED_ENTITIES.network}
                    isOpen={isDeleteConfirmationOpen}
                    isLoading={isActionLoading}
                    isPermanent={isDeleteConfirmationPermanent}
                    isSearchMandatory={
                      isDeleteConfirmationPermanent &&
                      (cave?.entrances ?? []).length > 0
                    }
                    onClose={() => setIsDeleteConfirmationOpen(false)}
                    onConfirmation={entity => {
                      onDeletePress(entity?.id, isDeleteConfirmationPermanent);
                    }}
                  />

                  <EntrancesMap
                    isLoading={isLoading ?? true}
                    entrances={cave?.entrances ?? []}
                    selectedEntrancesId={selectedEntrancesId}
                  />
                  <Properties isLoading={isLoading} cave={cave ?? {}}>
                    {filterValidPositions(cave?.entrances ?? []).length > 1 && (
                      <EntrancesSelector
                        onSelect={newSelection =>
                          setSelectedEntrancesId(newSelection)
                        }
                        isLoading={isLoading}
                        entrances={cave?.entrances}
                        selectedEntrancesId={selectedEntrancesId}
                      />
                    )}
                  </Properties>
                </>
              }
              footer={
                <>
                  {cave.author && (
                    <AuthorAndDate
                      author={cave.author}
                      verb="Created"
                      date={cave.dateInscription}
                    />
                  )}
                  {cave.reviewer && (
                    <AuthorAndDate
                      author={cave.reviewer}
                      verb="Updated"
                      date={cave.dateReviewed}
                    />
                  )}
                </>
              }
            />
          )
        }>
        {isLoading && (
          <Card sx={{ padding: 3 }}>
            <Box style={{ display: 'flex', justifyContent: 'center' }}>
              <Skeleton height={300} width={800} /> {/* Map Skeleton */}
            </Box>
            <Skeleton height={100} /> {/* EntranceList Skeleton */}
            <Skeleton height={100} /> {/* Description Skeleton */}
          </Card>
        )}
        {error && (
          <Card sx={{ padding: 3 }}>
            <Alert
              title={formatMessage({
                id: 'Error, the network data you are looking for is not available.'
              })}
              severity="error"
            />
          </Card>
        )}
        {cave && (
          <>
            <EntrancesList
              isLoading={isLoading}
              entrances={cave.entrances}
              selectedEntrancesId={selectedEntrancesId}
            />
            <Descriptions
              descriptions={cave.descriptions}
              entityType="cave"
              entityId={cave.id}
              isEditAllowed={!cave.isDeleted}
            />
            {isAuth && (
              <StandardDialog
                fullWidth
                maxWidth="md"
                open={isEditing}
                onClose={() => setEditing(false)}
                scrollable
                title={formatMessage({ id: 'Network edition' })}>
                <NetworkForm networkValues={{ ...cave }} />
              </StandardDialog>
            )}
          </>
        )}
      </FixedLayout>
    </div>
  );
};

Network.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.shape({}),
  cave: CavePropTypes
};

export default Network;
