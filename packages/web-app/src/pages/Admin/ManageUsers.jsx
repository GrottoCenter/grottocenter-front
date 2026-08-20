import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Divider, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import { useBannedCavers, useGroups, useInvalidEmailCavers } from '../../hooks';

import AuthChecker from '../../components/appli/AuthChecker';

import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import EntityTable from '../../components/common/EntityTable';
import ManageUserGroups from './ManageUserGroups';

const MarginBottomBlock = styled('div')`
  margin-bottom: ${({ theme }) => theme.spacing(3)};
`;

const UserList = ({ isLoading, title, userList }) => (
  <MarginBottomBlock>
    <Typography variant="h3" component="h2" gutterBottom>
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

  const { data: groups, isPending: isLoading } = useGroups();
  const { administrators = [], moderators = [], leaders = [] } = groups ?? {};

  const { data: bannedCavers = [], isPending: isBannedLoading } =
    useBannedCavers();

  const { data: invalidEmailCavers = [], isPending: isInvalidEmailLoading } =
    useInvalidEmailCavers();

  // useBanCaver / useUnbanCaver / useUpdatePersonGroups own their own
  // onSuccess invalidations for listKeys.groups() / listKeys.bannedCavers(),
  // so this page just displays the queries.

  return (
    <Layout
      title={formatMessage({ id: 'Manage Users' })}
      content={
        <AuthChecker
          componentToDisplay={
            <>
              <ManageUserGroups />
              <Divider sx={{ my: 4 }} />
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
              <UserList
                isLoading={isBannedLoading}
                userList={bannedCavers}
                title={formatMessage({ id: 'List of banned cavers' })}
              />
              <UserList
                isLoading={isInvalidEmailLoading}
                userList={invalidEmailCavers}
                title={formatMessage({
                  id: 'List of cavers with invalid email'
                })}
              />
            </>
          }
        />
      }
    />
  );
};

export default ManageUsers;
