import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { pathOr, isNil } from 'ramda';
import { useDispatch, useSelector } from 'react-redux';
import { Box, CircularProgress } from '@material-ui/core/';

import { useIntl } from 'react-intl';

import { useUserProperties, usePermissions } from '../../hooks';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';

import PersonEditPage from '../../components/common/PersonEditPage';
import { loadPerson } from '../../actions/Person/GetPerson';
import Alert from '../../components/common/Alert';

const computeTitle = (isFetching, person, formatMessage) => {
  if (isFetching) return formatMessage({ id: 'Loading user data...' });
  if (!isNil(person))
    return formatMessage(
      {
        id: 'Editing {person}',
        defaultMessage: 'Editing {person}'
      },
      {
        person: person.nickname
      }
    );
  if (isNil(person)) return formatMessage({ id: 'Editing an unknown user' });
  return '';
};

const PersonEdit = () => {
  const { formatMessage } = useIntl();

  const dispatch = useDispatch();
  const { person, isFetching } = useSelector(state => state.person);

  const { personId } = useParams();
  const { isAdmin } = usePermissions();
  const userId = pathOr(null, ['id'], useUserProperties());
  const isAllowed = userId?.toString() === personId.toString() || isAdmin;

  useEffect(() => {
    if (personId) {
      dispatch(loadPerson(personId));
    }
  }, [personId, dispatch]);

  return (
    <Layout
      title={computeTitle(isFetching, person, formatMessage)}
      content={
        <>
          {isFetching && (
            <Box display="flex" alignItems="center" justifyContent="center">
              <CircularProgress size={100} />
            </Box>
          )}
          {!isAllowed && !isNil(person) && !isFetching && (
            <Alert
              severity="error"
              content={formatMessage({
                id: 'You are not authorized to edit this person.'
              })}
            />
          )}
          {isNil(person) && !isFetching && (
            <Alert
              severity="error"
              content={formatMessage({
                id: "The person you are looking for doesn't exist."
              })}
            />
          )}
          {person && isAllowed && <PersonEditPage userValues={person} />}
        </>
      }
    />
  );
};

PersonEdit.propTypes = {};

export default PersonEdit;
