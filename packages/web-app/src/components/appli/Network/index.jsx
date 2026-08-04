import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Skeleton from '@mui/material/Skeleton';
import { Box, Breadcrumbs, Card, Typography } from '@mui/material';
import AppLink from '../../common/AppLink';
import { styled } from '@mui/material/styles';
import { NavigateNext, Print } from '@mui/icons-material';
import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import BiotechIcon from '@mui/icons-material/Biotech';
import { useReactToPrint } from 'react-to-print';

import { usePermissions, useSharePage } from '../../../hooks';
import PageContainer from '../../common/Layouts/PageContainer';
import PageHeader from '../../common/Layouts/PageHeader';
import PageTabs from '../../common/Layouts/PageTabs';
import SectionStack from '../../common/Layouts/SectionStack';
import ResponsiveActions from '../../common/Layouts/ResponsiveActions';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import CustomIcon from '../../common/CustomIcon';
import GuidelinesGrouped from '../Guidelines/GuidelinesGrouped';
import EntrancesMap from './EntrancesMap';
import Properties from './Properties';
import Science from './Science';
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
  gap: ${({ theme }) => theme.spacing(1)};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    flex-direction: row;
    align-items: stretch;
    gap: ${({ theme }) => theme.spacing(2)};
  }
`;

export const Network = ({ isLoading, error, cave }) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const { caveId } = useParams();
  const { isAuth, isAdmin, isModerator } = usePermissions();
  const componentRef = useRef();
  const [isEditing, setEditing] = useState(false);
  const [selectedEntrancesId, setSelectedEntrancesId] = useState([]);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [isDeleteConfirmationPermanent, setIsDeleteConfirmationPermanent] =
    useState(false);
  const [wantedDeletedState, setWantedDeletedState] = useState(false);
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

  const canEdit = isAuth && cave && !cave.isDeleted;

  const actions = cave ? (
    <ResponsiveActions
      items={[
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
          hidden: !onDelete,
          destructive: true
        }
      ]}
    />
  ) : null;

  const breadcrumb =
    country || (cave?.massifs?.length ?? 0) > 0 ? (
      <Breadcrumbs
        separator={<NavigateNext sx={{ fontSize: '0.625rem' }} />}
        sx={{
          fontSize: { xs: '0.75rem', md: '1.0625rem' },
          '& .MuiBreadcrumbs-separator': { mx: { xs: '2px', md: '8px' } }
        }}
      >
        {country && (
          <AppLink
            to={`/ui/countries/${country}`}
            underline="hover"
            color="inherit"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: '2px', md: '4px' }
            }}
          >
            <CustomIcon type="country" size={16} />
            {country}
          </AppLink>
        )}
        {(cave?.massifs?.length ?? 0) > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: '2px', md: '4px' }
            }}
          >
            {cave.massifs.map((massif, index) => (
              <React.Fragment key={massif.id}>
                {index > 0 && <span>·</span>}
                <AppLink
                  to={`/ui/massifs/${massif.id}`}
                  underline="hover"
                  color="inherit"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: '2px', md: '4px' }
                  }}
                >
                  <CustomIcon type="massif" size={16} />
                  {massif.name}
                </AppLink>
              </React.Fragment>
            ))}
          </Box>
        )}
      </Breadcrumbs>
    ) : null;

  const tabs = [
    {
      id: 'information',
      label: formatMessage({ id: 'Information' }),
      icon: <ExploreOutlinedIcon fontSize="small" />
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
      : [])
  ];

  return (
    <PageContainer>
      <div ref={componentRef}>
        <PageHeader
          title={cave?.name ?? (isLoading ? undefined : '')}
          icon={<CustomIcon type="network" />}
          subheader={breadcrumb}
          actions={actions}
        />

        <PageTabs tabs={tabs}>
          {/* Tab 0 — Information */}
          <div>
            {isLoading && (
              <SectionStack>
                <Card sx={{ p: 2 }}>
                  <Skeleton height={300} />
                  <Skeleton height={100} />
                  <Skeleton height={100} />
                  <Skeleton height={100} />
                </Card>
              </SectionStack>
            )}
            {error && (
              <SectionStack>
                <Card sx={{ p: 2 }}>
                  <Alert
                    title={formatMessage({
                      id: 'Error, the network data you are looking for is not available.'
                    })}
                    severity="error"
                  />
                </Card>
              </SectionStack>
            )}
            {cave && (
              <SectionStack>
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
                <ScrollableContent
                  content={
                    <>
                      <HalfSplitContainer>
                        <Box
                          sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1
                          }}
                        >
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
                        <Typography
                          component="div"
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          {cave.author && (
                            <AuthorAndDate
                              author={cave.author}
                              verb="Created"
                              date={cave.dateInscription}
                              textColor="inherit"
                            />
                          )}
                          {cave.author && cave.reviewer && ' · '}
                          {cave.reviewer && (
                            <AuthorAndDate
                              author={cave.reviewer}
                              verb="Updated"
                              date={cave.dateReviewed}
                              textColor="inherit"
                            />
                          )}
                          {(cave.author || cave.reviewer) &&
                            cave.language &&
                            ' · '}
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
                {cave.guidelines && (
                  <GuidelinesGrouped guidelines={cave.guidelines} />
                )}
                {isAuth && (
                  <StandardDialog
                    fullWidth
                    maxWidth="md"
                    open={isEditing}
                    onClose={() => setEditing(false)}
                    scrollable
                    title={formatMessage({ id: 'Network edition' })}
                  >
                    <NetworkForm networkValues={{ ...cave }} />
                  </StandardDialog>
                )}
              </SectionStack>
            )}
          </div>

          {/* FIXME: Science panel is admin-only until the Science API is available. */}
          {/* WARNING: this must stay in sync with the 'science' entry in the tabs array above.
            PageTabs matches children to tabs by position. React.Children.toArray strips `false`,
            so `{isAdmin && <Science />}` works — but returning null or wrapping in a div would
            silently shift all subsequent tab panels. */}
          {isAdmin && (
            <SectionStack>
              <Science caveId={caveId} />
            </SectionStack>
          )}
        </PageTabs>
      </div>
    </PageContainer>
  );
};

Network.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.shape({}),
  cave: CavePropTypes
};

export default Network;
