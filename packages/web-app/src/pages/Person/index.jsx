import React, { useEffect, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { isNil, pathOr } from 'ramda';
import Person from '../../components/appli/Person/Person';
import { loadPerson } from '../../actions/Person';
import { useUserProperties, usePermissions } from '../../hooks';

const PersonPage = () => {
  const { personId } = useParams();
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const { person, error, isFetching } = useSelector(state => state.person);
  const userId = pathOr(null, ['id'], useUserProperties());
  let canEdit = false;

  if (!isNil(userId)) {
    canEdit = userId.toString() === personId.toString() || permissions.isAdmin;
  }

  const history = useHistory();
  const editPath = useRef('/ui');

  useEffect(() => {
    dispatch(loadPerson(personId));
    editPath.current = `/ui/person/edit/${personId}`;
  }, [personId, dispatch]);

  const onEdit = () => {
    history.push(editPath.current);
  };
  return (
    <Person
      isFetching={isFetching || !isNil(error)}
      person={person}
      onEdit={onEdit}
      canEdit={canEdit}
    />
  );
};
export default PersonPage;
