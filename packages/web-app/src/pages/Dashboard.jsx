import { useEffect } from 'react';
import PropTypes from 'prop-types';
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

import {
  useDbExport,
  useDuplicatesCount,
  usePendingDocumentsCount,
  usePermissions
} from '../hooks';
import Layout from '../components/common/Layouts/Fixed/FixedContent';
import ImpersonationLauncher from '../components/appli/ImpersonationLauncher';

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

const badgeContent = (count, isLoading, isError) => {
  if (isLoading) return <CircularProgress size={10} color="inherit" />;
  if (isError) return '!';
  return count;
};

const ToolCard = ({
  icon,
  title,
  description,
  roleId,
  count,
  isLoading = false,
  isError = false,
  onClick
}) => {
  const { formatMessage } = useIntl();
  const roleLabel = formatMessage({ id: roleId });
  const hasCounter = typeof count === 'number';
  const showBadge = hasCounter && (isLoading || isError || count > 0);

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
      <CardActionArea onClick={onClick} aria-label={`${title} — ${roleLabel}`}>
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
                color={isError ? 'error' : 'secondary'}
                badgeContent={badgeContent(count, isLoading, isError)}
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
  isLoading: PropTypes.bool,
  isError: PropTypes.bool,
  onClick: PropTypes.func.isRequired
};

const DBExportCard = ({ dbExport, isLoading }) => {
  const { formatMessage } = useIntl();
  const lastUpdate = dbExport?.lastUpdate
    ? dbExport.lastUpdate.split('T')[0]
    : null;
  const sizeMo = dbExport?.size
    ? Math.round((dbExport.size * 10) / (1024 * 1024)) / 10
    : null;
  const url = dbExport?.url;

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
        {!isLoading && url && (
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
          disabled={!url}
          onClick={() => window.open(url, '_blank')}
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
    size: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }),
  isLoading: PropTypes.bool
};

DBExportCard.defaultProps = {
  dbExport: null,
  isLoading: false
};

const Dashboard = () => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const { data: dbExport, isPending: isDbExportLoading } = useDbExport({
    enabled: permissions.isLeader
  });
  const pendingDocumentsQuery = usePendingDocumentsCount({
    enabled: permissions.isModerator
  });
  const duplicatesQuery = useDuplicatesCount({
    enabled: permissions.isModerator
  });

  const goTo = url => navigate(url);

  useEffect(() => {
    const hasDashboardAccess =
      (permissions.isRealAdmin && !permissions.isTokenExpired) ||
      (permissions.isAuth &&
        (permissions.isAdmin ||
          permissions.isModerator ||
          permissions.isLeader));
    if (!hasDashboardAccess) {
      navigate('/');
    }
  }, [permissions, navigate]);

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
          {permissions.isRealAdmin && (
            <Section>
              <SectionTitle variant="overline">
                {formatMessage({ id: 'Users' })}
              </SectionTitle>
              <ToolGrid>
                {permissions.isAdmin && (
                  <ToolCard
                    icon={<PeopleIcon />}
                    title={formatMessage({ id: 'Manage users' })}
                    description={formatMessage({
                      id: 'Manage users description'
                    })}
                    roleId="Administrator"
                    onClick={() => goTo('/ui/admin/users')}
                  />
                )}
                <ImpersonationLauncher />
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
                  count={pendingDocumentsQuery.data ?? 0}
                  isLoading={pendingDocumentsQuery.isPending}
                  isError={pendingDocumentsQuery.isError}
                  onClick={() => goTo('/ui/documents/validation')}
                />
                <ToolCard
                  icon={<CallMergeIcon />}
                  title={formatMessage({ id: 'Duplicates Tool' })}
                  description={formatMessage({
                    id: 'Duplicates tool description'
                  })}
                  roleId="Moderator"
                  count={duplicatesQuery.data ?? 0}
                  isLoading={duplicatesQuery.isPending}
                  isError={duplicatesQuery.isError}
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
                {permissions.isLeader && (
                  <DBExportCard
                    dbExport={dbExport}
                    isLoading={isDbExportLoading}
                  />
                )}
              </ToolGrid>
            </Section>
          )}
        </>
      }
    />
  );
};

export default Dashboard;
