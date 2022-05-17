import React from 'react';
import PropTypes from 'prop-types';
import { isNil } from 'ramda';
import Skeleton from '@material-ui/lab/Skeleton';
import { useIntl } from 'react-intl';
import { IconButton, Box } from '@material-ui/core';
import CreateIcon from '@material-ui/icons/Create';

import Layout from '../../common/Layouts/Fixed/FixedContent';
import EntrancesList from '../../common/entrance/EntrancesList';
import EntrancePropTypes from './propTypes';
import Alert from '../../common/Alert';

import PersonProperties from '../../common/Person/PersonProperties';
import OrganizationsList from '../../common/Organizations/OrganizationsList';
import DocumentsList from '../../common/DocumentsList/DocumentsList';

const Person = ({
  isFetching,
  person,
  //  onEdit, ### À décommenter lorsque la page edit sera prête
  canEdit
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
                    // onClick={onEdit} ### À décommenter lorsque la page edit sera prête
                    disabled // ={isNil(onEdit)} ### À décommenter lorsque la page edit sera prête
                  >
                    <CreateIcon />
                  </IconButton>
                )}
              </Box>
              <hr />
              <DocumentsList
                docs={person.documents.map(doc => ({
                  ...doc,
                  title: doc.descriptions[0].title
                }))}
                emptyMessageComponent={
                  <Alert
                    severity="info"
                    title={formatMessage({
                      id: 'This person has no document listed yet.'
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
                title={formatMessage({ id: 'List of explored cavities' })}
              />
            </>
          )}
        </>
      }
    />
  );
};

Person.propTypes = {
  isFetching: PropTypes.bool.isRequired,
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
  // onEdit: PropTypes.func.isRequired, ### À décommenter lorsque la page edit sera prête
  canEdit: PropTypes.bool.isRequired
};

Person.defaultProps = {
  person: undefined
};

export default Person;