import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';

import { fetchGroups } from '../../actions/Person/GetPerson';
import { postPersonGroups } from '../../actions/Person/UpdatePersonGroups';

import AuthChecker from '../../components/appli/AuthChecker';

import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import ManageUserGroups from '../../components/appli/ManageUserGroups';

import UserList from './UserList';

const ManageUsers = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();

  const [selectedUser, setSelectedUser] = useState(null);
  const [initialUser, setInitialUser] = useState(null);

  const { administrators, moderators, leaders, isLoading } = useSelector(
    state => state.groups
  );

  const { isLoading: isUpdateLoading, isSuccess: isUpdateSuccess } =
    useSelector(state => state.updatePersonGroups);

  const onSaveGroups = () => {
    dispatch(postPersonGroups(selectedUser.id, selectedUser.groups ?? []));
  };

  const onSelection = selection => {
    if (selection !== null) {
      setSelectedUser(selection);
      setInitialUser(selection);
    }
  };

  useEffect(() => {
    // Check if submission is ok
    if (isUpdateSuccess && !isUpdateLoading) {
      setInitialUser(selectedUser);
      dispatch(fetchGroups());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUpdateLoading, isUpdateSuccess]);

  useEffect(() => {
    dispatch(fetchGroups());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout
      title={formatMessage({ id: 'Manage Users' })}
      content={
        <AuthChecker
          componentToDisplay={
            <>
              <ManageUserGroups
                initialUser={initialUser}
                onSaveGroups={onSaveGroups}
                onSelection={onSelection}
                selectedUser={selectedUser}
                setSelectedUser={setSelectedUser}
              />

              <hr />

              <UserList
                isLoading={isLoading}
                userList={administrators}
                title={formatMessage({ id: 'List of administrators' })}
              />
              <UserList
                isLoading={isLoading}
                userList={moderators}
                title={formatMessage({ id: 'List of moderators' })}
              />
              <UserList
                isLoading={isLoading}
                userList={leaders}
                title={formatMessage({ id: 'List of leaders' })}
              />
            </>
          }
        />
      }
    />
  );
};

export default ManageUsers;
