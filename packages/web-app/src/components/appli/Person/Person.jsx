import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Card, Chip, Skeleton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import MailIcon from '@mui/icons-material/Mail';
import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';

import {
  useDeletePerson,
  useUserProperties,
  usePermissions,
  useSharePage
} from '@/hooks';
import { messageKeys, personKeys } from '@/api/queryKeys';
import { PersonPropTypes } from '@/types/person.type';
import PageContainer from '@/components/common/Layouts/PageContainer';
import PageHeader from '@/components/common/Layouts/PageHeader';
import SectionStack from '@/components/common/Layouts/SectionStack';
import ResponsiveActions from '@/components/common/Layouts/ResponsiveActions';
import CustomIcon from '@/components/common/CustomIcon';
import FetchErrorState from '@/components/common/FetchErrorState';
import { apiGetWithRange } from '@/api/client';
import { getConversationsUrl } from '@/conf/apiRoutes';
import { makeUrl } from '@/actions/utils';

import {
  DeleteConfirmationDialog,
  DELETED_ENTITIES
} from '@/components/common/card/Deleted';
import AuthorBody from './AuthorBody';
import CaverBody from './CaverBody';

const Person = ({
  isLoading,
  person,
  error,
  isPaused = false,
  onRetry = null
}) => {
  const queryClient = useQueryClient();
  const deleteMutation = useDeletePerson();
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
  // Own profile goes to the account page; a moderator edits the person record.
  let editPropertiesTarget = null;
  if (canEdit) editPropertiesTarget = '/ui/account';
  else if (canAdminEdit)
    editPropertiesTarget = `/ui/persons/${person?.id}/edit`;

  const handleRefresh = useCallback(() => {
    if (person?.id)
      queryClient.invalidateQueries({ queryKey: personKeys.detail(person.id) });
  }, [queryClient, person?.id]);

  const handleMessageClick = useCallback(async () => {
    if (!person?.id) return;
    try {
      // Reuse the cache if the Messages page has already loaded the first
      // active conversations page; otherwise fetchQuery does exactly one
      // request and hydrates the same cache entry the Messages page uses.
      // Keep pageSize in sync with pages/Messages/index.jsx (PAGE_SIZE = 20)
      // — RQ hashes the key structurally, so a mismatched pageSize keys a
      // separate cache entry and defeats the intended reuse.
      // TODO: replace with a dedicated /conversations?participant=id endpoint
      // — if the target conversation is beyond the first page, it won't be found.
      const criteria = { isArchived: false, page: 1, pageSize: 20 };
      const { data } = await queryClient.fetchQuery({
        queryKey: messageKeys.conversations(criteria),
        queryFn: () =>
          apiGetWithRange(makeUrl(getConversationsUrl, { limit: 20, skip: 0 }))
      });
      const items = data?.conversations ?? [];
      const existingConv = items.find(
        c => Number(c.otherParticipant?.id) === Number(person.id)
      );
      if (existingConv) {
        navigate(`/ui/messages/${existingConv.id}`);
      } else {
        navigate(`/ui/messages?composeTo=${person.id}`);
      }
    } catch (err) {
      console.error('Failed to check existing conversations:', err);
      navigate(`/ui/messages?composeTo=${person.id}`);
    }
  }, [queryClient, person?.id, navigate]);

  let onDelete = null;
  if (person && (permissions.isAdmin || permissions.isModerator)) {
    onDelete = () => setIsDeleteConfirmationOpen(true);
  }
  const onDeletePress = (entityId, isPermanent) => {
    deleteMutation.mutate({ id: person?.id, entityId });
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
          fontSize: '0.875rem',
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
          fontSize: '0.875rem',
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
          onClick: editPropertiesTarget
            ? () => navigate(editPropertiesTarget)
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
      {(!!error || isPaused) && (
        <SectionStack>
          <Card sx={{ p: 2 }}>
            <FetchErrorState
              error={error}
              isPaused={isPaused}
              onRetry={onRetry}
              messageId="Error, the person you are looking for is not available."
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
  isPaused: PropTypes.bool,
  onRetry: PropTypes.func,
  person: PersonPropTypes
};

export default Person;
