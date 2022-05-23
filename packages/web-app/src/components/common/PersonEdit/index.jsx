import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { pathOr, isNil } from 'ramda';
import { useDispatch, useSelector } from 'react-redux';
import { Box, CircularProgress } from '@material-ui/core/';

import { useIntl } from 'react-intl';

import { useUserProperties, usePermissions } from '../../../hooks';
import Layout from '../Layouts/Fixed/FixedContent';

import PersonEditPage from '../../../pages/PersonEditPage';

import { loadPerson } from '../../../actions/Person';

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

  return (
    <Layout
      title={
        `${person?.name} ${person?.surname}` ||
        formatMessage({ id: 'Loading user data...' })
      }
      content={
        <>
          {!isAllowed && (
            <Box display="flex" alignItems="center" justifyContent="center">
              {formatMessage({
                id: 'Error, the person you are looking for is not available.'
              })}
            </Box>
          )}
          {isFetching && isAllowed ? (
            <Box display="flex" alignItems="center" justifyContent="center">
              <CircularProgress size={100} />
            </Box>
          ) : (
            <>
              {isNil(person) && (
                <Box display="flex" alignItems="center" justifyContent="center">
                  {formatMessage({
                    id:
                      'Error, the person you are looking for is not available.'
                  })}
                </Box>
              )}

              <PersonEditPage userValues={person} />
            </>
          )}
        </>
      }
    />
  );
};

PersonEdit.propTypes = {};

export default PersonEdit;
