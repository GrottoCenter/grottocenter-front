import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Skeleton from '@mui/material/Skeleton';
import { Box, Breadcrumbs, Card, CircularProgress, Link, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { NavigateNext, Print } from '@mui/icons-material';
import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ShareIcon from '@mui/icons-material/Share';
import { useReactToPrint } from 'react-to-print';

import { usePermissions, useUserProperties, useExplored, useSharePage } from '../../../hooks';
import PageHeader from '../../common/Layouts/PageHeader';
import ResponsiveActions from '../../common/Layouts/ResponsiveActions';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
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
  const handleShare = useSharePage();
  const handlePrint = useReactToPrint({ contentRef: componentRef });

  useEffect(() => {
    if (cave) setWantedDeletedState(cave.isDeleted);
  }, [cave]);

  const isActionLoading = wantedDeletedState !== cave?.isDeleted;
  const country = cave?.entrances?.[0]?.country;

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

  const handleToggleSelection = id => {
    setSelectedEntrancesId(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  let ExploredIcon = <CircularProgress size={20} />;
  if (!isExploredLoading) {
    ExploredIcon = isExplored ? <CheckCircleIcon /> : <CheckCircleOutlineIcon />;
  }

  const canToggleExplored = isAuth && caveId && !cave?.isDeleted;
  const canEdit = isAuth && cave && !cave.isDeleted;

  const actions = cave ? (
    <ResponsiveActions
      items={[
        {
          key: 'explored',
          icon: ExploredIcon,
          label: formatMessage({
            id: isExplored
              ? 'Remove from my explored caves'
              : 'Add to my explored caves'
          }),
          onClick: handleToggleExplored,
          color: isExplored ? 'secondary' : 'primary',
          hidden: !canToggleExplored
        },
        {
          key: 'print',
          icon: <Print />,
          label: formatMessage({ id: 'Print' }),
          onClick: handlePrint
        },
        {
          key: 'share',
          icon: <ShareIcon />,
          label: formatMessage({ id: 'Copy link' }),
          onClick: handleShare
        },
        {
          key: 'edit',
          icon: <CreateIcon />,
          label: formatMessage({ id: 'Edit properties' }),
          onClick: () => setEditing(true),
          hidden: !canEdit
        },
        {
          key: 'delete',
          icon: <DeleteIcon />,
          label: formatMessage({ id: 'Delete' }),
          onClick: onDelete,
          hidden: !onDelete
        }
      ]}
    />
  ) : null;

  const breadcrumb =
    country || (cave?.massifs?.length ?? 0) > 0 ? (
      <Breadcrumbs
        separator={<NavigateNext sx={{ fontSize: '1rem' }} />}
        sx={{
          fontSize: { xs: '1.2rem', md: '1.7rem' },
          '& .MuiBreadcrumbs-separator': { mx: { xs: '2px', md: '8px' } }
        }}>
        {country && (
          <Link
            component={RouterLink}
            to={`/ui/countries/${country}`}
            underline="hover"
            color="inherit"
            sx={{ display: 'flex', alignItems: 'center', gap: { xs: '2px', md: '4px' } }}>
            <CustomIcon type="country" size={16} />
            {country}
          </Link>
        )}
        {(cave?.massifs?.length ?? 0) > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: '2px', md: '4px' } }}>
            {cave.massifs.map((massif, index) => (
              <React.Fragment key={massif.id}>
                {index > 0 && <span>·</span>}
                <Link
                  component={RouterLink}
                  to={`/ui/massifs/${massif.id}`}
                  underline="hover"
                  color="inherit"
                  sx={{ display: 'flex', alignItems: 'center', gap: { xs: '2px', md: '4px' } }}>
                  <CustomIcon type="massif" size={16} />
                  {massif.name}
                </Link>
              </React.Fragment>
            ))}
          </Box>
        )}
      </Breadcrumbs>
    ) : null;

  return (
    <div ref={componentRef}>
      <PageHeader
        title={cave?.name ?? (isLoading ? undefined : '')}
        icon={<CustomIcon type="network" />}
        subheader={breadcrumb}
        actions={actions}
      />
      {isLoading && (
        <Card sx={{ m: 2, p: 3 }}>
          <Skeleton height={300} />
          <Skeleton height={100} />
          <Skeleton height={100} />
          <Skeleton height={100} />
        </Card>
      )}
      {error && (
        <Card sx={{ m: 2, p: 3 }}>
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
          {cave.isDeleted && (
            <Box sx={{ m: 2 }}>
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
            </Box>
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
          <ScrollableContent
            content={
              <>
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
                {(cave.author || cave.reviewer || cave.language) && (
                  <Typography component="div" variant="body2" sx={{ mt: 2 }}>
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
                )}
              </>
            }
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
    </div>
  );
};

Network.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.shape({}),
  cave: CavePropTypes
};

export default Network;
