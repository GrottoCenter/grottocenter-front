import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Skeleton,
  Typography
} from '@mui/material';
import { SyncProblemOutlined } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { FormattedMessage } from 'react-intl';
import AppLink from '../AppLink';
import { DYNAMIC_NEWS_RELOAD_INTERVAL } from '../../../conf/config';

const StyledCard = styled(Card)({
  overflow: 'hidden'
});

const DateLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.secondary.main,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em'
}));

const NewsCard = ({
  showSpinner,
  text,
  day,
  month,
  title,
  linkMore,
  init,
  refresh
}) => {
  const hasInit = useRef(false);

  useEffect(() => {
    if (!hasInit.current) {
      hasInit.current = true;
      init();
      refresh();
    }
  }, [init, refresh]);

  useEffect(() => {
    const interval = setInterval(refresh, DYNAMIC_NEWS_RELOAD_INTERVAL);
    return () => clearInterval(interval);
    // refresh reference is stable from connect() — run interval once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (showSpinner && !text) {
    return (
      <StyledCard>
        <Skeleton variant="rectangular" height={150} />
        <CardContent>
          <Skeleton variant="text" width="25%" sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="70%" height={32} />
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="90%" />
          <Skeleton variant="text" width="60%" />
        </CardContent>
      </StyledCard>
    );
  }

  if (!text) {
    return (
      <StyledCard>
        <CardContent sx={{ textAlign: 'center', py: 3 }}>
          <SyncProblemOutlined color="disabled" sx={{ fontSize: 40 }} />
        </CardContent>
      </StyledCard>
    );
  }

  return (
    <StyledCard>
      <CardMedia image="images/homepage/news.jpg" sx={{ height: 150 }} />
      <CardContent sx={{ pt: 1 }}>
        {day && month && (
          <DateLabel variant="caption">
            {day} {month}
          </DateLabel>
        )}
        <Typography variant="h4" component="h3" sx={{ mt: '4px', mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {text}
        </Typography>
        {linkMore && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <AppLink href={linkMore}>
              <Button color="secondary" variant="outlined" size="small">
                <FormattedMessage id="Read more" />
              </Button>
            </AppLink>
          </Box>
        )}
      </CardContent>
    </StyledCard>
  );
};

NewsCard.propTypes = {
  showSpinner: PropTypes.bool,
  day: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  month: PropTypes.string,
  title: PropTypes.string,
  text: PropTypes.string,
  linkMore: PropTypes.string,
  init: PropTypes.func.isRequired,
  refresh: PropTypes.func.isRequired
};

export default NewsCard;
