import { useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { ExploreOutlined } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { loadRandomEntrance } from '../../actions/RandomEntrance';
import RandomEntryCardContainer from '../../containers/RandomEntryCardContainer';

const Section = styled('section')(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
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

const RandomEntry = () => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();

  const handleRefresh = useCallback(() => {
    dispatch(loadRandomEntrance());
  }, [dispatch]);

  return (
    <Section aria-labelledby="random-entry-title">
      <TitleRow>
        <ExploreOutlined sx={{ fontSize: 28, color: 'white' }} />
        <Typography
          id="random-entry-title"
          variant="h5"
          component="h2"
          fontWeight={600}
          color="white">
          {formatMessage({ id: 'Discover a random cave' })}
        </Typography>
      </TitleRow>
      <Box sx={{ maxWidth: 720, width: '100%', mx: 'auto' }}>
        <RandomEntryCardContainer onRefresh={handleRefresh} />
      </Box>
    </Section>
  );
};

export default RandomEntry;
