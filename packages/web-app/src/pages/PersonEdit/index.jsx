import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { Skeleton } from '@mui/material';

import { fetchPerson } from '../../actions/Person/GetPerson';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import PersonForm from '../../components/appli/EntitiesForm/Person';
import Alert from '../../components/common/Alert';
import { useUserProperties, usePermissions } from '../../hooks';

const PersonEdit = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const { person, isFetching } = useSelector(state => state.person);
  const { personId } = useParams();
  const { isAdmin, isModerator } = usePermissions();

  const userId = useUserProperties()?.id ?? null;
  const isOurAccount = userId?.toString() === personId.toString();
  let isAllowed = isOurAccount || isAdmin;
  if (isModerator && person?.type === 'AUTHOR') isAllowed = true;

  useEffect(() => {
    if (personId && isAllowed) {
      dispatch(fetchPerson(personId));
    }
  }, [personId, isAllowed, dispatch]);

  let title = isFetching ? <Skeleton /> : '';
  if (person) {
    title = formatMessage(
      { id: 'Editing {person}', defaultMessage: 'Editing {person}' },
      { person: person.nickname }
    );
  }

  return (
    <Layout
      title={title}
      content={
        <>
          {isFetching && (
            <>
              <Skeleton height={100} />
              <Skeleton height={500} />
            </>
          )}
          {!isAllowed && (
            <Alert
              severity="error"
              content={formatMessage({
                id: 'You are not authorized to edit this person.'
              })}
            />
          )}
          {isAllowed && !person && !isFetching && (
            <Alert
              severity="error"
              content={formatMessage({
                id: "The person you are looking for doesn't exist."
              })}
            />
          )}
          {person && isAllowed && (
            <PersonForm personValues={person} isOurAccount={isOurAccount} />
          )}
        </>
      }
    />
  );
};

PersonEdit.propTypes = {};

export default PersonEdit;
