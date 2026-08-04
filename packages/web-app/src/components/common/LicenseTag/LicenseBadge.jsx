import PropTypes from 'prop-types';
import { Box, Link, Typography } from '@mui/material';
import BalanceIcon from '@mui/icons-material/Balance';
import AppLink from '@/components/common/AppLink';
import { getLicenseParts } from './helpers';

// The visual identity of a license: its official Creative Commons badge, or the
// MUI Balance icon + name for non-CC licenses (which have no standard badge).
// When `linkToDeed` is set and the license carries a `url`, the whole badge —
// icon and name alike — links to the official license deed.
const LicenseBadge = ({ license, size = 34, linkToDeed = false }) => {
  const { name, url, badgeSrc } = getLicenseParts(license);
  if (!name) return null;

  const content = badgeSrc ? (
    <Box
      component="img"
      src={badgeSrc}
      alt={name}
      title={name}
      sx={{ height: size, width: 'auto', display: 'block' }}
    />
  ) : (
    <Box
      component="span"
      title={name}
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      <BalanceIcon sx={{ fontSize: size, display: 'block' }} />
      <Typography component="span" variant="body2" noWrap>
        {name}
      </Typography>
    </Box>
  );

  if (linkToDeed && url) {
    return (
      <Link
        component={AppLink}
        href={url}
        title={name}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          lineHeight: 0,
          color: 'inherit'
        }}>
        {content}
      </Link>
    );
  }
  return content;
};

LicenseBadge.propTypes = {
  license: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({ name: PropTypes.string, url: PropTypes.string })
  ]),
  size: PropTypes.number,
  linkToDeed: PropTypes.bool
};

export default LicenseBadge;
