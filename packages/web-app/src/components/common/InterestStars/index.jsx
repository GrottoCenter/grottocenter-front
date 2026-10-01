// Pure Unicode stars — no MUI/emotion, safe for Leaflet renderToString popups
// (same reason DataQualityBadge is inline SVG).
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { INTEREST_STAR_COLOR, getInterestLevel } from '../../../utils/interest';

const EMPTY_STAR_COLOR = '#e0e0e0';

const InterestStars = ({ value, size = 18 }) => {
  const { formatMessage, formatNumber } = useIntl();
  const stars = getInterestLevel(value);
  if (stars == null) return null;
  return (
    <span
      role="img"
      aria-label={formatMessage(
        { id: '{rating} out of 5 stars' },
        { rating: formatNumber(stars, { maximumFractionDigits: 1 }) }
      )}
      style={{
        flexShrink: 0,
        display: 'inline-flex',
        position: 'relative',
        fontSize: size,
        lineHeight: 1,
        letterSpacing: '1px'
      }}>
      <span style={{ color: EMPTY_STAR_COLOR }}>{'★'.repeat(5)}</span>
      <span
        style={{
          color: INTEREST_STAR_COLOR,
          position: 'absolute',
          inset: 0,
          whiteSpace: 'nowrap',
          clipPath: `inset(0 ${100 - stars * 20}% 0 0)`
        }}>
        {'★'.repeat(5)}
      </span>
    </span>
  );
};

InterestStars.propTypes = {
  value: PropTypes.number,
  size: PropTypes.number
};

export default InterestStars;
