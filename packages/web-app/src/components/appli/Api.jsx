import React from 'react';
import { Typography, Button, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import AppLink from '../common/AppLink';
import InternationalizedLink from '../common/InternationalizedLink';
import { wikiApiLinks, contactLinks } from '../../conf/externalLinks';
import Translate from '../common/Translate';
import Layout from '../common/Layouts/Fixed/FixedContent';

const PaddedButton = styled(Button)`
  margin-top: 1em;
  margin-bottom: 2em;
  text-align: center;
`;

const Api = () => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const { locale } = useSelector(state => state.intl);

  const wikiApiLink =
    wikiApiLinks[locale] !== undefined
      ? wikiApiLinks[locale]
      : wikiApiLinks['*'];

  return (
    <Layout
      title={formatMessage({ id: 'Grottocenter API' })}
      content={
        <Grid container justifyContent="center" spacing={1}>
          <Grid size={{ xs: 12, md: 6 }} style={{ maxWidth: '400px' }}>
            <img
              style={{ width: '100%' }}
              src="/images/network.png"
              alt="internet network"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }} style={{ maxWidth: '600px' }}>
            <Typography gutterBottom>
              <Translate id="You need to manipulate worldwide speleology data on your website? Trust Grottocenter to manage it for you!" />
            </Typography>
            <br />
            <Typography gutterBottom>
              <Translate
                id="We provide an {0} to easily access the data of Grottocenter"
                values={{
                  0: (
                    <AppLink href={wikiApiLink}>
                      <Translate key="api" id="API" />
                    </AppLink>
                  )
                }}
              />
            </Typography>
            <PaddedButton
              variant="outlined"
              onClick={() => navigate(`/ui/api/1`)}>
              {' '}
              <Translate id="API documentation" />{' '}
            </PaddedButton>
            <Typography gutterBottom>
              <Translate
                id="A complete export of the database is also available to {0} for leader users."
                values={{
                  0: (
                    <AppLink to="/ui/dashboard">
                      <Translate key="download" id="download" />
                    </AppLink>
                  )
                }}
              />
            </Typography>
            <br />
            <Typography gutterBottom>
              <Translate
                id="Need support? Request access? {0}"
                values={{
                  0: (
                    <InternationalizedLink
                      links={contactLinks}
                      alt="Contact form">
                      <Translate key="contact" id="Contact us!" />
                    </InternationalizedLink>
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
