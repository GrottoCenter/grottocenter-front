// Pure inline SVG — no MUI/emotion, safe for Leaflet renderToString contexts (requires react-intl).
import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  getDataQualityColor,
  DATA_QUALITY_TRACK_COLOR
} from '../../../utils/dataQuality';

const DataQualityBadge = ({ value, size = 40 }) => {
  const { formatMessage } = useIntl();
  const strokeWidth = size / 16;
  const r = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashoffset = circumference * (1 - value / 100);
  const color = getDataQualityColor(value);

  return (
    // span wrapper prevents .map-popup-property > svg from overriding the size prop
    <span style={{ flexShrink: 0, display: 'inline-flex' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: 'block' }}>
        <title>
          {formatMessage({ id: 'Data quality score: {value}/100' }, { value })}
        </title>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={DATA_QUALITY_TRACK_COLOR}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={Math.round(size * 0.38)}
          fontWeight="700"
          fill={color}>
          {value}
        </text>
      </svg>
    </span>
  );
};

DataQualityBadge.propTypes = {
  value: PropTypes.number.isRequired,
  size: PropTypes.number
};

export default DataQualityBadge;
