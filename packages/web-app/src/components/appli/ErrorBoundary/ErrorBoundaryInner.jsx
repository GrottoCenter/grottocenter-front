import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Typography
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';
import { withRouter } from 'react-router-dom';
import {
  createGitHubIssueForClientLinks,
  contactLinks
} from '../../../conf/externalLinks';
import InternationalizedLink from '../../common/InternationalizedLink';
import Translate from '../../common/Translate';

// See https://dev.to/tylerlwsmith/error-boundary-causes-react-router-links-to-stop-working-50gb
class ErrorBoundaryInner extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.goBack = this.goBack.bind(this);
    this.goHome = this.goHome.bind(this);
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidUpdate(prevProps, _previousState) {
    const { hasError } = this.props;
    const { hasError: prevHasError } = prevProps;
    if (!hasError && prevHasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(_error, _errorInfo) {
    const { setHasError } = this.props;
    setHasError(true);
  }

  goBack() {
    const { history } = this.props;
    history.goBack();
  }

  goHome() {
    const { history } = this.props;
    history.push('/');
  }

  render() {
    const { hasError } = this.state;
    const {
      children,
      history: {
        location: { pathname }
      }
    } = this.props;
    if (hasError) {
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
              <b>{pathname}</b>
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
              <Button onClick={this.goBack}>
                <Translate>Go back</Translate>
              </Button>
              &nbsp; &nbsp;
              <Button color="primary" onClick={this.goHome}>
                <Translate>Go to home page</Translate>
              </Button>
            </Box>
          </CardActions>
        </Card>
      );
    }
    return children;
  }
}

ErrorBoundaryInner.propTypes = {
  children: PropTypes.node,
  hasError: PropTypes.bool.isRequired,
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
    location: PropTypes.shape({
      pathname: PropTypes.string.isRequired
    }).isRequired
  }).isRequired,
  setHasError: PropTypes.func.isRequired
};

export default withRouter(ErrorBoundaryInner);
