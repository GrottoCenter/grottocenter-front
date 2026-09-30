import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Paper, Rating, Typography } from '@mui/material';

import AppLink from '@/components/common/AppLink';
import InfoSection from '@/components/common/InfoSection';
import { CommentPropTypes } from '@/types/entrance.type';

const InterestSummary = ({ entranceId, comments = [], canComment = false }) => {
  const { formatMessage, formatNumber } = useIntl();
  const ratings = comments
    .filter(comment => !comment.isDeleted)
    .map(comment => comment.aestheticism)
    .filter(value => Number.isFinite(value) && value > 0);
  const average = ratings.length
    ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length / 2
    : null;
  const commentsUrl = `/ui/entrances/${entranceId}?tab=comments`;

  return (
    <Paper
      variant="outlined"
      sx={{ p: 1, borderRadius: 2, bgcolor: 'grey.50' }}>
      <InfoSection
        component="h2"
        title={formatMessage({ id: 'Interest of the visit' })}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1
          }}>
          {average === null ? (
            <>
              <Typography color="text.secondary">
                {formatMessage({ id: 'Interest not rated yet' })}
              </Typography>
              {canComment && (
                <AppLink to={commentsUrl}>
                  {formatMessage({ id: 'Add a new comment' })}
                </AppLink>
              )}
            </>
          ) : (
            <>
              <Rating
                readOnly
                precision={0.1}
                value={average}
                getLabelText={() =>
                  formatMessage(
                    { id: 'Average interest: {rating} out of 5' },
                    {
                      rating: formatNumber(average, {
                        maximumFractionDigits: 1
                      })
                    }
                  )
                }
              />
              <Typography component="span" fontWeight={600}>
                {formatMessage(
                  { id: '{rating} / 5' },
                  {
                    rating: formatNumber(average, { maximumFractionDigits: 1 })
                  }
                )}
              </Typography>
              <AppLink to={commentsUrl}>
                {formatMessage(
                  { id: '{count, plural, one {# rating} other {# ratings}}' },
                  { count: ratings.length }
                )}
              </AppLink>
            </>
          )}
        </Box>
      </InfoSection>
    </Paper>
  );
};

InterestSummary.propTypes = {
  entranceId: PropTypes.number.isRequired,
  comments: PropTypes.arrayOf(CommentPropTypes),
  canComment: PropTypes.bool
};

export default InterestSummary;
