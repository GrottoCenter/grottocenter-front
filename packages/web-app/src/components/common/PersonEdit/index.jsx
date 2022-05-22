import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { pathOr, isNil } from 'ramda';
import { useDispatch, useSelector } from 'react-redux';
import { Typography, CircularProgress } from '@material-ui/core/';
import styled from 'styled-components';
import { useIntl } from 'react-intl';

import { useUserProperties, usePermissions } from '../../../hooks';
import Layout from '../Layouts/Fixed/FixedContent';

import PersonEditPage from '../../../pages/PersonEditPage';

import { loadPerson } from '../../../actions/Person';

const Center = styled(Typography)`
  padding: ${({ theme }) => theme.spacing(1)}px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PersonEdit = () => {
  const { formatMessage } = useIntl();

  const dispatch = useDispatch();
  const { person, isFetching } = useSelector(state => state.person);

  const { personId } = useParams();
  const permissions = usePermissions();
  const userId = pathOr(null, ['id'], useUserProperties());

  const isAllowed =
    userId.toString() === personId.toString() || permissions.isAdmin;

  useEffect(() => {
    if (personId) {
      dispatch(loadPerson(personId));
    }
  }, [personId, dispatch]);

  if (isNil(person) && !isFetching) {
    return (
      <Typography variant="h3">
        {formatMessage({
          id: 'Error, the person you are looking for is not available.'
        })}
      </Typography>
    );
  }

  if (!isAllowed) {
    return (
      <Typography variant="h3">
        {formatMessage({ id: 'You are not allowed to edit this user.' })}
      </Typography>
    );
  }

  return (
    <Layout
      title={
        `${person?.name} ${person?.surname}` ||
        formatMessage({ id: 'Loading user data...' })
      }
      content={
        isFetching ? (
          <Center>
            <CircularProgress size={100} />
          </Center>
        ) : (
          <>
            <PersonEditPage userValues={person} />
          </>
        )
      }
    />
  );
};

PersonEdit.propTypes = {};

export default PersonEdit;
