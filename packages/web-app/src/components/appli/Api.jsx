import React from 'react';
import { lighten } from '@mui/material/styles';
import withStyles from '@mui/styles/withStyles';
import { Grid, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';

import GCLink from '../common/GCLink';
import InternationalizedLink from '../common/InternationalizedLink';
import {
  restApiLinks,
  wikiApiLinks,
  contactLinks
} from '../../conf/externalLinks';
import Translate from '../common/Translate';
import Layout from '../common/Layouts/Fixed/FixedContent';

const StyledLinkToVersion = styled(GCLink)`
  text-decoration: none;
  font-weight: 600;
  color: ${props => props.theme.palette.accent1Color};
  &:hover {
    color: ${props => lighten(props.theme.palette.accent1Color, 0.3)};
  }
`;

const StyledCheckIcon = withStyles(
  theme => ({
    root: {
      fill: theme.palette.accent1Color,
      position: 'relative',
      top: '6px',
      marginRight: '10px'
    }
  }),
  { withTheme: true }
)(CheckIcon);

const Api = () => {
  const { formatMessage } = useIntl();
  const { locale } = useSelector(state => state.intl);

  const restApiLink =
    restApiLinks[locale] !== undefined
      ? restApiLinks[locale]
      : restApiLinks['*'];

  return (
    <Layout
      title={formatMessage({ id: 'Grottocenter API' })}
      content={
        <Grid container justifyContent="center" spacing={2}>
          <Grid item md={6} xs={12} style={{ maxWidth: '400px' }}>
            <img
              style={{ width: '100%' }}
              src="/images/network.png"
              alt="internet network"
            />
          </Grid>
          <Grid item md={6} xs={12} style={{ maxWidth: '600px' }}>
            <Typography gutterBottom>
              <Translate id="You need to manipulate worldwide speleology data on your website? Trust Grottocenter to manage it for you!" />
            </Typography>
            <Typography gutterBottom>
              <Translate
                id="We offer you a set of {0} that you can easily insert in your pages to access this data"
                values={{
                  0: (
                    <GCLink
                      href={restApiLink}
                      alt="Link to rest API documentation">
                      <Translate id="Rest API endpoints" />
                    </GCLink>
                  )
                }}
              />
            </Typography>
            <Typography gutterBottom>
              <Translate
                id="To use them, you just need an {0} key, and few lines of code!"
                values={{
                  0: (
                    <InternationalizedLink
                      links={wikiApiLinks}
                      alt="What is an API?">
                      <Translate id="API" />
                    </InternationalizedLink>
                  )
                }}
              />
              &nbsp;
              <Translate
                id="And to get your own API key, send us an email using the {0}"
                values={{
                  0: (
                    <InternationalizedLink
                      links={contactLinks}
                      alt="Contact form">
                      <Translate id="contact form" />
                    </InternationalizedLink>
                  )
                }}
              />
            </Typography>
            <Typography gutterBottom variant="h5" component="h2">
              <Translate id="Available versions:" />
            </Typography>
            <Typography variant="h4" component="h3" gutterBottom>
              <StyledCheckIcon />
              <StyledLinkToVersion internal href="/ui/api/1">
                <Translate id="Version 1" />
              </StyledLinkToVersion>
            </Typography>
            <Typography gutterBottom>
              <Translate
                id="Not familiar with Swagger? Need support? {0}"
                values={{
                  0: (
                    <GCLink href="https://grottocenter.slack.com/messages/C858CHARY/">
                      <Translate id="Contact us!" />
                    </GCLink>
                  )
                }}
              />
            </Typography>
          </Grid>
        </Grid>
      }
    />
  );
};

export default Api;
