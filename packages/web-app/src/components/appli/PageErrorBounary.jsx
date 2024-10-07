import React from 'react';
import PropTypes from 'prop-types';
import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Typography
} from '@mui/material';
import {
  createGitHubIssueForClientLinks,
  contactLinks
} from '../../conf/externalLinks';
import InternationalizedLink from '../common/InternationalizedLink';
import Translate from '../common/Translate';

const PageError = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Card style={{ margin: 8 }}>
      <CardHeader
        title={
          <Typography color="error" variant="h1">
            <Translate>Sorry, something went wrong...</Translate>
          </Typography>
        }
      />
      <CardContent>
        <Typography>
          <Translate>
            This issue occurred while you were trying to reach the following
            address:
          </Translate>
          &nbsp;
          <b>{location.pathname}</b>
        </Typography>
        <Typography>
          <Translate>
            Please, contact the Wikicaves team to report this bug:
          </Translate>
          &nbsp;
          <InternationalizedLink links={contactLinks} />
        </Typography>
        <Typography>
          <InternationalizedLink links={createGitHubIssueForClientLinks}>
            <Translate>
              You can also directly create a new issue on the Grottocenter
              GitHub page.
            </Translate>
          </InternationalizedLink>
        </Typography>
      </CardContent>
      <CardActions>
        <Box display="flex" width="100%" justifyContent="center">
          <Button onClick={() => navigate(0)}>
            <Translate>Reload</Translate>
          </Button>
          &nbsp; &nbsp;
          <Button onClick={() => navigate(0)} variant="outlined">
            <Translate>Go back</Translate>
          </Button>
        </Box>
      </CardActions>
    </Card>
  );
};

const PageErrorBoundary = ({ children }) => (
  <ErrorBoundary FallbackComponent={PageError}>{children}</ErrorBoundary>
);

PageErrorBoundary.propTypes = {
  children: PropTypes.node
};

export default PageErrorBoundary;
