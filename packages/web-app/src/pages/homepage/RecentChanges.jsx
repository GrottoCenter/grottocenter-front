import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import DifferenceIcon from '@mui/icons-material/Difference';
import { useIntl } from 'react-intl';

import RecentChangesPreview from './RecentChangesPreview';

const Section = styled('section')(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(4, 3),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3, 2)
  }
}));

const TitleRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2.5)
}));

const Inner = styled(Box)({
  maxWidth: 720,
  margin: '0 auto'
});

const RecentChanges = () => {
  const { formatMessage } = useIntl();

  return (
    <Section aria-labelledby="recent-changes-title">
      <TitleRow>
        <DifferenceIcon
          color="primary"
          sx={{ fontSize: theme => theme.spacing(3.5) }}
        />
        <Typography
          id="recent-changes-title"
          variant="h3"
          component="h2"
          color="primary"
          sx={{
            fontWeight: 600
          }}>
          {formatMessage({ id: 'Recent activities' })}
        </Typography>
      </TitleRow>
      <Inner>
        <RecentChangesPreview />
      </Inner>
    </Section>
  );
};

export default RecentChanges;
