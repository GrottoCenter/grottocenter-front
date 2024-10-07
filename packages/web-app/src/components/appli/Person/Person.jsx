import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Skeleton from '@mui/material/Skeleton';
import { useIntl } from 'react-intl';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { useUserProperties, usePermissions } from '../../../hooks';
import subscriptionsType from '../../../types/subscriptions.type';
import { PersonPropTypes } from '../../../types/person.type';
import REDUCER_STATUS from '../../../reducers/ReducerStatus';
import FixedContent from '../../common/Layouts/Fixed/FixedContent';
import EntrancesList from '../../common/entrance/EntrancesList';
import Alert from '../../common/Alert';
import DocumentsList from '../../common/DocumentsList/DocumentsList';
import OrganizationsList from '../../common/Organizations/OrganizationsList';
import PersonProperties from '../../common/Person/PersonProperties';
import SubscriptionsList from '../../common/Subscriptions/SubscriptionsList';
import { deletePerson } from '../../../actions/Person/DeletePerson';
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

  const userId = useUserProperties()?.id ?? null;
  let canEdit = false;
  if (userId && person) {
    canEdit =
      userId.toString() === person?.id?.toString() || permissions.isAdmin;
  }

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
    <FixedContent
      title={title}
      onEdit={
        canEdit ? () => navigate(`/ui/persons/${person?.id}/edit`) : undefined
      }
      onDelete={onDelete}
      content={
        <>
          {isLoading && (
            <>
              <Skeleton width={600} /> {/* Title Skeleton */}
              <Skeleton height={200} width={500} /> {/* Details Skeleton */}
              <Skeleton height={100} /> {/* Subscriptions list Skeleton */}
              <Skeleton height={100} /> {/* Documents list Skeleton */}
              <Skeleton height={100} /> {/* Organizations list Skeleton */}
              <Skeleton height={100} /> {/* Entrance list Skeleton */}
            </>
          )}
          {!!error && (
            <Alert
              title={formatMessage({
                id: 'Error, the person you are looking for is not available.'
              })}
              severity="error"
            />
          )}
          {!!person && (
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
              <hr />
              <SubscriptionsList
                canUnsubscribe={canEdit}
                subscriptions={subscriptions}
                subscriptionsStatus={subscriptionsStatus}
                title={formatMessage({ id: 'Subscriptions' })}
              />
              {person.documents.length > 0 && (
                <>
                  <DocumentsList
                    title={formatMessage({ id: 'Documents' })}
                    documents={person.documents}
                  />
                  <hr />
                </>
              )}
              <OrganizationsList
                orgas={person.organizations}
                title={formatMessage({ id: 'Organizations' })}
              />
              <EntrancesList
                title={formatMessage({ id: 'List of explored caves' })}
                entrances={person.exploredEntrances}
              />
            </>
          )}
        </>
      }
    />
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
