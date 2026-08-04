import React from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { brown } from '@mui/material/colors';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import { useIntl } from 'react-intl';
import AppLink from '../../components/common/AppLink';
import { usePermissions } from '../../hooks';

const WelcomeSection = styled('section')(({ theme }) => ({
  backgroundColor: brown[50],
  padding: '40px 20px',
  [theme.breakpoints.down('sm')]: {
    padding: '24px 20px'
  }
}));

const Inner = styled(Box)({
  maxWidth: 960,
  margin: '0 auto'
});

const BlockTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.secondary.main,
  fontWeight: 600,
  marginBottom: 8
}));

const BLOCKS = [
  {
    titleId: 'Free access',
    textIds: [
      'Grottocenter is built by cavers, for cavers — explorers driven by passion and scientific researchers alike. A free, open reference on the underground world, accessible to all.'
    ]
  },
  {
    titleId: 'Better together',
    textIds: [
      'Create an account to add entrances, improve data quality, save and rate your visited caves, leave comments and link documents and organisations. The more cavers contribute, the more reliable and complete our shared knowledge grows. We need you!'
    ]
  },
  {
    titleId: 'BBS / SA',
    textIds: [
      'The Speleological Abstracts (SA / BBS) has joined Grottocenter to give you access to a very important collection of documents.',
      "You can now contribute to SA / BBS, either directly or by joining your country's contributing team."
    ]
  }
];

const Welcome = () => {
  const { formatMessage } = useIntl();
  const { isAuth } = usePermissions();

  return (
    <WelcomeSection aria-label={formatMessage({ id: 'Free access' })}>
      <Inner>
        <Grid container spacing={{ xs: 1, sm: 3 }}>
          {BLOCKS.map(({ titleId, textIds }) => (
            <Grid key={titleId} size={{ xs: 12, sm: 4 }}>
              <BlockTitle
                variant="h6"
                component="h2"
                sx={{ mb: { xs: '4px', sm: 0.5 } }}>
                {formatMessage({ id: titleId })}
              </BlockTitle>
              <Typography variant="body2" color="text.secondary">
                {textIds.map(id => formatMessage({ id })).join(' ')}
              </Typography>
            </Grid>
          ))}
        </Grid>
        {!isAuth && (
          <Box sx={{ textAlign: 'center', mt: { xs: 4, sm: 5 } }}>
            <Button
              component={AppLink}
              to="/ui/signup"
              color="secondary"
              startIcon={<AccountBoxIcon />}
              sx={{
                px: 6,
                py: '16px',
                fontSize: '0.875rem',
                fontWeight: 600
              }}>
              {formatMessage({ id: 'Create an account' })}
            </Button>
          </Box>
        )}
      </Inner>
    </WelcomeSection>
  );
};

export default Welcome;
