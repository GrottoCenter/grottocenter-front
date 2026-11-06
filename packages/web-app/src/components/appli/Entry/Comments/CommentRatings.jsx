import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Rating, Typography } from '@mui/material';
import StarBorderIcon from '@mui/icons-material/StarBorder';

import {
  VISIT_RATING_DEFINITIONS,
  getRatingLevelIds
} from '@/utils/visitRatingLevels';

const CommentRatings = ({ interest, progression, access }) => {
  const { formatMessage, formatNumber } = useIntl();
  const values = { interest, progression, access };

  return (
    <>
      {VISIT_RATING_DEFINITIONS.map(({ key, labelId, levels }) => {
        const value = values[key];
        if (value == null || value <= 0) return null;

        const description = getRatingLevelIds(value / 2, levels)
          .map(id => formatMessage({ id }))
          .join(' – ');

        return (
          <Box
            key={key}
            role="group"
            aria-label={formatMessage({ id: labelId })}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              columnGap: 0.5,
              flex: '0 0 auto',
              maxWidth: '100%'
            }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600
              }}>
              {formatMessage({ id: labelId })}
            </Typography>
            <Rating
              value={value / 2}
              precision={0.5}
              size="small"
              readOnly
              getLabelText={rating =>
                formatMessage(
                  { id: '{rating} out of 5 stars' },
                  { rating: formatNumber(rating, { maximumFractionDigits: 1 }) }
                )
              }
              emptyIcon={<StarBorderIcon fontSize="inherit" />}
            />
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary'
              }}>
              {formatMessage(
                { id: '{rating} / 5' },
                {
                  rating: formatNumber(value / 2, {
                    maximumFractionDigits: 1
                  })
                }
              )}
              {' · '}
              {description}
            </Typography>
          </Box>
        );
      })}
    </>
  );
};

CommentRatings.propTypes = {
  interest: PropTypes.number,
  progression: PropTypes.number,
  access: PropTypes.number
};

export default CommentRatings;
