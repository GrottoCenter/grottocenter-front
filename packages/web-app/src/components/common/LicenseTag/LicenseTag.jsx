import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Chip, Typography } from '@mui/material';
import LicenseBadge from './LicenseBadge';
import {
  getLicenseParts,
  CC_CLAUSE_DESCRIPTIONS,
  NON_CC_DESCRIPTIONS
} from './helpers';

// A selectable license row: the official badge (via LicenseBadge) followed by a
// plain-language explanation of what the license allows — the badge/code alone
// being jargon. Use it in Select options and their selected value. For a bare,
// non-explained badge (e.g. read-only detail views) use LicenseBadge directly.
const LicenseTag = ({ license, size = 34, recommended = false }) => {
  const { formatMessage } = useIntl();
  const { name, text, isCc, clauses, badgeSrc } = getLicenseParts(license);
  if (!name) return null;

  let description = null;
  if (isCc) {
    description =
      clauses.length > 0
        ? clauses
            .map(clause =>
              formatMessage({ id: CC_CLAUSE_DESCRIPTIONS[clause] })
            )
            .join(' · ')
        : null;
  } else {
    const descriptionId = NON_CC_DESCRIPTIONS[name];
    description = descriptionId
      ? formatMessage({ id: descriptionId, defaultMessage: text })
      : (text ?? null);
  }

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        minWidth: 0
      }}>
      {/* Fixed-width column for CC badges so every description lines up. All
          badges share ~the same aspect ratio, so width ≈ 3× the height. */}
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          flexShrink: 0,
          ...(badgeSrc && { width: size * 3 })
        }}>
        <LicenseBadge license={license} size={size} />
      </Box>
      {description && (
        <Typography
          component="span"
          variant="body2"
          sx={{ whiteSpace: 'normal', lineHeight: 1.3, minWidth: 0 }}>
          {description}
        </Typography>
      )}
      {recommended && (
        <Chip
          size="small"
          color="primary"
          variant="outlined"
          label={formatMessage({ id: 'Recommended' })}
          sx={{ flexShrink: 0 }}
        />
      )}
    </Box>
  );
};

LicenseTag.propTypes = {
  license: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      name: PropTypes.string,
      text: PropTypes.string,
      url: PropTypes.string
    })
  ]),
  size: PropTypes.number,
  recommended: PropTypes.bool
};

export default LicenseTag;
