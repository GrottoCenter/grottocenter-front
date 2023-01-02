import React from 'react';
import PropTypes from 'prop-types';
import { isNil } from 'ramda';
import Skeleton from '@mui/material/Skeleton';
import { useIntl } from 'react-intl';
import { IconButton, Box } from '@mui/material';
import CreateIcon from '@mui/icons-material/Create';

import subscriptionsType from '../../../types/subscriptions.type';
import REDUCER_STATUS from '../../../reducers/ReducerStatus';
import Layout from '../../common/Layouts/Fixed/FixedContent';
import EntrancesList from '../../common/entrance/EntrancesList';
import EntrancePropTypes from './propTypes';
import Alert from '../../common/Alert';

import DocumentsList from '../../common/DocumentsList/DocumentsList';
import OrganizationsList from '../../common/Organizations/OrganizationsList';
import PersonProperties from '../../common/Person/PersonProperties';
import SubscriptionsList from '../../common/Subscriptions/SubscriptionsList';

const Person = ({
  isFetching,
  person,
  onEdit,
  canEdit,
  subscriptions,
  subscriptionsStatus
}) => {
  const { formatMessage } = useIntl();

  let title = '';
  if (!isNil(person)) {
    if (person.name && person.surname) {
      title += `${formatMessage({ id: 'Profile page of the user' })} : ${
        person.name
      } ${person.surname}`;
    } else {
      title += `${formatMessage({ id: 'Profile page of the user' })} : ${
        person.nickname
      }`;
    }
  }

  return (
    <Layout
      title={title}
      content={
        <>
          {isFetching && person === undefined && (
            <>
              <Skeleton width={600} /> {/* Title Skeleton */}
              <Skeleton height={200} width={500} /> {/* Details Skeleton */}
              <Skeleton height={100} /> {/* Subscriptions list Skeleton */}
              <Skeleton height={100} /> {/* Documents list Skeleton */}
              <Skeleton height={100} /> {/* Organizations list Skeleton */}
              <Skeleton height={100} /> {/* Entrance list Skeleton */}
            </>
          )}
          {person === null && (
            <Alert
              title={formatMessage({
                id: 'Error, the person you are looking for is not available.'
              })}
              severity="error"
            />
          )}
          {!isNil(person) && (
            <>
              <Box
                alignItems="start"
                display="flex"
                flexBasis="300px"
                justifyContent="space-between">
                <PersonProperties person={person} />
                {canEdit && (
                  <IconButton
                    size="medium"
                    aria-label="edit"
                    color="primary"
                    onClick={onEdit}
                    disabled={isNil(onEdit)}>
                    <CreateIcon />
                  </IconButton>
                )}
              </Box>
              <hr />
              <SubscriptionsList
                canUnsubscribe={canEdit}
                subscriptions={subscriptions}
                subscriptionsStatus={subscriptionsStatus}
                emptyMessageComponent={
                  <Alert
                    severity="info"
                    title={formatMessage({
                      id: 'This person has no subscriptions listed yet.'
                    })}
                  />
                }
                title={formatMessage({ id: 'Subscriptions' })}
              />
              <hr />
              <DocumentsList
                docs={person.documents.map(doc => ({
                  ...doc,
                  title: doc.titles[0].text
                }))}
                emptyMessageComponent={
                  <Alert
                    severity="info"
                    title={formatMessage({
                      id: 'This person has no documents listed yet.'
                    })}
                  />
                }
                title={formatMessage({ id: 'Documents' })}
              />
              <hr />
              <OrganizationsList
                orgas={person.organizations}
                emptyMessageComponent={
                  <Alert
                    severity="info"
                    title={formatMessage({
                      id: 'This person has no organization listed yet.'
                    })}
                  />
                }
                title={formatMessage({ id: 'Organizations' })}
              />
              <hr />
              <EntrancesList
                entrances={person.exploredEntrances}
                emptyMessageComponent={
                  <Alert
                    severity="info"
                    title={formatMessage({
                      id: 'This person has no entrances listed yet.'
                    })}
                  />
                }
                title={formatMessage({ id: 'List of explored caves' })}
              />
            </>
          )}
        </>
      }
    />
  );
};

Person.propTypes = {
  canEdit: PropTypes.bool.isRequired,
  isFetching: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  person: PropTypes.shape({
    name: PropTypes.string,
    surname: PropTypes.string,
    nickname: PropTypes.string,
    language: PropTypes.string,
    groups: PropTypes.arrayOf(PropTypes.shape({})),
    organizations: PropTypes.arrayOf(PropTypes.shape({})),
    documents: PropTypes.arrayOf(PropTypes.shape({})),
    exploredEntrances: PropTypes.arrayOf(EntrancePropTypes)
  }),
  subscriptions: subscriptionsType,
  subscriptionsStatus: PropTypes.oneOf(Object.values(REDUCER_STATUS))
};

Person.defaultProps = {
  person: undefined
};

export default Person;
