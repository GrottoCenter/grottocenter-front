import React from 'react';
import { Box, Typography } from '@mui/material';
import { HistoryOutlined } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useIntl } from 'react-intl';
import RecentChangesContainer from '../../containers/RecentChangesContainer';

const Section = styled('section')(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  padding: '32px 24px',
  [theme.breakpoints.down('sm')]: {
    padding: '24px 16px'
  }
}));

const TitleRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  marginBottom: 20
});

const Inner = styled(Box)({
  maxWidth: 720,
  margin: '0 auto'
});

const RecentChanges = () => {
  const { formatMessage } = useIntl();
  return (
    <Section aria-labelledby="recent-changes-title">
      <TitleRow>
        <HistoryOutlined color="primary" sx={{ fontSize: 28 }} />
        <Typography
          id="recent-changes-title"
          variant="h5"
          component="h2"
          fontWeight={600}
          color="primary">
          {formatMessage({ id: 'Recent changes' })}
        </Typography>
      </TitleRow>
      <Inner>
        <RecentChangesContainer />
      </Inner>
    </Section>
  );
};

export default RecentChanges;
