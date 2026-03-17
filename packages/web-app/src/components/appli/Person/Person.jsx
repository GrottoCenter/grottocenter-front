import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Skeleton from '@mui/material/Skeleton';
import { useIntl } from 'react-intl';
import { Box, Button, Card, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import { useUserProperties, usePermissions } from '../../../hooks';
import subscriptionsType from '../../../types/subscriptions.type';
import { PersonPropTypes } from '../../../types/person.type';
import REDUCER_STATUS from '../../../reducers/ReducerStatus';
import FixedLayout from '../../common/Layouts/Fixed';
import FixedContent from '../../common/Layouts/Fixed/FixedContent';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import CustomIcon from '../../common/CustomIcon';
import Alert from '../../common/Alert';
import DocumentsList from '../../common/DocumentsList/DocumentsList';
import EntitiesList from '../../common/entitiesList/EntitiesList';
import RelatedCaves from '../../common/RelatedCaves/RelatedCaves';
import PersonProperties from '../../common/Person/PersonProperties';
import SubscriptionsList from '../../common/Subscriptions/SubscriptionsList';
import { deletePerson } from '../../../actions/Person/DeletePerson';
import { leaveOrganization } from '../../../actions/Organization/LeaveOrganization';
import { fetchPerson } from '../../../actions/Person/GetPerson';
import {
  DeleteConfirmationDialog,
  DELETED_ENTITIES
} from '../../common/card/Deleted';

const Person = ({
  isLoading,
  person,
  error,
  subscriptions,
  subscriptionsStatus
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { formatMessage } = useIntl();

  const permissions = usePermissions();
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [isCaveSearchVisible, setIsCaveSearchVisible] = useState(false);

  const userId = useUserProperties()?.id ?? null;
  let canEdit = false;
  if (userId && person) {
    canEdit = userId.toString() === person?.id?.toString();
  }
  const canUnsubscribe = canEdit || permissions.isAdmin;

  const handleLeaveOrganization = async organizationId => {
    if (!person?.id) return;
    try {
      await dispatch(leaveOrganization(person.id, organizationId));
      dispatch(fetchPerson(person.id));
    } catch (err) {
      console.error('Error leaving organization:', err);
    }
  };

  let onDelete = null;
  if (person && (permissions.isAdmin || permissions.isModerator)) {
    onDelete = () => {
      setIsDeleteConfirmationOpen(true);
    };
  }
  const onDeletePress = (entityId, isPermanent) => {
    dispatch(deletePerson({ id: person?.id, entityId, isPermanent }));
    if (isPermanent) navigate('/', { replace: true });
  };

  let title = '';
  if (person) {
    title += `${formatMessage({ id: 'Profile page of the user' })} : `;
    if (person.name && person.surname) {
      title += `${person.name} ${person.surname}`;
    } else {
      title += `${person.nickname}`;
    }
  }

  return (
    <FixedLayout>
      {person && (
        <FixedContent
          icon={<CustomIcon type="caver" />}
          title={title}
          onEdit={
            canEdit ? () => navigate(`/ui/persons/${person?.id}/edit`) : undefined
          }
          onDelete={onDelete}
          content={
            <>
              <DeleteConfirmationDialog
                entityType={DELETED_ENTITIES.person}
                isOpen={isDeleteConfirmationOpen}
                isLoading={false}
                isPermanent
                onClose={() => setIsDeleteConfirmationOpen(false)}
                onConfirmation={entity => {
                  onDeletePress(entity?.id, true);
                }}
              />
              <Box
                alignItems="start"
                display="flex"
                flexBasis="300px"
                justifyContent="space-between">
                <PersonProperties person={person} />
              </Box>
            </>
          }
        />
      )}
      {isLoading && (
        <Card sx={{ padding: 3 }}>
          <Skeleton width={600} />
          <Skeleton height={200} width="100%" />
          <Skeleton height={100} />
          <Skeleton height={100} />
          <Skeleton height={100} />
          <Skeleton height={100} />
        </Card>
      )}
      {!!error && (
        <Card sx={{ padding: 3 }}>
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
          {permissions.isLeader && (
            <ScrollableContent
              anchorId="subscriptions"
              title={formatMessage({ id: 'Subscriptions' })}
              content={
                <SubscriptionsList
                  canUnsubscribe={canUnsubscribe}
                  subscriptions={subscriptions}
                  subscriptionsStatus={subscriptionsStatus}
                  userId={person.id}
                />
              }
            />
          )}
          <ScrollableContent
            anchorId="documents"
            title={formatMessage({ id: 'Documents' })}
            content={<DocumentsList documents={person.documents} />}
          />
          <ScrollableContent
            anchorId="organizations"
            title={formatMessage({ id: 'Organizations' })}
            content={
              <EntitiesList
                type="organization"
                entites={person.organizations}
                onItemRemove={canEdit ? handleLeaveOrganization : null}
                toolTipTitle={formatMessage({ id: 'Leave organization' })}
              />
            }
          />
          <ScrollableContent
            anchorId="related-caves"
            title={formatMessage({ id: 'Explored caves' })}
            icon={
              canEdit && (
                <Tooltip
                  title={formatMessage({
                    id: isCaveSearchVisible ? 'Cancel this search' : 'Add a cave'
                  })}>
                  <Button
                    color={isCaveSearchVisible ? 'inherit' : 'secondary'}
                    variant="outlined"
                    onClick={() => setIsCaveSearchVisible(v => !v)}
                    startIcon={isCaveSearchVisible ? <CancelIcon /> : <AddCircleIcon />}>
                    {formatMessage({ id: isCaveSearchVisible ? 'Cancel' : 'Add' })}
                  </Button>
                </Tooltip>
              )
            }
            content={
              <RelatedCaves
                exploredEntrances={person.exploredEntrances}
                exploredNetworks={person.exploredNetworks}
                entityId={person.id}
                isOrganization={false}
                canManageCaves={canEdit}
                onRefresh={() => dispatch(fetchPerson(person.id))}
                isCaveSearchVisible={isCaveSearchVisible}
                onToggleCaveSearch={setIsCaveSearchVisible}
              />
            }
          />
        </>
      )}
    </FixedLayout>
  );
};

Person.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.shape({}),
  person: PersonPropTypes,
  subscriptions: subscriptionsType,
  subscriptionsStatus: PropTypes.oneOf(Object.values(REDUCER_STATUS))
};

export default Person;
