import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import { fetchGroups } from '../../actions/Person/GetPerson';

import AuthChecker from '../../components/appli/AuthChecker';

import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import EntityTable from '../../components/common/EntityTable/EntityTable';
import ManageUserGroups from './ManageUserGroups';

const MarginBottomBlock = styled('div')`
  margin-bottom: ${({ theme }) => theme.spacing(4)};
`;

const UserList = ({ isLoading, title, userList }) => (
  <MarginBottomBlock>
    <Typography variant="h6" component="div" gutterBottom>
      {title}
    </Typography>
    <EntityTable
      entityType="persons"
      isLoading={isLoading}
      pageRows={userList}
      shouldHideFooter
    />
  </MarginBottomBlock>
);

UserList.propTypes = {
  title: PropTypes.string.isRequired,
  isLoading: PropTypes.bool.isRequired,
  userList: PropTypes.arrayOf(PropTypes.shape({})).isRequired
};

const ManageUsers = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();

  const { administrators, moderators, leaders, isLoading } = useSelector(
    state => state.groups
  );

  const { isLoading: isUpdateLoading, isSuccess: isUpdateSuccess } =
    useSelector(state => state.updatePersonGroups);

  useEffect(() => {
    // Check if submission is ok
    if (isUpdateSuccess && !isUpdateLoading) {
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
              <ManageUserGroups />
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
