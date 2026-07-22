import React, { useEffect, useState, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import Skeleton from '@mui/material/Skeleton';
import {
  Box,
  Breadcrumbs,
  Card,
  CircularProgress,
  Link,
  Typography
} from '@mui/material';
import { NavigateNext, Print } from '@mui/icons-material';
import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ShareIcon from '@mui/icons-material/Share';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import BiotechIcon from '@mui/icons-material/Biotech';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import PermMediaOutlinedIcon from '@mui/icons-material/PermMediaOutlined';
import { useReactToPrint } from 'react-to-print';

import PageContainer from '../../common/Layouts/PageContainer';
import PageHeader from '../../common/Layouts/PageHeader';
import PageTabs from '../../common/Layouts/PageTabs';
import ResponsiveActions from '../../common/Layouts/ResponsiveActions';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import CustomIcon from '../../common/CustomIcon';

import Properties from './Properties';
import GuidelinesGrouped from '../Guidelines/GuidelinesGrouped';
import Descriptions from '../Descriptions';
import Locations from './Locations';
import Riggings from './Riggings/Riggings';
import Comments from './Comments/index';
import Documents from './Documents';
import Histories from './Histories';
import Science from './Science';
import { deleteEntrance } from '../../../actions/Entrance/DeleteEntrance';
import { restoreEntrance } from '../../../actions/Entrance/RestoreEntrance';
import {
  usePermissions,
  useUserProperties,
  useExplored,
  useSharePage
} from '../../../hooks';
import useOpenLink from '../../../hooks/useOpenLink';
import SensitiveCaveWarning from './SensitiveCaveWarning';
import SensitiveLocationPlaceholder from './SensitiveLocationPlaceholder';
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
  gap: ${({ theme }) => theme.spacing(1)};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    flex-direction: row;
    align-items: stretch;
    gap: ${({ theme }) => theme.spacing(2)};
  }
`;

export const Entry = ({
  isLoading,
  error,
  entrance,
  networkDescriptionsCount = 0
}) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const openLink = useOpenLink();
  const { entranceId } = useParams();
  const { isAuth, isAdmin, isModerator } = usePermissions();
  const componentRef = useRef();
  const handleShare = useSharePage();
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [isDeleteConfirmationPermanent, setIsDeleteConfirmationPermanent] =
    useState(false);
  const [wantedDeletedState, setWantedDeletedState] = useState(false);
  const userId = useUserProperties()?.id ?? null;
  const { isExplored, isExploredLoading, handleToggleExplored } = useExplored({
    entranceId: entrance?.id,
    userId
  });
  const mapPositions = useMemo(() => (entrance ? [entrance] : []), [entrance]);

  useEffect(() => {
    if (entrance) setWantedDeletedState(entrance.isDeleted);
  }, [entrance]);

  const isActionLoading = wantedDeletedState !== entrance?.isDeleted;

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

  const handlePrint = useReactToPrint({ contentRef: componentRef });

  let ExploredIcon = <CircularProgress size={20} />;
  if (!isExploredLoading) {
    ExploredIcon = isExplored ? (
      <CheckCircleIcon />
    ) : (
      <CheckCircleOutlineIcon />
    );
  }

  const canToggleExplored =
    isAuth && entrance?.cave?.id && !entrance?.isDeleted;
  const canEdit = isAuth && entrance && !entrance.isDeleted;

  const isNetwork = entrance?.cave?.entrances?.length > 1;

  const snapshotUrl = entrance
    ? `/ui/entrances/${entrance.id}/snapshots?isNetwork=${isNetwork}`
    : null;

  const actions = entrance ? (
    <ResponsiveActions
      items={[
        {
          key: 'explored',
          icon: ExploredIcon,
          label: formatMessage({
            id: isExplored
              ? 'Remove from my explored entrances'
              : 'Add to my explored entrances'
          }),
          onClick: handleToggleExplored,
          color: isExplored ? 'success' : 'primary',
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
          onClick: () => navigate(`/ui/entrances/${entrance.id}/edit`),
          hidden: !canEdit
        },
        {
          key: 'delete',
          icon: <DeleteIcon />,
          label: formatMessage({ id: 'Delete' }),
          onClick: onDelete,
          hidden: !onDelete
        },
        {
          key: 'snapshot',
          icon: <HistoryIcon />,
          label: formatMessage({ id: 'History' }),
          onClick: () => openLink(snapshotUrl)
        },
        {
          key: 'snapshot-all',
          icon: <ManageHistoryIcon />,
          label: formatMessage({ id: 'Page history' }),
          onClick: () => openLink(`${snapshotUrl}&all=true`)
        }
      ]}
    />
  ) : null;

  const breadcrumb = entrance ? (
    <Breadcrumbs
      separator={<NavigateNext sx={{ fontSize: '1.2rem' }} />}
      sx={{
        fontSize: { xs: '1.2rem', md: '1.7rem' },
        '& .MuiBreadcrumbs-separator': { mx: { xs: '2px', md: '8px' } }
      }}>
      {entrance.country && (
        <Link
          component={RouterLink}
          to={`/ui/countries/${entrance.country}`}
          underline="hover"
          color="inherit"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: '2px', md: '4px' }
          }}>
          <CustomIcon type="country" size={16} />
          {entrance.country}
        </Link>
      )}
      {entrance.massifs?.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: '2px', md: '4px' }
          }}>
          {entrance.massifs.map((massif, index) => (
            <React.Fragment key={massif.id}>
              {index > 0 && <span>·</span>}
              <Link
                component={RouterLink}
                to={`/ui/massifs/${massif.id}`}
                underline="hover"
                color="inherit"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: '2px', md: '4px' }
                }}>
                <CustomIcon type="massif" size={16} />
                {massif.name}
              </Link>
            </React.Fragment>
          ))}
        </Box>
      )}
      {isNetwork && (
        <Link
          component={RouterLink}
          to={`/ui/caves/${entrance.cave.id}`}
          underline="hover"
          color="inherit"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: '2px', md: '4px' }
          }}>
          <CustomIcon type="network" size={16} />
          {entrance.cave.name}
        </Link>
      )}
    </Breadcrumbs>
  ) : null;

  const tabs = [
    {
      id: 'information',
      label: formatMessage({ id: 'Information' }),
      icon: <ExploreOutlinedIcon fontSize="small" />
    },
    {
      id: 'documents',
      label: formatMessage({ id: 'Documents' }),
      icon: <PermMediaOutlinedIcon fontSize="small" />,
      count: entrance?.documents?.length,
      disabled: !!entrance && !isAuth && entrance.documents.length === 0
    },
    // FIXME: 'science' tab is admin-only until the Science API is available.
    // Remove the isAdmin filter once the API is integrated.
    ...(isAdmin
      ? [
          {
            id: 'science',
            label: formatMessage({ id: 'Science' }),
            icon: <BiotechIcon fontSize="small" />
          }
        ]
      : []),
    {
      id: 'comments',
      label: formatMessage({ id: 'Comments' }),
      icon: <ChatOutlinedIcon fontSize="small" />,
      count: entrance?.comments?.length,
      disabled: !!entrance && !isAuth && entrance.comments.length === 0
    }
  ];

  return (
    <PageContainer>
      <div ref={componentRef}>
        <PageHeader
          title={entrance?.name ?? (isLoading ? undefined : '')}
          icon={<CustomIcon type="entrance" />}
          subheader={breadcrumb}
          actions={actions}
        />

        <PageTabs tabs={tabs}>
          {/* Tab Information */}
          <div>
            {isLoading && (
              <Card sx={{ m: 1, p: 2 }}>
                <Skeleton height={300} />
                <Skeleton height={80} />
                <Skeleton height={100} />
                <Skeleton height={150} />
                <Skeleton height={100} />
              </Card>
            )}
            {error && (
              <Card sx={{ m: 1, p: 2 }}>
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
                {entrance.isDeleted && (
                  <Box sx={{ m: 1 }}>
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
                  </Box>
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
                {entrance.isSensitive && isAdmin && (
                  <Box sx={{ mx: 1, mt: 1 }}>
                    <SensitiveCaveWarning />
                  </Box>
                )}
                <ScrollableContent
                  content={
                    <>
                      <HalfSplitContainer>
                        <Box sx={{ flex: 1, minHeight: 200, display: 'flex' }}>
                          {!entrance.isSensitive || isAdmin ? (
                            <Map positions={mapPositions} loading={isLoading} />
                          ) : (
                            <SensitiveLocationPlaceholder />
                          )}
                        </Box>
                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                          <Properties
                            entrance={entrance}
                            dataQuality={entrance.dataQuality}
                          />
                        </Box>
                      </HalfSplitContainer>
                      {(entrance.author ||
                        entrance.reviewer ||
                        entrance.language) && (
                        <Typography
                          component="div"
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 1 }}>
                          {entrance.author && (
                            <AuthorAndDate
                              author={entrance.author}
                              verb="Created"
                              date={entrance.dateInscription}
                              textColor="inherit"
                            />
                          )}
                          {entrance.author && entrance.reviewer && ' · '}
                          {entrance.reviewer && (
                            <AuthorAndDate
                              author={entrance.reviewer}
                              verb="Updated"
                              date={entrance.dateReviewed}
                              textColor="inherit"
                            />
                          )}
                          {entrance.language &&
                            (entrance.author || entrance.reviewer) &&
                            ' · '}
                          {entrance.language &&
                            `${formatMessage({ id: 'Language' })} : ${entrance.language.toUpperCase()}`}
                        </Typography>
                      )}
                    </>
                  }
                />

                <Locations
                  locations={entrance.locations}
                  entranceId={entrance.id}
                  isSensitive={entrance.isSensitive}
                  isEditAllowed={!entrance.isDeleted}
                />
                <Descriptions
                  descriptions={entrance.descriptions}
                  entityType="entrance"
                  entityId={entrance.id}
                  isEditAllowed={!entrance.isDeleted}
                  networkId={isNetwork ? entrance.cave.id : undefined}
                  networkName={isNetwork ? entrance.cave.name : undefined}
                  networkDescriptionsCount={networkDescriptionsCount}
                />
                {entrance.guidelines && (
                  <GuidelinesGrouped guidelines={entrance.guidelines} />
                )}
                <Riggings
                  riggings={entrance.riggings}
                  entranceId={entrance.id}
                  isEditAllowed={!entrance.isDeleted}
                />
                <Histories
                  histories={entrance.histories ?? []}
                  entranceId={entrance.id}
                  isEditAllowed={!entrance.isDeleted}
                />
              </>
            )}
          </div>

          {/* Tab 1 — Documents */}
          <div>
            {isLoading && (
              <Card sx={{ m: 1, p: 2 }}>
                <Skeleton height={40} width="100%" />
                <Skeleton height={60} />
                <Skeleton height={60} />
                <Skeleton height={60} />
              </Card>
            )}
            {entrance && (
              <Documents
                documents={entrance.documents}
                entranceId={entrance.id}
                isEditAllowed={!entrance.isDeleted}
              />
            )}
          </div>

          {/* FIXME: Science panel is admin-only until the Science API is available. */}
          {/* WARNING: this must stay in sync with the 'science' entry in the tabs array above.
            PageTabs matches children to tabs by position. React.Children.toArray strips `false`,
            so `{isAdmin && <Science />}` works — but returning null or wrapping in a div would
            silently shift all subsequent tab panels. */}
          {isAdmin && entrance?.cave?.id && (
            <Science caveId={entrance.cave.id} />
          )}

          {/* Tab 3 — Comments */}
          <div>
            {isLoading && (
              <Card sx={{ m: 1, p: 2 }}>
                <Skeleton height={40} width="100%" />
                <Skeleton height={80} />
                <Skeleton height={80} />
              </Card>
            )}
            {entrance && (
              <Comments
                comments={entrance.comments}
                entranceId={entrance.id}
                isEditAllowed={!entrance.isDeleted}
              />
            )}
          </div>
        </PageTabs>
      </div>
    </PageContainer>
  );
};

Entry.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.shape({}),
  entrance: EntrancePropTypes,
  networkDescriptionsCount: PropTypes.number
};

export default Entry;
