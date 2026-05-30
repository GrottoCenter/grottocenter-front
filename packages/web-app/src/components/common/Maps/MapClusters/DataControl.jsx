import React, { useEffect, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { Popover } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useIntl } from 'react-intl';
import { useFullScreen } from 'react-browser-hooks';

import CustomControl, { customControlProps } from '../common/CustomControl';
import { CAVE_SIZE, CAVE_SIZE_STYLE, CAVE_SIZE_THRESHOLDS, CAVE_QUALITY_BADGE_VALUE } from './constants';
import DataQualityBadge from '../../DataQualityBadge';
import {
  entranceIcon,
  networkIcon,
  organizationIcon,
  massifIcon
} from '../../../../assets/icons';

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

export const heatmapTypes = {
  ENTRANCES: 'entrances',
  NETWORKS: 'networks',
  MASSIFS: 'massifs'
};
export const markerTypes = {
  ORGANIZATIONS: 'organizations'
};

const HEAT_TYPES_LIST = [
  heatmapTypes.ENTRANCES,
  heatmapTypes.NETWORKS,
  heatmapTypes.MASSIFS
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
  [heatmapTypes.ENTRANCES]: entranceIcon,
  [heatmapTypes.NETWORKS]: networkIcon,
  [heatmapTypes.MASSIFS]: massifIcon,
  [markerTypes.ORGANIZATIONS]: organizationIcon
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
  updateHeatmap,
  selectedHeats,
  selectedMarkers,
  setSelectedMarkers,
  entranceFilters,
  activeEntranceFilters,
  setActiveEntranceFilters,
  qualityFilters,
  activeQualityFilters,
  setActiveQualityFilters,
  isMarkersMode,
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

  const handleHeatToggle = type => {
    updateHeatmap(type, !selectedHeats.has(type));
  };

  const handleMarkerChange = type => {
    setSelectedMarkers(prev => ({ ...prev, [type]: !prev[type] }));
  };

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
          <VisibilityIcon color="action" />
        </ToggleButton>

        <section className="leaflet-control-layers-list">
          <div className="leaflet-control-layers-overlays">
            <SectionTitle>
              {formatMessage({ id: 'Data display' }).toUpperCase()}
            </SectionTitle>
            {HEAT_TYPES_LIST.map(type => (
              <OptionLabel key={type}>
                <input
                  type="checkbox"
                  name={type}
                  checked={selectedHeats.has(type)}
                  onChange={() => handleHeatToggle(type)}
                />
                <MarkerIcon type={type} />
                <span style={{ textTransform: 'capitalize' }}>
                  {formatMessage({ id: type })}
                </span>
              </OptionLabel>
            ))}

            <hr
              style={{
                margin: '6px 0',
                border: 'none',
                borderTop: '1px solid #ddd'
              }}
            />

            <OptionLabel>
              <input
                type="checkbox"
                name={markerTypes.ORGANIZATIONS}
                checked={selectedMarkers[markerTypes.ORGANIZATIONS]}
                onChange={() => handleMarkerChange(markerTypes.ORGANIZATIONS)}
              />
              <MarkerIcon type={markerTypes.ORGANIZATIONS} />
              <span style={{ textTransform: 'capitalize' }}>
                {formatMessage({ id: markerTypes.ORGANIZATIONS })}
              </span>
            </OptionLabel>

            {selectedHeats.has(heatmapTypes.ENTRANCES) && isMarkersMode && (
              <>
                <SectionTitle>
                  {formatMessage({ id: 'Filter by size' }).toUpperCase()}
                  <InfoOutlinedIcon
                    sx={{ fontSize: 13, cursor: 'pointer', color: 'text.secondary' }}
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
                    {CAVE_SIZE_POPOVER_ROWS.map(({ id, labelKey, messageKey, thresholds }) => (
                      <div key={id}>
                        <strong>{formatMessage({ id: labelKey })}</strong>
                        {`: ${formatMessage({ id: messageKey }, thresholds)}`}
                      </div>
                    ))}
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
              </>
            )}
          </div>
        </section>
      </div>
    </CustomControl>
  );
};

const MemoizedDataControl = React.memo(DataControl);

DataControl.propTypes = {
  updateHeatmap: PropTypes.func.isRequired,
  selectedHeats: PropTypes.instanceOf(Set).isRequired,
  selectedMarkers: PropTypes.objectOf(PropTypes.bool).isRequired,
  setSelectedMarkers: PropTypes.func.isRequired,
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
  ...customControlProps
};

MemoizedDataControl.propTypes = DataControl.propTypes;

export default MemoizedDataControl;
