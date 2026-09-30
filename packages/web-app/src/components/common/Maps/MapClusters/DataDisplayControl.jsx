import React, { useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useIntl } from 'react-intl';
import { useFullScreen } from 'react-browser-hooks';

import CustomControl, { customControlProps } from '../common/CustomControl';
import {
  entranceIcon,
  networkIcon,
  organizationIcon,
  massifIcon
} from '../../../../assets/icons';
import { EXPLORED_PIN_PATH } from './ExploredOverlay';
import {
  ControlToggleButton,
  ControlSectionTitle,
  ControlOptionLabel
} from './controlStyles';

// Every dataset the user can toggle on the map. At low zoom each type shows as
// clusters; at high zoom entrances/networks/organizations switch to real
// markers and massifs to polygons — but a single toggle drives both modes.
export const layerTypes = {
  ENTRANCES: 'entrances',
  NETWORKS: 'networks',
  MASSIFS: 'massifs',
  ORGANIZATIONS: 'organizations'
};

export const LAYER_TYPES_LIST = [
  layerTypes.ENTRANCES,
  layerTypes.NETWORKS,
  layerTypes.MASSIFS,
  layerTypes.ORGANIZATIONS
];

const ExploredBadgeIcon = () => (
  <svg
    width="14"
    height="20"
    viewBox="0 0 20 28"
    style={{ flexShrink: 0, marginRight: 4 }}>
    <path
      d={EXPLORED_PIN_PATH}
      fill="#2e7d32"
      stroke="#fff"
      strokeWidth="1.5"
    />
    <text
      x="10"
      y="11.5"
      textAnchor="middle"
      fill="#fff"
      fontSize="9"
      fontWeight="bold"
      fontFamily="sans-serif">
      ✓
    </text>
  </svg>
);

const MARKER_ICON = {
  [layerTypes.ENTRANCES]: entranceIcon,
  [layerTypes.NETWORKS]: networkIcon,
  [layerTypes.MASSIFS]: massifIcon,
  [layerTypes.ORGANIZATIONS]: organizationIcon
};

const MarkerIcon = ({ type }) => {
  const src = MARKER_ICON[type];
  if (src) {
    return (
      <img
        src={src}
        alt=""
        height="22"
        style={{ flexShrink: 0, marginRight: 4 }}
      />
    );
  }
  return null;
};

MarkerIcon.propTypes = {
  type: PropTypes.string.isRequired
};

const DataDisplayControl = ({
  selectedLayers,
  toggleLayer,
  isAuth,
  showExplored,
  setShowExplored,
  hasExploredData,
  ...props
}) => {
  const { fullScreen } = useFullScreen();
  const { formatMessage } = useIntl();
  const wrapperRef = useRef(null);

  const toggleExpanded = useCallback(expanded => {
    const container = wrapperRef.current?.closest('.leaflet-control-layers');
    if (container) {
      container.classList.toggle('leaflet-control-layers-expanded', expanded);
    }
  }, []);

  useEffect(() => () => toggleExpanded(false), [toggleExpanded]);

  useEffect(() => {
    const handleClickOutside = e => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        toggleExpanded(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () =>
      document.removeEventListener('pointerdown', handleClickOutside);
  }, [toggleExpanded]);

  return (
    <CustomControl
      {...props}
      containerClassName="leaflet-control-layers leaflet-control">
      <div
        ref={wrapperRef}
        onMouseEnter={() => !fullScreen && toggleExpanded(true)}
        onMouseLeave={() => toggleExpanded(false)}>
        <ControlToggleButton
          type="button"
          className="leaflet-control-layers-toggle"
          title={formatMessage({ id: 'data-control' })}
          aria-label={formatMessage({ id: 'data-control' })}
          disabled={fullScreen}
          data-tour="data-control-toggle"
          onClick={() => toggleExpanded(true)}>
          <VisibilityIcon
            sx={{ color: theme => theme.palette.mapControlIcon }}
          />
        </ControlToggleButton>

        <section className="leaflet-control-layers-list">
          <div className="leaflet-control-layers-overlays">
            <ControlSectionTitle>
              {formatMessage({ id: 'Data display' }).toUpperCase()}
            </ControlSectionTitle>
            {LAYER_TYPES_LIST.map(type => (
              <ControlOptionLabel key={type}>
                <input
                  type="checkbox"
                  name={type}
                  checked={!!selectedLayers[type]}
                  onChange={() => toggleLayer(type)}
                />
                <MarkerIcon type={type} />
                <span style={{ textTransform: 'capitalize' }}>
                  {formatMessage({ id: type })}
                </span>
              </ControlOptionLabel>
            ))}

            {isAuth && (
              <div
                style={
                  hasExploredData === false ? { opacity: 0.5 } : undefined
                }>
                <ControlOptionLabel>
                  <input
                    type="checkbox"
                    name="exploredCaves"
                    disabled={hasExploredData === false}
                    checked={showExplored && hasExploredData !== false}
                    onChange={() => setShowExplored(prev => !prev)}
                  />
                  <ExploredBadgeIcon />
                  <span>{formatMessage({ id: 'My explored entrances' })}</span>
                </ControlOptionLabel>
                {hasExploredData === false && (
                  <div
                    style={{
                      fontSize: 11,
                      fontStyle: 'italic',
                      color: '#666',
                      padding: '2px 0 4px'
                    }}>
                    {formatMessage({ id: 'No explored entrances yet' })}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </CustomControl>
  );
};

const MemoizedDataDisplayControl = React.memo(DataDisplayControl);

DataDisplayControl.propTypes = {
  selectedLayers: PropTypes.objectOf(PropTypes.bool).isRequired,
  toggleLayer: PropTypes.func.isRequired,
  isAuth: PropTypes.bool,
  showExplored: PropTypes.bool,
  setShowExplored: PropTypes.func,
  hasExploredData: PropTypes.oneOf([true, false, null]),
  ...customControlProps
};

MemoizedDataDisplayControl.propTypes = DataDisplayControl.propTypes;

export default MemoizedDataDisplayControl;
