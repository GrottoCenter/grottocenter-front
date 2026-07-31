import React, { useEffect, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { Popover } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useIntl } from 'react-intl';
import { useFullScreen } from 'react-browser-hooks';

import CustomControl, { customControlProps } from '../common/CustomControl';
import {
  CAVE_SIZE,
  CAVE_SIZE_STYLE,
  CAVE_SIZE_THRESHOLDS,
  CAVE_QUALITY_BADGE_VALUE
} from './constants';
import DataQualityBadge from '../../DataQualityBadge';
import DataQualityHelpButton from '../../DataQualityBadge/DataQualityHelpButton';
import {
  entranceIcon,
  networkIcon,
  organizationIcon,
  massifIcon
} from '../../../../assets/icons';
import { EXPLORED_PIN_PATH } from './ExploredOverlay';

const CAVE_SIZE_POPOVER_ROWS = [
  {
    id: CAVE_SIZE.SMALL,
    labelKey: 'Small caves',
    messageKey: 'cave size small threshold',
    thresholds: CAVE_SIZE_THRESHOLDS.MEDIUM
  },
  {
    id: CAVE_SIZE.MEDIUM,
    labelKey: 'Medium caves',
    messageKey: 'cave size medium threshold',
    thresholds: CAVE_SIZE_THRESHOLDS.MEDIUM
  },
  {
    id: CAVE_SIZE.LARGE,
    labelKey: 'Large caves',
    messageKey: 'cave size large threshold',
    thresholds: CAVE_SIZE_THRESHOLDS.LARGE
  }
];

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

const ToggleButton = styled('button')`
  appearance: none;
  background: none;
  border: none;
  margin: 0;
  padding: 0;
  width: 36px;
  height: 36px;
  background-image: none !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }

  .leaflet-control-layers-expanded & {
    display: none !important;
  }
`;

const SectionTitle = styled('div')(({ theme }) => ({
  fontWeight: 'bold',
  fontSize: 12,
  padding: '4px 0 2px',
  color: theme.palette.text.primary,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  '&:not(:first-of-type)': {
    marginTop: 6
  }
}));

const PopoverContent = styled('div')`
  padding: 8px 12px;
  font-size: 13px;
`;

const OptionLabel = styled('label')`
  display: flex !important;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  cursor: pointer;
  padding: 2px 0;
  white-space: nowrap;

  input {
    margin: 8px;
    flex-shrink: 0;
  }
`;

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

const CaveSizeDot = ({ caveSize }) => {
  const { radius, fillColor, color, weight } = CAVE_SIZE_STYLE[caveSize];
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 32 32"
      style={{ flexShrink: 0, marginRight: 4 }}>
      <circle
        cx="16"
        cy="16"
        r={radius}
        fill={fillColor}
        stroke={color}
        strokeWidth={weight}
      />
    </svg>
  );
};

CaveSizeDot.propTypes = {
  caveSize: PropTypes.string.isRequired
};

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

const DataControl = ({
  selectedLayers,
  toggleLayer,
  entranceFilters,
  activeEntranceFilters,
  setActiveEntranceFilters,
  qualityFilters,
  activeQualityFilters,
  setActiveQualityFilters,
  isMarkersMode,
  isAuth,
  showExplored,
  setShowExplored,
  hasExploredData,
  ...props
}) => {
  const { fullScreen } = useFullScreen();
  const { formatMessage } = useIntl();
  const wrapperRef = useRef(null);
  const [sizeInfoAnchor, setSizeInfoAnchor] = useState(null);

  // Close the size info popover when leaving markers mode — the anchor element
  // disappears and MUI would otherwise reopen it with a stale reference on next mount.
  useEffect(() => {
    if (!isMarkersMode) setSizeInfoAnchor(null);
  }, [isMarkersMode]);

  const toggleExpanded = useCallback(expanded => {
    const container = wrapperRef.current?.closest('.leaflet-control-layers');
    if (container) {
      container.classList.toggle('leaflet-control-layers-expanded', expanded);
    }
  }, []);

  // Remove expanded class on unmount
  useEffect(() => {
    return () => toggleExpanded(false);
  }, [toggleExpanded]);

  // Close panel when touching outside on mobile
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

  const handleLayerToggle = type => toggleLayer(type);

  return (
    <CustomControl
      {...props}
      containerClassName="leaflet-control-layers leaflet-control">
      <div
        ref={wrapperRef}
        onMouseEnter={() => !fullScreen && toggleExpanded(true)}
        onMouseLeave={() => toggleExpanded(false)}>
        <ToggleButton
          type="button"
          className="leaflet-control-layers-toggle"
          title={formatMessage({ id: 'data-control' })}
          aria-label={formatMessage({ id: 'data-control' })}
          disabled={fullScreen}
          data-tour="data-control-toggle"
          onClick={() => toggleExpanded(true)}>
          <VisibilityIcon sx={{ color: theme => theme.palette.mapControlIcon }} />
        </ToggleButton>

        <section className="leaflet-control-layers-list">
          <div className="leaflet-control-layers-overlays">
            <SectionTitle>
              {formatMessage({ id: 'Data display' }).toUpperCase()}
            </SectionTitle>
            {LAYER_TYPES_LIST.map(type => (
              <OptionLabel key={type}>
                <input
                  type="checkbox"
                  name={type}
                  checked={!!selectedLayers[type]}
                  onChange={() => handleLayerToggle(type)}
                />
                <MarkerIcon type={type} />
                <span style={{ textTransform: 'capitalize' }}>
                  {formatMessage({ id: type })}
                </span>
              </OptionLabel>
            ))}

            {isAuth && (
              <div
                style={
                  hasExploredData === false ? { opacity: 0.5 } : undefined
                }>
                <OptionLabel>
                  <input
                    type="checkbox"
                    name="exploredCaves"
                    disabled={hasExploredData === false}
                    checked={showExplored && hasExploredData !== false}
                    onChange={() => setShowExplored(prev => !prev)}
                  />
                  <ExploredBadgeIcon />
                  <span>{formatMessage({ id: 'My explored entrances' })}</span>
                </OptionLabel>
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

            {selectedLayers[layerTypes.ENTRANCES] && (
              <div
                style={
                  !isMarkersMode
                    ? { opacity: 0.5, pointerEvents: 'none' }
                    : undefined
                }>
                {!isMarkersMode && (
                  <div
                    style={{
                      fontSize: 11,
                      fontStyle: 'italic',
                      color: '#666',
                      padding: '2px 0 4px'
                    }}>
                    {formatMessage({ id: 'Available in point view' })}
                  </div>
                )}
                <SectionTitle>
                  {formatMessage({ id: 'Filter by size' }).toUpperCase()}
                  <HelpOutlineIcon
                    fontSize="small"
                    sx={{ cursor: 'pointer', color: 'text.secondary' }}
                    onClick={e => setSizeInfoAnchor(e.currentTarget)}
                  />
                </SectionTitle>
                <Popover
                  open={Boolean(sizeInfoAnchor)}
                  anchorEl={sizeInfoAnchor}
                  onClose={() => setSizeInfoAnchor(null)}
                  anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'center', horizontal: 'left' }}>
                  <PopoverContent>
                    {CAVE_SIZE_POPOVER_ROWS.map(
                      ({ id, labelKey, messageKey, thresholds }) => (
                        <div key={id}>
                          <strong>{formatMessage({ id: labelKey })}</strong>
                          {`: ${formatMessage({ id: messageKey }, thresholds)}`}
                        </div>
                      )
                    )}
                  </PopoverContent>
                </Popover>
                {entranceFilters.map(filter => (
                  <OptionLabel key={filter.id}>
                    <input
                      type="checkbox"
                      name={filter.id}
                      checked={activeEntranceFilters[filter.id] ?? false}
                      onChange={() =>
                        setActiveEntranceFilters(prev => ({
                          ...prev,
                          [filter.id]: !prev[filter.id]
                        }))
                      }
                    />
                    <CaveSizeDot caveSize={filter.id} />
                    <span>{formatMessage({ id: filter.labelKey })}</span>
                  </OptionLabel>
                ))}

                <SectionTitle>
                  {formatMessage({ id: 'Filter by quality' }).toUpperCase()}
                  <DataQualityHelpButton />
                </SectionTitle>
                {qualityFilters.map(filter => (
                  <OptionLabel key={filter.id}>
                    <input
                      type="checkbox"
                      name={filter.id}
                      checked={activeQualityFilters[filter.id] ?? false}
                      onChange={() =>
                        setActiveQualityFilters(prev => ({
                          ...prev,
                          [filter.id]: !prev[filter.id]
                        }))
                      }
                    />
                    <DataQualityBadge
                      value={CAVE_QUALITY_BADGE_VALUE[filter.id]}
                      size={20}
                    />
                    <span>{formatMessage({ id: filter.labelKey })}</span>
                  </OptionLabel>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </CustomControl>
  );
};

const MemoizedDataControl = React.memo(DataControl);

DataControl.propTypes = {
  selectedLayers: PropTypes.objectOf(PropTypes.bool).isRequired,
  toggleLayer: PropTypes.func.isRequired,
  entranceFilters: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      labelKey: PropTypes.string.isRequired
    })
  ).isRequired,
  activeEntranceFilters: PropTypes.objectOf(PropTypes.bool).isRequired,
  setActiveEntranceFilters: PropTypes.func.isRequired,
  qualityFilters: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      labelKey: PropTypes.string.isRequired
    })
  ).isRequired,
  activeQualityFilters: PropTypes.objectOf(PropTypes.bool).isRequired,
  setActiveQualityFilters: PropTypes.func.isRequired,
  isMarkersMode: PropTypes.bool.isRequired,
  isAuth: PropTypes.bool,
  showExplored: PropTypes.bool,
  setShowExplored: PropTypes.func,
  hasExploredData: PropTypes.oneOf([true, false, null]),
  ...customControlProps
};

MemoizedDataControl.propTypes = DataControl.propTypes;

export default MemoizedDataControl;
