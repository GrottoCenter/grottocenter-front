import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';
import { List, Typography, Button, ListItemButton } from '@mui/material';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import PeopleIcon from '@mui/icons-material/People';
import DocumentListIcon from '@mui/icons-material/PlaylistAddCheck';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PublishIcon from '@mui/icons-material/Publish';
import ArchiveIcon from '@mui/icons-material/Archive';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { styled } from '@mui/material/styles';
import { fetchDBExportUrl } from '../actions/DBExport';

import { usePermissions } from '../hooks';
import Layout from '../components/common/Layouts/Fixed/FixedContent';

const StyledList = styled(List)`
  display: flex;
  flex-wrap: wrap;
`;

const StyledListItem = styled(ListItemButton)`
  border: 1px solid ${props => props.theme.palette.primary1Color};
  flex: 0 0 220px;
  flex-direction: column;
  margin: ${props => props.theme.spacing(2)};
`;

const StyledListItemDBExport = styled(StyledListItem)`
  flex-basis: 250px;
`;

const DashboardBlock = styled('div')`
  margin-bottom: ${props => props.theme.spacing(4)};
`;

const Dashboard = () => {
  const { formatMessage } = useIntl();
  const history = useHistory();
  const permissions = usePermissions();
  const dispatch = useDispatch();
  const dbExport = useSelector(state => state.dbExport);

  const handleOnListItemClick = url => history.push(url);

  useEffect(() => {
    if (!permissions.isAuth) {
      history.push('');
    }
  }, [permissions, history]);

  useEffect(() => {
    if (permissions.isLeader) {
      dispatch(fetchDBExportUrl());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  return (
    <Layout
      title={formatMessage({ id: 'Dashboard' })}
      content={
        <>
          {permissions.isAdmin && (
            <DashboardBlock>
              <Typography variant="h2">
                {formatMessage({ id: 'Administrator' })}
              </Typography>
              <StyledList cols={3}>
                <StyledListItem
                  button
                  key="manage-users-admin-tile-key"
                  onClick={() => handleOnListItemClick('/ui/admin/users')}>
                  <PeopleIcon fontSize="large" color="primary" />
                  <Typography variant="h4" align="center">
                    {formatMessage({ id: 'Manage users' })}
                  </Typography>
                </StyledListItem>
              </StyledList>
            </DashboardBlock>
          )}
          {permissions.isModerator && (
            <DashboardBlock>
              <Typography variant="h2">
                {formatMessage({ id: 'Moderator' })}
              </Typography>
              <StyledList cols={3}>
                <StyledListItem
                  button
                  key="document-validation-admin-tile-key"
                  onClick={() =>
                    handleOnListItemClick('/ui/documents/validation')
                  }>
                  <DocumentListIcon fontSize="large" color="primary" />
                  <Typography variant="h4" align="center">
                    {formatMessage({ id: 'Document validation' })}
                  </Typography>
                </StyledListItem>
                <StyledListItem
                  button
                  key="import-csv-user-tile-key"
                  onClick={() => handleOnListItemClick('/ui/import-csv')}>
                  <PublishIcon fontSize="large" color="primary" />
                  <Typography variant="h4" align="center">
                    {formatMessage({ id: 'CSV Import' })}
                  </Typography>
                </StyledListItem>
                <StyledListItem
                  button
                  key="duplicate-tool-user-tile-key"
                  onClick={() => handleOnListItemClick('/ui/duplicates')}>
                  <CallMergeIcon fontSize="large" color="primary" />
                  <Typography variant="h4" align="center">
                    {formatMessage({ id: 'Duplicates Tool' })}
                  </Typography>
                </StyledListItem>
              </StyledList>
            </DashboardBlock>
          )}
          {permissions.isLeader && (
            <DashboardBlock>
              <Typography variant="h2" id="leader">
                {formatMessage({ id: 'Leader' })}
              </Typography>

              <StyledList cols={6}>
                {dbExport.url && (
                  <StyledListItemDBExport key="leader-db-snapshot">
                    <Typography variant="h4" align="center">
                      {formatMessage({ id: 'Database export' })}
                    </Typography>
                    <br />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => window.open(dbExport.url, '_blank')}
                      startIcon={<ArchiveIcon color="primary" />}>
                      Download
                    </Button>
                    <br />
                    <Typography variant="body2">
                      {formatMessage({ id: 'Last update' })}:{' '}
                      {dbExport.lastUpdate.split('T')[0]}
                    </Typography>
                    <Typography variant="body2">
                      {formatMessage({ id: 'Size' })}:{' '}
                      {Math.round((dbExport.size * 10) / (1024 * 1024)) / 10} Mo
                    </Typography>
                    <Typography variant="body2">
                      {formatMessage({ id: 'License: CC-BY-SA' })}
                    </Typography>
                  </StyledListItemDBExport>
                )}
              </StyledList>
            </DashboardBlock>
          )}
          {permissions.isUser && (
            <DashboardBlock>
              <Typography variant="h2">
                {formatMessage({ id: 'User' })}
              </Typography>
              <StyledList cols={6}>
                <StyledListItem
                  button
                  key="my-contributions-user-tile-key"
                  onClick={() => handleOnListItemClick('/ui/contributions')}>
                  <ListAltIcon fontSize="large" color="primary" />
                  <Typography variant="h4" align="center">
                    {formatMessage({ id: 'My contributions' })}
                  </Typography>
                </StyledListItem>
                <StyledListItem
                  button
                  key="my-notifications-user-tile-key"
                  onClick={() => handleOnListItemClick('/ui/notifications')}>
                  <NotificationsIcon fontSize="large" color="primary" />
                  <Typography variant="h4" align="center">
                    {formatMessage({ id: 'My notifications' })}
                  </Typography>
                </StyledListItem>
              </StyledList>
            </DashboardBlock>
          )}
        </>
      }
    />
  );
};

export default Dashboard;
