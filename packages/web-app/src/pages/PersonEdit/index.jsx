import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { pathOr, isNil } from 'ramda';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { Skeleton } from '@mui/material';

import { loadPerson } from '../../actions/Person/GetPerson';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import PersonEditPage from '../../components/common/PersonEditPage';
import Alert from '../../components/common/Alert';
import { useUserProperties, usePermissions } from '../../hooks';

const computeTitle = (isFetching, person, formatMessage) => {
  if (isFetching) return <Skeleton />;
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
            <>
              <Skeleton height={100} />
              <Skeleton height={500} />
            </>
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
