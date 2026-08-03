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

import { useUserProperties, usePermissions, useSharePage } from '@/hooks';
import { PersonPropTypes } from '@/types/person.type';
import PageContainer from '@/components/common/Layouts/PageContainer';
import PageHeader from '@/components/common/Layouts/PageHeader';
import SectionStack from '@/components/common/Layouts/SectionStack';
import ResponsiveActions from '@/components/common/Layouts/ResponsiveActions';
import CustomIcon from '@/components/common/CustomIcon';
import Alert from '@/components/common/Alert';
import { deletePerson } from '@/actions/Person/DeletePerson';
import { fetchPerson } from '@/actions/Person/GetPerson';
import { fetchConversations } from '@/actions/Messaging/GetConversations';

import {
  DeleteConfirmationDialog,
  DELETED_ENTITIES
} from '@/components/common/card/Deleted';
import AuthorBody from './AuthorBody';
import CaverBody from './CaverBody';

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
        const updatedConversations =
          state.messaging?.activeConversations?.items || [];
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
  // undocumented in the API spec. Authors are placeholders used to attribute documents to
  // someone who does not have an account — they cannot log in, message, or record activity.
  const isAuthor = person?.type === 'AUTHOR';
  const canMessage =
    !canEdit && userId && !isAuthor && !person?.isBanned && !person?.isDeleted;

  let titleAdornment = null;
  if (canEdit) {
    titleAdornment = (
      <Chip
        label={formatMessage({ id: 'You' }).toUpperCase()}
        color="secondary"
        sx={{
          ml: 2,
          fontSize: '1.4rem',
          letterSpacing: 1.5,
          verticalAlign: 'middle',
          color: '#fff',
          fontWeight: 700
        }}
      />
    );
  } else if (isAuthor) {
    titleAdornment = (
      <Chip
        label={formatMessage({ id: 'Author' }).toUpperCase()}
        variant="outlined"
        sx={{
          ml: 2,
          fontSize: '1.4rem',
          letterSpacing: 1.5,
          verticalAlign: 'middle',
          fontWeight: 700
        }}
      />
    );
  }

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
          hidden: !onDelete,
          destructive: true
        }
      ]}
    />
  ) : null;

  return (
    <PageContainer>
      {/* Keep the header whenever we have a person to describe (even if a
          subsequent fetch errored on a stale entity) or while loading — so
          the user retains title, chip and actions. Only hide it when there's
          nothing to show: an error with no person in the store. */}
      {(isLoading || person) && (
        <PageHeader
          title={isLoading ? undefined : title}
          icon={<CustomIcon type={isAuthor ? 'author' : 'caver'} />}
          titleAdornment={titleAdornment}
          actions={actions}
        />
      )}
      {isLoading && (
        <SectionStack>
          <Card sx={{ p: 2 }}>
            <Skeleton />
            <Skeleton height={200} />
            <Skeleton height={100} />
            <Skeleton height={100} />
            <Skeleton height={100} />
            <Skeleton height={100} />
          </Card>
        </SectionStack>
      )}
      {!!error && (
        <SectionStack>
          <Card sx={{ p: 2 }}>
            <Alert
              title={formatMessage({
                id: 'Error, the person you are looking for is not available.'
              })}
              severity="error"
            />
          </Card>
        </SectionStack>
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
          {isAuthor ? (
            <AuthorBody person={person} />
          ) : (
            <CaverBody
              person={person}
              canEdit={canEdit}
              onRefresh={handleRefresh}
            />
          )}
        </>
      )}
    </PageContainer>
  );
};

Person.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.shape({}),
  person: PersonPropTypes
};

export default Person;
