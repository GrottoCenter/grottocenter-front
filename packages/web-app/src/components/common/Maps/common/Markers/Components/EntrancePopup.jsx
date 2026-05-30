import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import CustomIcon from '../../../../CustomIcon';
import { Information, makeCoordinatesValue } from './utils';

// Pure inline-SVG — no emotion dependency, safe for renderToString (Leaflet popups).
const DataQualityCircle = ({ value, size = 30 }) => {
  const r = (size - 4) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashoffset = circumference * (1 - value / 100);
  // eslint-disable-next-line no-nested-ternary
  const color = value >= 70 ? '#2e7d32' : value >= 40 ? '#ed6c02' : '#d32f2f';
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ flexShrink: 0, display: 'block' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e0e0e0" strokeWidth="2.5" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
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
  );
};

DataQualityCircle.propTypes = {
  value: PropTypes.number.isRequired,
  size: PropTypes.number
};

export const EntrancePopup = ({ entrance }) => {
  const { formatMessage } = useIntl();
  // geoloc endpoint returns a flat number; detail endpoint returns { total, categories }
  const dataQualityValue =
    typeof entrance.dataQuality === 'number'
      ? entrance.dataQuality
      : entrance.dataQuality?.total;

  return (
    <>
      <Information
        isTitle
        value={entrance.name}
        url={`/ui/entrances/${entrance.id}`}
      />
      {entrance.caveName && entrance.caveName !== entrance.name && (
        <Information
          value={`${entrance.caveName}`}
          icon={<CustomIcon size={25} type="network" />}
          url={`/ui/caves/${entrance.caveId}`}
        />
      )}
      <Information
        value={`${entrance.city && entrance.city}, ${
          entrance.region && entrance.region
        }`}
        icon={<CustomIcon size={25} type="location" />}
      />
      <Information
        value={makeCoordinatesValue(entrance.latitude, entrance.longitude)}
        icon={<CustomIcon size={25} type="coordinates" />}
      />
      {entrance.depth && (
        <Information
          value={`${entrance.depth} m`}
          icon={<CustomIcon size={25} type="depth" />}
        />
      )}
      {entrance.length && (
        <Information
          value={`${entrance.length} m`}
          icon={<CustomIcon size={25} type="length" />}
        />
      )}
      {dataQualityValue != null && (
        <Information
          icon={<DataQualityCircle value={dataQualityValue} size={36} />}
          value={formatMessage({
            id:
              // eslint-disable-next-line no-nested-ternary
              dataQualityValue >= 70
                ? 'Good quality'
                : dataQualityValue >= 40
                  ? 'Satisfactory quality'
                  : 'Insufficient quality'
          })}
        />
      )}
    </>
  );
};

EntrancePopup.propTypes = {
  entrance: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string,
    region: PropTypes.string,
    city: PropTypes.string,
    longitude: PropTypes.number,
    latitude: PropTypes.number,
    caveName: PropTypes.string,
    caveId: PropTypes.number,
    depth: PropTypes.number,
    length: PropTypes.number,
    dataQuality: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.shape({ total: PropTypes.number })
    ])
  }).isRequired
};

export default EntrancePopup;
