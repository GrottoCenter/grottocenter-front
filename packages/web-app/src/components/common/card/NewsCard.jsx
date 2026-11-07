import { useId, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Skeleton,
  Typography
} from '@mui/material';
import SyncProblemOutlined from '@mui/icons-material/SyncProblemOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { styled } from '@mui/material/styles';
import { FormattedMessage } from 'react-intl';
import AppLink from '../AppLink';

const DEFAULT_NEWS_IMAGE = '/images/homepage/news.jpg';

const layoutSx = {
  display: 'flex',
  flexDirection: { xs: 'column', sm: 'row' },
  alignItems: 'stretch'
};

const mediaSx = {
  width: { xs: '100%', sm: 240 },
  height: 'auto',
  aspectRatio: { xs: '16 / 9', sm: '4 / 3' },
  flexShrink: 0,
  alignSelf: 'flex-start',
  objectFit: 'contain',
  bgcolor: 'background.default'
};

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
  image,
  linkMore
}) => {
  const titleId = useId();
  const [failedImage, setFailedImage] = useState(null);
  const imageSrc = image && image !== failedImage ? image : DEFAULT_NEWS_IMAGE;

  if (showSpinner && !title && !text) {
    return (
      <Card aria-busy="true" data-testid="news-card-loading" sx={layoutSx}>
        <Skeleton variant="rectangular" sx={mediaSx} />
        <CardContent sx={{ flex: 1, minWidth: 0 }}>
          <Skeleton variant="text" width="25%" sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="70%" height={32} />
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="90%" />
          <Skeleton variant="text" width="60%" />
        </CardContent>
      </Card>
    );
  }

  if (!title && !text) {
    return (
      <Card data-testid="news-card-unavailable">
        <CardContent sx={{ textAlign: 'center', py: 3, width: '100%' }}>
          <SyncProblemOutlined color="disabled" sx={{ fontSize: 40 }} />
          <Typography variant="body2" color="text.secondary" role="status">
            <FormattedMessage id="News unavailable" />
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const content = (
    <>
      <CardMedia
        key={image}
        component="img"
        src={imageSrc}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailedImage(image)}
        sx={mediaSx}
        data-testid="news-card-image"
      />
      <CardContent sx={{ flex: 1, minWidth: 0 }}>
        {Boolean(day && month) && (
          <DateLabel variant="caption">
            {day} {month}
          </DateLabel>
        )}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            mt: 0.5,
            mb: 0.5
          }}>
          <Typography
            id={titleId}
            variant="h4"
            component="h3"
            sx={{ flex: 1, minWidth: 0 }}>
            {title}
          </Typography>
          {linkMore && (
            <ArrowForwardIcon
              color="primary"
              fontSize="small"
              data-testid="news-card-arrow"
              sx={theme => ({
                flexShrink: 0,
                mt: 0.25,
                transform:
                  theme.direction === 'rtl' ? 'rotate(180deg)' : undefined
              })}
            />
          )}
        </Box>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            overflowWrap: 'anywhere'
          }}>
          {text}
        </Typography>
      </CardContent>
    </>
  );

  return (
    <Card component="article" data-testid="news-card">
      {linkMore ? (
        <CardActionArea
          component={AppLink}
          nativeButton={false}
          href={linkMore}
          color="inherit"
          underline="none"
          aria-labelledby={title ? titleId : undefined}
          data-testid="news-card-link"
          sx={{
            ...layoutSx,
            '&.Mui-focusVisible, &:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: -2
            }
          }}>
          {content}
        </CardActionArea>
      ) : (
        <Box sx={layoutSx}>{content}</Box>
      )}
    </Card>
  );
};

NewsCard.propTypes = {
  showSpinner: PropTypes.bool,
  day: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  month: PropTypes.string,
  title: PropTypes.string,
  text: PropTypes.string,
  image: PropTypes.string,
  linkMore: PropTypes.string
};

export default NewsCard;
