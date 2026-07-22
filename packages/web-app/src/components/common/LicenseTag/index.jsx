import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Chip, Link, Typography } from '@mui/material';
import BalanceIcon from '@mui/icons-material/Balance';
import AppLink from '@/components/common/AppLink';
import ccBy from '@/assets/icons/cc/cc-by.svg';
import ccBySa from '@/assets/icons/cc/cc-by-sa.svg';
import ccByNc from '@/assets/icons/cc/cc-by-nc.svg';
import ccByNd from '@/assets/icons/cc/cc-by-nd.svg';
import ccByNcSa from '@/assets/icons/cc/cc-by-nc-sa.svg';
import ccByNcNd from '@/assets/icons/cc/cc-by-nc-nd.svg';

// Official Creative Commons composite badges (Wikimedia Commons), keyed by the
// dash-joined clause list. Non-CC licenses (ODbL, ODC-BY, Licence Ouverte…) have
// no standard badge and fall back to the MUI Balance icon + name.
const CC_BADGES = {
  BY: ccBy,
  'BY-SA': ccBySa,
  'BY-NC': ccByNc,
  'BY-ND': ccByNd,
  'BY-NC-SA': ccByNcSa,
  'BY-NC-ND': ccByNcNd
};

// Plain-language description of each CC clause — what actually helps a user
// choose, the badge alone being jargon. Keyed by clause token.
const CC_CLAUSE_DESCRIPTIONS = {
  BY: 'Credit the author',
  NC: 'Non-commercial use only',
  SA: 'Share under the same terms',
  ND: 'No modifications allowed',
  ZERO: 'No rights reserved (public domain)'
};

// Plain-language description for the non-CC licenses. Falls back to the license
// `text` from the API for anything not listed here.
const NON_CC_DESCRIPTIONS = {
  ODBL: 'Open database, share alike',
  'ODC-BY': 'Open database, attribution required',
  'Licence Ouverte': 'French State open license'
};

const getLicenseName = license =>
  typeof license === 'string' ? license : (license?.name ?? '');

// Returns the ordered list of CC clause tokens for a license name, or null when
// the license is not a Creative Commons one. Tolerant to both spellings the API
// uses ("CC-BY-SA" and "CC BY NC").
const parseCcClauses = name => {
  const tokens = name.toUpperCase().split(/[\s-]+/).filter(Boolean);
  const first = tokens[0];
  if (first !== 'CC' && first !== 'CC0') return null;
  if (first === 'CC0' || tokens[1] === '0' || tokens.includes('ZERO'))
    return ['ZERO'];
  return tokens.slice(1).filter(token => CC_CLAUSE_DESCRIPTIONS[token]);
};

// Displays a license using its official Creative Commons badge (or the Balance
// icon + name for non-CC licenses). Use everywhere a license would otherwise be
// shown as plain text.
//
// - `size` is the badge height in px.
// - `withDescription` adds a plain-language explanation beside the badge (needs
//   the full license object) — for selectable option lists.
// - `linkToDeed` makes the badge a link to the official license deed when the
//   license object carries a `url` — for read-only detail views.
const LicenseTag = ({
  license,
  size = 34,
  withDescription = false,
  linkToDeed = false,
  recommended = false
}) => {
  const { formatMessage } = useIntl();
  const name = getLicenseName(license);
  if (!name) return null;

  const clauses = parseCcClauses(name);
  const isCc = clauses !== null;
  const text = typeof license === 'object' && license ? license.text : undefined;
  const url = typeof license === 'object' && license ? license.url : undefined;
  const badgeSrc = isCc ? CC_BADGES[clauses.join('-')] : undefined;

  // The icon/badge only — the license name for non-CC lives in the text column.
  let icon = badgeSrc ? (
    <Box
      component="img"
      src={badgeSrc}
      alt={name}
      title={name}
      sx={{ height: size, width: 'auto', display: 'block' }}
    />
  ) : (
    <BalanceIcon sx={{ fontSize: size, display: 'block' }} />
  );

  if (linkToDeed && url) {
    icon = (
      <Link
        component={AppLink}
        href={url}
        title={name}
        sx={{ display: 'inline-flex', lineHeight: 0 }}>
        {icon}
      </Link>
    );
  }

  // Compact usage (no description): CC shows its self-labelled badge; non-CC
  // needs the name spelled out next to the Balance icon.
  if (!withDescription) {
    if (badgeSrc) return icon;
    return (
      <Box
        component="span"
        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
        {icon}
        <Typography component="span" variant="body2" noWrap>
          {name}
        </Typography>
      </Box>
    );
  }

  let description = null;
  if (isCc) {
    description =
      clauses.length > 0
        ? clauses
            .map(clause => formatMessage({ id: CC_CLAUSE_DESCRIPTIONS[clause] }))
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
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
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
        {icon}
      </Box>
      <Typography
        component="span"
        variant="body2"
        sx={{ whiteSpace: 'normal', lineHeight: 1.3, minWidth: 0 }}>
        {/* Non-CC has no self-labelled badge, so lead with the name. */}
        {!badgeSrc && (
          <Box component="strong" sx={{ fontWeight: 600 }}>
            {name}
            {description ? ' — ' : ''}
          </Box>
        )}
        {description}
      </Typography>
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
  withDescription: PropTypes.bool,
  linkToDeed: PropTypes.bool,
  recommended: PropTypes.bool
};

export default LicenseTag;
