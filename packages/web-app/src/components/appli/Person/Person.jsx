import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Card, Chip, Skeleton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector, useStore } from 'react-redux';
import MailIcon from '@mui/icons-material/Mail';
import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';

import {
  useUserProperties,
  usePermissions,
  useSharePage
} from '../../../hooks';
import { PersonPropTypes } from '../../../types/person.type';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined';
import PermMediaOutlinedIcon from '@mui/icons-material/PermMediaOutlined';
import PageHeader from '../../common/Layouts/PageHeader';
import PageTabs from '../../common/Layouts/PageTabs';
import ResponsiveActions from '../../common/Layouts/ResponsiveActions';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import CustomIcon from '../../common/CustomIcon';
import Alert from '../../common/Alert';
import DocumentsList from '../../common/DocumentsList/DocumentsList';
import EntitiesList from '../../common/entitiesList/EntitiesList';
import RelatedCaves from '../../common/RelatedCaves/RelatedCaves';
import PersonProperties from '../../common/Person/PersonProperties';
import { deletePerson } from '../../../actions/Person/DeletePerson';
import { fetchPerson } from '../../../actions/Person/GetPerson';
import { fetchConversations } from '../../../actions/Messaging/GetConversations';

import {
  DeleteConfirmationDialog,
  DELETED_ENTITIES
} from '../../common/card/Deleted';

const Person = ({ isLoading, person, error }) => {
  const dispatch = useDispatch();
  const store = useStore();
  const activeConversations = useSelector(
    state => state.messaging.activeConversations.items
  );
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const handleShare = useSharePage();

  const userId = useUserProperties()?.id ?? null;
  let canEdit = false;
  if (userId && person) {
    canEdit = userId.toString() === person?.id?.toString();
  }
  const canAdminEdit =
    person && !canEdit && (permissions.isAdmin || permissions.isModerator);

  const handleRefresh = useCallback(() => {
    dispatch(fetchPerson(person.id));
  }, [dispatch, person?.id]);

  const handleMessageClick = useCallback(async () => {
    if (!person?.id) return;
    try {
      // First, check if the conversation already exists in our currently loaded conversations
      let existingConv = activeConversations.find(
        c => Number(c.otherParticipant?.id) === Number(person.id)
      );

      if (!existingConv) {
        // TODO: If the target conversation is beyond the first 50 conversations, it won't be found here.
        // We should implement a dedicated backend endpoint to retrieve a conversation by participant ID.
        // If not found, do a single fetch (first 50 conversations) to update the Redux store
        await dispatch(fetchConversations({ limit: 50, skip: 0 }, false));
        
        // Read updated conversations from the store to avoid UI flashing from multiple page loads
        const state = store.getState();
        const updatedConversations = state.messaging?.activeConversations?.items || [];
        existingConv = updatedConversations.find(
          c => Number(c.otherParticipant?.id) === Number(person.id)
        );
      }

      if (existingConv) {
        navigate(`/ui/messages/${existingConv.id}`);
      } else {
        navigate(`/ui/messages?composeTo=${person.id}`);
      }
    } catch (err) {
      console.error('Failed to check existing conversations:', err);
      navigate(`/ui/messages?composeTo=${person.id}`);
    }
  }, [dispatch, person?.id, navigate, activeConversations, store]);



  let onDelete = null;
  if (person && (permissions.isAdmin || permissions.isModerator)) {
    onDelete = () => setIsDeleteConfirmationOpen(true);
  }
  const onDeletePress = (entityId, isPermanent) => {
    dispatch(deletePerson({ id: person?.id, entityId, isPermanent }));
    if (isPermanent) navigate('/', { replace: true });
  };

  let title = '';
  if (person) {
    title =
      person.name && person.surname
        ? `${person.name} ${person.surname}`
        : (person.nickname ?? '');
  }

  // The API consistently returns "type": "CAVER" or "type": "AUTHOR" on person responses,
  // undocumented in the API spec. Checking `person?.type !== 'AUTHOR'` correctly prevents
  // showing the messaging action for authors.
  const canMessage =
    !canEdit && userId && person?.type !== 'AUTHOR' && !person?.isBanned && !person?.isDeleted;

  const titleAdornment = canEdit ? (
    <Chip
      label={formatMessage({ id: 'You' }).toUpperCase()}
      color="secondary"
      sx={{
        ml: 3,
        fontSize: '1.4rem',
        letterSpacing: 1.5,
        verticalAlign: 'middle',
        color: '#fff',
        fontWeight: 700
      }}
    />
  ) : null;

  const actions = person ? (
    <ResponsiveActions
      items={[
        {
          key: 'message',
          icon: <MailIcon />,
          label: formatMessage({ id: 'Message this caver' }),
          onClick: handleMessageClick,
          hidden: !canMessage
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
          onClick: canEdit
            ? () => navigate('/ui/account')
            : canAdminEdit
              ? () => navigate(`/ui/persons/${person?.id}/edit`)
              : undefined,
          hidden: !canEdit && !canAdminEdit
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

  const nbOrganizations = (person?.organizations ?? []).length;
  const nbNetworks = (person?.exploredNetworks ?? []).length;
  const nbEntrances = (person?.exploredEntrances ?? []).length;

  const tabs = [
    {
      id: 'profil',
      label: formatMessage({ id: 'Profile' }),
      icon: <AccountCircleOutlinedIcon fontSize="small" />
    },
    {
      id: 'activities',
      label: formatMessage({ id: 'Activities' }),
      icon: <TravelExploreOutlinedIcon fontSize="small" />,
      count: nbOrganizations + nbNetworks + nbEntrances,
      disabled: !!person && nbOrganizations + nbNetworks + nbEntrances === 0
    },
    {
      id: 'documents',
      label: formatMessage({ id: 'Documents' }),
      icon: <PermMediaOutlinedIcon fontSize="small" />,
      count: person?.documents?.length,
      disabled: !!person && (person.documents?.length ?? 0) === 0
    }
  ];

  return (
    <>
      <PageHeader
        title={isLoading ? undefined : title}
        icon={<CustomIcon type="caver" />}
        titleAdornment={titleAdornment}
        actions={actions}
      />
      <PageTabs tabs={tabs}>
        {/* Tab Profil */}
        <div>
          {isLoading && (
            <Card sx={{ m: 2, p: 3 }}>
              <Skeleton />
              <Skeleton height={200} />
              <Skeleton height={100} />
              <Skeleton height={100} />
              <Skeleton height={100} />
              <Skeleton height={100} />
            </Card>
          )}
          {!!error && (
            <Card sx={{ m: 2, p: 3 }}>
              <Alert
                title={formatMessage({
                  id: 'Error, the person you are looking for is not available.'
                })}
                severity="error"
              />
            </Card>
          )}
          {person && (
            <>
              <DeleteConfirmationDialog
                entityType={DELETED_ENTITIES.person}
                isOpen={isDeleteConfirmationOpen}
                isLoading={false}
                isPermanent
                onClose={() => setIsDeleteConfirmationOpen(false)}
                onConfirmation={entity => onDeletePress(entity?.id, true)}
              />
              <ScrollableContent
                content={<PersonProperties person={person} canEdit={canEdit} />}
              />
            </>
          )}
        </div>

        {/* Tab Activités */}
        <div>
          {isLoading && (
            <Card sx={{ m: 2, p: 3 }}>
              <Skeleton height={100} />
              <Skeleton height={100} />
            </Card>
          )}
          {person && (
            <>
              <ScrollableContent
                anchorId="organizations"
                title={formatMessage({ id: 'Organizations' })}
                defaultExpanded={nbOrganizations > 0}
                count={nbOrganizations}
                content={
                  <EntitiesList
                    type="organization"
                    entities={person.organizations}
                    emptyMessage={
                      <Alert
                        severity="info"
                        title={formatMessage({
                          id: 'This person is not a member of any organization yet.'
                        })}
                      />
                    }
                  />
                }
              />
              <ScrollableContent
                anchorId="related-caves"
                title={formatMessage({ id: 'Explored caves' })}
                defaultExpanded={nbNetworks + nbEntrances > 0}
                count={nbNetworks + nbEntrances}
                content={
                  <RelatedCaves
                    exploredEntrances={person.exploredEntrances}
                    exploredNetworks={person.exploredNetworks}
                    entityId={person.id}
                    isOrganization={false}
                    canManageCaves={false}
                    onRefresh={handleRefresh}
                  />
                }
              />
            </>
          )}
        </div>

        {/* Tab Documents */}
        <div>
          {isLoading && (
            <Card sx={{ m: 2, p: 3 }}>
              <Skeleton height={40} width="100%" />
              <Skeleton height={60} />
              <Skeleton height={60} />
              <Skeleton height={60} />
            </Card>
          )}
          {person && (
            <ScrollableContent
              collapsible={false}
              content={<DocumentsList documents={person.documents} />}
            />
          )}
        </div>
      </PageTabs>
    </>
  );
};

Person.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.shape({}),
  person: PersonPropTypes
};

export default Person;
