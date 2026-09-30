// Pure Unicode stars — no MUI/emotion, safe for Leaflet renderToString popups
// (same reason DataQualityBadge is inline SVG).
import PropTypes from 'prop-types';
import { INTEREST_STAR_COLOR, getInterestLevel } from '../../../utils/interest';

const EMPTY_STAR_COLOR = '#e0e0e0';

const InterestStars = ({ value, size = 18 }) => {
  const stars = getInterestLevel(value);
  if (stars == null) return null;
  return (
    <span
      style={{
        flexShrink: 0,
        display: 'inline-flex',
        fontSize: size,
        lineHeight: 1,
        letterSpacing: '1px'
      }}>
      <span style={{ color: INTEREST_STAR_COLOR }}>{'★'.repeat(stars)}</span>
      {stars < 5 && (
        <span style={{ color: EMPTY_STAR_COLOR }}>{'★'.repeat(5 - stars)}</span>
      )}
    </span>
  );
};

InterestStars.propTypes = {
  value: PropTypes.number,
  size: PropTypes.number
};

export default InterestStars;
