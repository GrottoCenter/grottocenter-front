import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Paper, Rating, Typography } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';

import AppLink from '@/components/common/AppLink';
import CustomIcon from '@/components/common/CustomIcon';
import InfoSection from '@/components/common/InfoSection';
import { Property } from '@/components/common/Properties';
import { CommentPropTypes } from '@/types/entrance.type';
import { getEntranceInterest } from '@/utils/entranceInterest';

const InterestSummary = ({ entranceId, comments = [], canComment = false }) => {
  const { formatMessage, formatNumber, formatNumberToParts } = useIntl();
  const { average, ratingCount, approachTime, undergroundTime } =
    getEntranceInterest(comments, formatNumberToParts);
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
              <Typography
                sx={{
                  color: 'text.secondary'
                }}>
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
              <Typography
                component="span"
                sx={{
                  fontWeight: 600
                }}>
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
                  { count: ratingCount }
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
                icon={<CustomIcon type="time_to_go" alt="" />}
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
