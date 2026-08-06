import PropTypes from 'prop-types';
import { Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import AppLink from './AppLink';
import { logoGC } from '../../conf/config';

// `color: inherit` so the wordmark takes the tone of whatever chrome hosts it
// — white on the brown AppBar, primary.dark in the side menu — instead of
// MuiLink's own palette.
const brandStyles = ({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  color: 'inherit',
  textDecoration: 'none',
  flexShrink: 0
});

// Two roots rather than one with emotion's `as`: `as` keeps the prop filtering
// of the base tag, so a string base would strip `to` before AppLink ever saw it.
const RootSpan = styled('span')(brandStyles);
const RootLink = styled(AppLink)(brandStyles);

const Wordmark = styled(Typography)({
  whiteSpace: 'nowrap'
});

/**
 * The Grottocenter brand mark: the logo, optionally followed by the wordmark.
 *
 * Single implementation for what used to be hand-rolled in three places (the
 * AppBar, the side menu header, and here). Callers that only need the image and
 * size it themselves — the homepage header, footer and association block — pass
 * neither `size` nor `showWordmark` and keep styling `& img` from the outside.
 */
const GCLogo = ({
  className,
  showLink = true,
  size = null,
  showWordmark = false,
  onClick
}) => {
  const content = (
    <>
      <img
        src={logoGC}
        // Decorative once the wordmark is next to it: leaving the alt text in
        // would make a screen reader announce "Grottocenter" twice.
        alt={showWordmark ? '' : 'Grottocenter'}
        height={size ?? undefined}
      />
      {showWordmark && (
        <Wordmark variant="h4" component="span">
          Grottocenter
        </Wordmark>
      )}
    </>
  );

  if (showLink) {
    return (
      <RootLink to="/" className={className} onClick={onClick}>
        {content}
      </RootLink>
    );
  }
  return <RootSpan className={className}>{content}</RootSpan>;
};

GCLogo.propTypes = {
  className: PropTypes.string,
  // Wraps the mark in a link back to the homepage.
  showLink: PropTypes.bool,
  // Logo height in px. Omit to let the surrounding CSS size the image.
  size: PropTypes.number,
  // Renders the "Grottocenter" wordmark next to the logo.
  showWordmark: PropTypes.bool,
  // Fires alongside the navigation — used by the mobile overlay to dismiss
  // itself. Ignored when `showLink` is false, since there is nothing to click.
  onClick: PropTypes.func
};

export default GCLogo;
