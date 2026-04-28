import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Skeleton from '@mui/material/Skeleton';
import { Box, Breadcrumbs, Card, Link, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import { usePermissions, useUserProperties, useExplored } from '../../../hooks';
import FixedLayout from '../../common/Layouts/Fixed';
import FixedContent from '../../common/Layouts/Fixed/FixedContent';
import CustomIcon from '../../common/CustomIcon';
import EntrancesMap from './EntrancesMap';
import Properties from './Properties';
import { deleteCave } from '../../../actions/Cave/DeleteCave';
import { restoreCave } from '../../../actions/Cave/RestoreCave';
import { NetworkForm } from '../EntitiesForm';
import StandardDialog from '../../common/StandardDialog';
import AuthorAndDate from '../../common/Contribution/AuthorAndDate';
import Alert from '../../common/Alert';
import EntrancesList from './EntrancesList';
import Descriptions from '../Descriptions';
import { CavePropTypes } from '../../../types/cave.type';
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
  const { isExplored, isExploredLoading, handleToggleExplored } = useExplored({
    caveId: cave?.id,
    userId
  });

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

  const isActionLoading = wantedDeletedState !== cave?.isDeleted;
  const country = cave?.entrances?.[0]?.country;

  const handleToggleSelection = id => {
    setSelectedEntrancesId(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div ref={componentRef}>
      <FixedLayout>
        {cave && (
          <FixedContent
            displayShare
            subheader={
              (country || cave.massifs?.length > 0) && (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between">
                  <Breadcrumbs
                    separator="·"
                    sx={{ fontSize: { xs: '1.2rem', md: '1.7rem' } }}>
                    {country && (
                      <Link
                        component={RouterLink}
                        to={`/ui/countries/${country}`}
                        underline="hover"
                        color="inherit"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                        <CustomIcon type="country" size={16} />
                        {country}
                      </Link>
                    )}
                    {cave.massifs?.map(massif => (
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
                  </Breadcrumbs>
                </Box>
              )
            }
            title={cave?.name ?? ''}
            icon={<CustomIcon type="network" />}
            onEdit={
              isAuth && !cave?.isDeleted ? () => setEditing(true) : undefined
            }
            onDelete={onDelete}
            isExplored={isAuth && caveId ? isExplored : null}
            isExploredLoading={isExploredLoading}
            onToggleExplored={
              isAuth && caveId && !cave?.isDeleted
                ? handleToggleExplored
                : undefined
            }
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
                <HalfSplitContainer>
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2
                    }}>
                    <Box sx={{ minHeight: 200 }}>
                      <EntrancesMap
                        isLoading={isLoading}
                        entrances={cave?.entrances ?? []}
                        selectedEntrancesId={selectedEntrancesId}
                      />
                    </Box>
                    <Properties isLoading={isLoading} cave={cave ?? {}} />
                  </Box>
                  <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <EntrancesList
                      inline
                      isLoading={isLoading}
                      entrances={cave?.entrances ?? []}
                      selectedEntrancesId={selectedEntrancesId}
                      onToggleSelection={handleToggleSelection}
                    />
                  </Box>
                </HalfSplitContainer>
              </>
            }
            footer={
              (cave.author || cave.reviewer || cave.language) && (
                <Typography component="div" variant="caption">
                  {cave.author && (
                    <AuthorAndDate
                      author={cave.author}
                      verb="Created"
                      date={cave.dateInscription}
                    />
                  )}
                  {cave.author && cave.reviewer && ' · '}
                  {cave.reviewer && (
                    <AuthorAndDate
                      author={cave.reviewer}
                      verb="Updated"
                      date={cave.dateReviewed}
                    />
                  )}
                  {(cave.author || cave.reviewer) && cave.language && ' · '}
                  {cave.language &&
                    `${formatMessage({ id: 'Language' })} : ${cave.language.toUpperCase()}`}
                </Typography>
              )
            }
          />
        )}
        {isLoading && (
          <Card sx={{ padding: 3 }}>
            <Skeleton height={300} />
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
                <NetworkForm
                  networkValues={{ ...cave }}
                  onCancel={() => setEditing(false)}
                />
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
