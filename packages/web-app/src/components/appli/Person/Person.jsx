import React from 'react';
import PropTypes from 'prop-types';
import { isNil } from 'ramda';
import Skeleton from '@material-ui/lab/Skeleton';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import {
  Card,
  CardContent,
  IconButton,
  Typography,
  Box
} from '@material-ui/core';
import CreateIcon from '@material-ui/icons/Create';

import Layout from '../../common/Layouts/Fixed/FixedContent';
import EntrancesList from '../../common/entrance/EntrancesList';
import EntrancePropTypes from './propTypes';
import Translate from '../../common/Translate';

import PersonProperties from '../../common/Person/PersonProperties';
import OrganizationsList from '../../common/Organizations/OrganizationsList';
import DocumentsList from '../../common/DocumentsList/DocumentsList';

const FlexBlock = styled.div`
  flex: 1;
  margin: ${({ theme }) => theme.spacing(3)}px;
`;

const EditButton = styled(Box)`
  margin-left: 90%;
`;

const Person = ({ isFetching, person, onEdit, isAllowed }) => {
  const { formatMessage } = useIntl();

  if (person == null) {
    return (
      <h3>
        <Translate>
          Error, the person you are looking for is not available.
        </Translate>
      </h3>
    );
  }

  if (person === undefined) {
    return <Skeleton height={200} />;
  }

  if (!isNil(person)) {
    person.exploredEntrances.map(entrance => {
      const entry = entrance;
      if (!entry.name) {
        entry.name = 'no name';
      }
      return entry;
    });
  }

  return (
    <Layout
      title={`Page profil de l'utilisateur ${person.name} ${person.surname}`}
      content={
        isFetching ? (
          <Skeleton height={200} />
        ) : (
          <>
            <Card>
              <CardContent>
                <EditButton>
                  {isAllowed && (
                    <IconButton
                      size="medium"
                      aria-label="edit"
                      onClick={onEdit}
                      disabled={isNil(onEdit)}>
                      <CreateIcon />
                    </IconButton>
                  )}
                </EditButton>
                <FlexBlock style={{ flexBasis: '300px' }}>
                  <PersonProperties
                    person={person}
                    displayLanguage={person.language !== '000'}
                    displayGroups
                  />
                </FlexBlock>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography color="textPrimary" variant="h3" gutterBottom>
                  Documents
                </Typography>
                <DocumentsList
                  docs={person.documents.map(doc => {
                    return { ...doc, title: doc.descriptions[0].title };
                  })}
                  emptyMessageComponent={formatMessage({
                    id: 'This person has no document listed yet.'
                  })}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography color="textPrimary" variant="h3" gutterBottom>
                  Organisations
                </Typography>
                <OrganizationsList
                  orgas={person.organizations}
                  emptyMessageComponent={formatMessage({
                    id: 'This person has no organization listed yet.'
                  })}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <EntrancesList
                  entrances={person.exploredEntrances}
                  emptyMessageComponent={formatMessage({
                    id: 'This person has no entrances listed yet.'
                  })}
                  title={formatMessage({ id: 'List of explored cavities' })}
                />
              </CardContent>
            </Card>
          </>
        )
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
  onEdit: PropTypes.func.isRequired,
  isAllowed: PropTypes.bool.isRequired
};

Person.defaultProps = {
  person: undefined
};

export default Person;
