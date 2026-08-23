import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ErrorBoundary } from 'react-error-boundary';
import { useIntl } from 'react-intl';
import { useLocation, useNavigate } from 'react-router-dom';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';

import {
  createGitHubIssueForClientLinks,
  contactLinks
} from '../../conf/externalLinks';
import AppLink from '../common/AppLink';
import InternationalizedLink from '../common/InternationalizedLink';
import PageContainer from '../common/Layouts/PageContainer';
import Translate from '../common/Translate';
import copyToClipboard from '../../helpers/clipboard';

const appVersion = import.meta.env.VITE_APP_VERSION || '—';
const COPY_STATUS_MESSAGES = {
  error: 'Unable to copy technical details',
  success: 'Technical details copied'
};
const VISUALLY_HIDDEN = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px'
};

export const PageError = ({ error = null }) => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const location = useLocation();
  const titleRef = useRef(null);
  const [copyStatus, setCopyStatus] = useState(null);

  const technicalReport = useMemo(
    () =>
      [
        `${formatMessage({ id: 'UTC date' })}: ${new Date().toISOString()}`,
        `${formatMessage({ id: 'Page address' })}: ${location.pathname}`,
        `${formatMessage({ id: 'Application version' })}: ${appVersion}`,
        `${formatMessage({ id: 'Browser' })}: ${navigator.userAgent}`,
        `${formatMessage({ id: 'Error type' })}: ${error?.name || 'Error'}`
      ].join('\n'),
    [error?.name, formatMessage, location.pathname]
  );

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!copyStatus) return undefined;
    const timeout = setTimeout(() => setCopyStatus(null), 2000);
    return () => clearTimeout(timeout);
  }, [copyStatus]);

  const copyLabel = formatMessage({
    id: COPY_STATUS_MESSAGES[copyStatus] || 'Copy details'
  });

  const handleCopy = async () => {
    try {
      await copyToClipboard(technicalReport);
      setCopyStatus('success');
    } catch (_error) {
      setCopyStatus('error');
    }
  };

  return (
    <PageContainer>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: { xs: 2, md: 6 }
        }}>
        <Card
          aria-labelledby="page-error-title"
          role="alert"
          sx={{ boxShadow: 1, maxWidth: '40rem', width: '100%' }}
          variant="outlined">
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography
              id="page-error-title"
              ref={titleRef}
              color="error"
              sx={{ alignItems: 'center', display: 'flex', gap: 1 }}
              tabIndex={-1}
              variant="h1">
              <ErrorOutlineIcon aria-hidden="true" fontSize="large" />
              <Translate>An unexpected error occurred</Translate>
            </Typography>
            <Typography sx={{ mt: 2 }}>
              <Translate>
                We could not display this page because of an unexpected problem.
              </Translate>
            </Typography>
            <Typography sx={{ mt: 1 }}>
              <Translate>
                You can try again or return to the home page.
              </Translate>
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 1,
                mt: 3
              }}>
              <Button
                fullWidth
                onClick={() => navigate(0)}
                sx={{ order: { xs: 1, sm: 2 } }}
                variant="contained">
                <Translate>Try again</Translate>
              </Button>
              <Button
                component={AppLink}
                fullWidth
                sx={{ order: { xs: 2, sm: 1 } }}
                to="/"
                underline="none"
                variant="outlined">
                <Translate>Return to home</Translate>
              </Button>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography>
                <InternationalizedLink links={contactLinks}>
                  <Translate>
                    If the problem persists, contact the Wikicaves team.
                  </Translate>
                </InternationalizedLink>
              </Typography>
              <Typography sx={{ mt: 0.5 }}>
                <InternationalizedLink links={createGitHubIssueForClientLinks}>
                  <Translate>Report the problem on GitHub</Translate>
                </InternationalizedLink>
              </Typography>
            </Box>

            <Box component="details" sx={{ mt: 3 }}>
              <Typography
                component="summary"
                sx={{ cursor: 'pointer', fontWeight: 600 }}>
                <Translate>Technical details</Translate>
              </Typography>
              <Box sx={{ mt: 2, position: 'relative' }}>
                <Box
                  component="pre"
                  sx={{
                    bgcolor: 'action.hover',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    m: 0,
                    overflowWrap: 'anywhere',
                    p: 2,
                    pr: 6,
                    typography: 'body2',
                    whiteSpace: 'pre-wrap'
                  }}>
                  {technicalReport}
                </Box>
                <Tooltip title={copyLabel}>
                  <IconButton
                    aria-label={copyLabel}
                    onClick={handleCopy}
                    size="small"
                    sx={{ position: 'absolute', right: 0.5, top: 0.5 }}>
                    {copyStatus === 'success' ? (
                      <CheckIcon color="success" />
                    ) : (
                      <ContentCopyIcon />
                    )}
                  </IconButton>
                </Tooltip>
                <Box aria-live="polite" component="span" sx={VISUALLY_HIDDEN}>
                  {copyStatus && copyLabel}
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

PageError.propTypes = {
  error: PropTypes.instanceOf(Error)
};

const PageErrorBoundary = ({ children }) => {
  const location = useLocation();
  return (
    <ErrorBoundary FallbackComponent={PageError} resetKeys={[location.key]}>
      {children}
    </ErrorBoundary>
  );
};

PageErrorBoundary.propTypes = {
  children: PropTypes.node
};

export default PageErrorBoundary;
