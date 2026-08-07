import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Typography
} from '@mui/material';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import PeopleIcon from '@mui/icons-material/People';
import DocumentListIcon from '@mui/icons-material/PlaylistAddCheck';
import PublishIcon from '@mui/icons-material/Publish';
import ArchiveIcon from '@mui/icons-material/Archive';
import { styled } from '@mui/material/styles';

import { fetchDBExportUrl } from '../actions/DBExport';
import { usePermissions } from '../hooks';
import REDUCER_STATUS from '../reducers/ReducerStatus';
import Layout from '../components/common/Layouts/Fixed/FixedContent';

const Section = styled(Box)(({ theme }) => ({
  '& + &': {
    marginTop: theme.spacing(3)
  }
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  display: 'block',
  marginBottom: theme.spacing(1),
  color: theme.palette.text.secondary,
  fontWeight: 600,
  letterSpacing: 1
}));

const ToolGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 340px))',
  justifyContent: 'start',
  alignItems: 'start',
  gap: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: '1fr'
  }
}));

const badgeContent = (count, status) => {
  if (status === REDUCER_STATUS.LOADING) {
    return <CircularProgress size={10} color="inherit" />;
  }
  if (status === REDUCER_STATUS.FAILED) return '!';
  return count;
};

const ToolCard = ({
  icon,
  title,
  description,
  roleId,
  count,
  status,
  onClick
}) => {
  const { formatMessage } = useIntl();
  const roleLabel = formatMessage({ id: roleId });
  const hasCounter = typeof count === 'number';
  const showBadge =
    hasCounter &&
    (status === REDUCER_STATUS.LOADING ||
      status === REDUCER_STATUS.FAILED ||
      count > 0);

  const iconNode = (
    <Box
      sx={{
        color: 'primary.main',
        display: 'flex',
        alignItems: 'center',
        lineHeight: 0,
        '& svg': { fontSize: 36 }
      }}>
      {icon}
    </Box>
  );

  return (
    <Card variant="outlined">
      <CardActionArea
        onClick={onClick}
        aria-label={`${title} — ${roleLabel}`}>
        <CardContent sx={{ position: 'relative', p: 2, pt: 3 }}>
          <Chip
            variant="outlined"
            size="small"
            label={roleLabel}
            sx={{ position: 'absolute', top: 8, right: 8 }}
          />
          <Box sx={{ mb: 0.5, display: 'flex' }}>
            {showBadge ? (
              <Badge
                overlap="rectangular"
                color={status === REDUCER_STATUS.FAILED ? 'error' : 'secondary'}
                badgeContent={badgeContent(count, status)}
                max={99}>
                {iconNode}
              </Badge>
            ) : (
              iconNode
            )}
          </Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

ToolCard.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  roleId: PropTypes.oneOf(['Administrator', 'Moderator', 'Leader']).isRequired,
  count: PropTypes.number,
  status: PropTypes.oneOf(Object.values(REDUCER_STATUS)),
  onClick: PropTypes.func.isRequired
};

const DBExportCard = ({ dbExport }) => {
  const { formatMessage } = useIntl();
  const isLoading = dbExport.status === REDUCER_STATUS.LOADING;
  const lastUpdate = dbExport.lastUpdate
    ? dbExport.lastUpdate.split('T')[0]
    : null;
  const sizeMo = dbExport.size
    ? Math.round((dbExport.size * 10) / (1024 * 1024)) / 10
    : null;

  return (
    <Card variant="outlined">
      <CardContent sx={{ position: 'relative', p: 2, pt: 3 }}>
        <Chip
          variant="outlined"
          size="small"
          label={formatMessage({ id: 'Leader' })}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        />
        <Box
          sx={{
            mb: 0.5,
            color: 'primary.main',
            display: 'flex',
            lineHeight: 0,
            '& svg': { fontSize: 36 }
          }}>
          <ArchiveIcon />
        </Box>
        <Typography variant="subtitle1" fontWeight={600}>
          {formatMessage({ id: 'Database export' })}
        </Typography>
        {isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <CircularProgress size={14} />
            <Typography variant="body2" color="text.secondary">
              {formatMessage({ id: 'Loading ...' })}
            </Typography>
          </Box>
        )}
        {!isLoading && dbExport.url && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {formatMessage({ id: 'Last update' })} : {lastUpdate}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatMessage({ id: 'Size' })} : {sizeMo} Mo
            </Typography>
          </Box>
        )}
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
        <Button
          variant="outlined"
          size="small"
          disabled={!dbExport.url}
          onClick={() => window.open(dbExport.url, '_blank')}
          startIcon={<ArchiveIcon />}>
          {formatMessage({ id: 'Download' })} —{' '}
          {formatMessage({ id: 'License: CC-BY-SA' })}
        </Button>
      </CardActions>
    </Card>
  );
};

DBExportCard.propTypes = {
  dbExport: PropTypes.shape({
    url: PropTypes.string,
    lastUpdate: PropTypes.string,
    size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string
  }).isRequired
};

const Dashboard = () => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const dispatch = useDispatch();
  const dbExport = useSelector(state => state.dbExport);
  const pendingDocumentsCount = useSelector(
    state => state.pendingDocumentsCount
  );
  const duplicatesCount = useSelector(state => state.duplicatesCount);

  const goTo = url => navigate(url);

  useEffect(() => {
    const hasDashboardAccess =
      permissions.isAdmin || permissions.isModerator || permissions.isLeader;
    if (!permissions.isAuth || !hasDashboardAccess) {
      navigate('/');
    }
  }, [permissions, navigate]);

  useEffect(() => {
    if (permissions.isLeader) {
      dispatch(fetchDBExportUrl());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, permissions.isLeader]);

  const showDataSection = permissions.isModerator || permissions.isLeader;

  return (
    <Layout
      title={formatMessage({ id: 'Management tools' })}
      subheader={
        <Typography variant="body2" color="text.secondary">
          {formatMessage({ id: 'Management tools access restricted' })}
        </Typography>
      }
      content={
        <>
          {permissions.isAdmin && (
            <Section>
              <SectionTitle variant="overline">
                {formatMessage({ id: 'Users' })}
              </SectionTitle>
              <ToolGrid>
                <ToolCard
                  icon={<PeopleIcon />}
                  title={formatMessage({ id: 'Manage users' })}
                  description={formatMessage({ id: 'Manage users description' })}
                  roleId="Administrator"
                  onClick={() => goTo('/ui/admin/users')}
                />
              </ToolGrid>
            </Section>
          )}
          {permissions.isModerator && (
            <Section>
              <SectionTitle variant="overline">
                {formatMessage({ id: 'Content' })}
              </SectionTitle>
              <ToolGrid>
                <ToolCard
                  icon={<DocumentListIcon />}
                  title={formatMessage({ id: 'Document validation' })}
                  description={formatMessage({
                    id: 'Document validation description'
                  })}
                  roleId="Moderator"
                  count={pendingDocumentsCount.value}
                  status={pendingDocumentsCount.status}
                  onClick={() => goTo('/ui/documents/validation')}
                />
                <ToolCard
                  icon={<CallMergeIcon />}
                  title={formatMessage({ id: 'Duplicates Tool' })}
                  description={formatMessage({
                    id: 'Duplicates tool description'
                  })}
                  roleId="Moderator"
                  count={duplicatesCount.value}
                  status={duplicatesCount.status}
                  onClick={() => goTo('/ui/duplicates')}
                />
              </ToolGrid>
            </Section>
          )}
          {showDataSection && (
            <Section>
              <SectionTitle variant="overline">
                {formatMessage({ id: 'Data' })}
              </SectionTitle>
              <ToolGrid>
                {permissions.isModerator && (
                  <ToolCard
                    icon={<PublishIcon />}
                    title={formatMessage({ id: 'CSV Import' })}
                    description={formatMessage({
                      id: 'CSV Import description'
                    })}
                    roleId="Moderator"
                    onClick={() => goTo('/ui/import-csv')}
                  />
                )}
                {permissions.isLeader && <DBExportCard dbExport={dbExport} />}
              </ToolGrid>
            </Section>
          )}
        </>
      }
    />
  );
};

export default Dashboard;
