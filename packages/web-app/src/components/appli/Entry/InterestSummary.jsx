import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Paper, Rating, Typography } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';

import AppLink from '@/components/common/AppLink';
import CustomIcon from '@/components/common/CustomIcon';
import InfoSection from '@/components/common/InfoSection';
import { Property } from '@/components/common/Properties';
import { CommentPropTypes } from '@/types/entrance.type';
import {
  durationStringToMinutes,
  formatDurationMinutes
} from '@/utils/dateTimeDuration';

const getDurationRange = (comments, field, formatNumberToParts) => {
  const durations = comments
    .map(comment => durationStringToMinutes(comment[field]))
    .filter(minutes => Number.isFinite(minutes) && minutes > 0);
  if (durations.length === 0) return null;

  const minimum = Math.min(...durations);
  const maximum = Math.max(...durations);
  if (minimum === maximum)
    return formatDurationMinutes(minimum, formatNumberToParts);
  return `${formatDurationMinutes(minimum, formatNumberToParts)}\u00a0– ${formatDurationMinutes(maximum, formatNumberToParts)}`;
};

const InterestSummary = ({ entranceId, comments = [], canComment = false }) => {
  const { formatMessage, formatNumber, formatNumberToParts } = useIntl();
  const ratings = comments
    .map(comment => comment.aestheticism)
    .filter(value => Number.isFinite(value) && value > 0);
  const average = ratings.length
    ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length / 2
    : null;
  const approachTime = getDurationRange(
    comments,
    'eTTrail',
    formatNumberToParts
  );
  const undergroundTime = getDurationRange(
    comments,
    'eTUnderground',
    formatNumberToParts
  );
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
                <AppLink
                  to={commentsUrl}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                  <AddCircleIcon fontSize="small" aria-hidden="true" />
                  {formatMessage({ id: 'Comment and rate' })}
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
        {(approachTime || undergroundTime) && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 0.5,
              mt: 1
            }}>
            {approachTime && (
              <Property
                label={formatMessage({ id: 'Time to go' })}
                value={approachTime}
                icon={
                  <CustomIcon
                    type="time_to_go"
                    alt={formatMessage({ id: 'Time to go' })}
                  />
                }
              />
            )}
            {undergroundTime && (
              <Property
                label={formatMessage({ id: 'Underground time (short)' })}
                value={undergroundTime}
                icon={
                  <CustomIcon
                    type="underground_time"
                    alt={formatMessage({ id: 'Underground time' })}
                  />
                }
              />
            )}
          </Box>
        )}
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
