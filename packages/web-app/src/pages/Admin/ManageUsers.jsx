import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';

import { getAdmins, getModerators } from '../../actions/Person/GetPerson';
import { postPersonGroups } from '../../actions/Person/UpdatePersonGroups';

import AuthChecker from '../../components/appli/AuthChecker';

import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import ManageUserGroups from '../../components/appli/ManageUserGroups';

import UserList from './UserList';

// ==========

const MarginBottomBlock = styled('div')`
  margin-bottom: ${({ theme }) => theme.spacing(4)};
`;

// ==========

const ManageUsers = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();

  // State
  const [selectedUser, setSelectedUser] = useState(null);
  const [initialUser, setInitialUser] = useState(null);

  // Redux store
  const { admins, isLoading: areAdminsLoading } = useSelector(
    state => state.admin
  );
  const { isLoading: areModeratorsLoading, moderators } = useSelector(
    state => state.moderator
  );
  const {
    isLoading: isCaverGroupsLoading,
    latestHttpCode: caverUserGroupsLatestHttpCode
  } = useSelector(state => state.updatePersonGroups);

  const onSaveGroups = () => {
    dispatch(postPersonGroups(selectedUser.id, selectedUser.groups));
  };

  const onSelection = selection => {
    if (selection !== null) {
      setSelectedUser(selection);
      setInitialUser(selection);
    }
  };

  useEffect(() => {
    // Check if submission is ok
    if (caverUserGroupsLatestHttpCode === 200 && !isCaverGroupsLoading) {
      setInitialUser(selectedUser);
      dispatch(getAdmins());
      dispatch(getModerators());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCaverGroupsLoading, caverUserGroupsLatestHttpCode]);

  useEffect(() => {
    dispatch(getAdmins());
    dispatch(getModerators());
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
                areGroupsSubmittedWithSuccess={
                  caverUserGroupsLatestHttpCode === 200 && !isCaverGroupsLoading
                }
                initialUser={initialUser}
                onSaveGroups={onSaveGroups}
                onSelection={onSelection}
                selectedUser={selectedUser}
                setSelectedUser={setSelectedUser}
              />

              <hr />

              <MarginBottomBlock>
                <UserList
                  isLoading={areAdminsLoading}
                  userList={admins}
                  title={formatMessage({ id: 'List of administrators' })}
                />
              </MarginBottomBlock>

              <UserList
                isLoading={areModeratorsLoading}
                userList={moderators}
                title={formatMessage({ id: 'List of moderators' })}
              />
            </>
          }
        />
      }
    />
  );
};

export default ManageUsers;
