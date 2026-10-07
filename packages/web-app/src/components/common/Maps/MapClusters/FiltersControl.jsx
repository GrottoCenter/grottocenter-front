import React, { useEffect, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { Popover, Rating, Button } from '@mui/material';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
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
  INTEREST_STAR_COLOR,
  interestToStars,
  starsToInterest
} from '../../../../utils/interest';
import {
  ControlToggleButton,
  ControlSectionTitle,
  ControlOptionLabel
} from './controlStyles';

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

// Small orange dot signaling "at least one filter is not at its default value".
// Warning colour rather than error: this is a notice, not an alarm — a filter
// being active is normal. Pointer-events off so it never steals the click meant
// for the toggle button.
const ActiveFiltersDot = styled('span')(({ theme }) => ({
  position: 'absolute',
  top: 4,
  right: 4,
  width: 11,
  height: 11,
  borderRadius: '50%',
  background: theme.palette.warning.main,
  border: `1.5px solid ${theme.palette.background.paper}`,
  pointerEvents: 'none'
}));

const PopoverContent = styled('div')`
  padding: 8px 12px;
  font-size: 13px;
  max-width: 260px;
`;

// Row hosting the interest Rating widget. Wraps so the "Any rating" hint drops
// under the stars on narrow panels instead of pushing them off — the stars are
// deliberately larger on mobile (see fontSize prop below).
const InterestRow = styled('div')`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  column-gap: 10px;
  row-gap: 2px;
  padding: 4px 4px 2px;
`;

const InterestHint = styled('span')`
  font-size: 12px;
  font-style: italic;
  color: #666;
  white-space: nowrap;
`;

const DisabledOverlayHint = styled('div')`
  font-size: 11px;
  font-style: italic;
  color: #666;
  padding: 4px 0 2px;
`;

const ResetAllRow = styled('div')`
  display: flex;
  justify-content: flex-end;
  padding: 6px 0 2px;
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

// Backend "aestheticism" is a 0–10 average. The filter uses half-star steps,
// matching the stars displayed in the popup and in comment ratings.
const MAX_STARS = 5;
const FiltersControl = ({
  entranceFilters,
  activeEntranceFilters,
  setActiveEntranceFilters,
  qualityFilters,
  activeQualityFilters,
  setActiveQualityFilters,
  minInterest,
  setMinInterest,
  isMarkersMode,
  isEntrancesLayerOn,
  hasActiveFilters,
  resetAllFilters,
  ...props
}) => {
  const { fullScreen } = useFullScreen();
  const { formatMessage } = useIntl();
  const wrapperRef = useRef(null);
  const [sizeInfoAnchor, setSizeInfoAnchor] = useState(null);
  const [interestInfoAnchor, setInterestInfoAnchor] = useState(null);

  // Close info popovers when the surrounding filters become inactive — the
  // anchor element goes away and MUI would otherwise reopen the popover with a
  // stale reference on next mount.
  useEffect(() => {
    if (!isMarkersMode || !isEntrancesLayerOn) {
      setSizeInfoAnchor(null);
      setInterestInfoAnchor(null);
    }
  }, [isMarkersMode, isEntrancesLayerOn]);

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

  const filtersDisabled = !isMarkersMode || !isEntrancesLayerOn;
  let disabledReasonKey;
  if (!isMarkersMode) {
    disabledReasonKey = hasActiveFilters
      ? 'Zoom in to apply saved filters'
      : 'Zoom in to enable filters';
  } else {
    disabledReasonKey = hasActiveFilters
      ? 'Turn on entrances to apply saved filters'
      : 'Turn on entrances to enable filters';
  }

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
          title={formatMessage({ id: 'filters-control' })}
          aria-label={formatMessage({ id: 'filters-control' })}
          disabled={fullScreen}
          data-tour="filters-control-toggle"
          onClick={() => toggleExpanded(true)}>
          <FilterAltIcon
            sx={{ color: theme => theme.palette.mapControlIcon }}
          />
          {hasActiveFilters && <ActiveFiltersDot />}
        </ControlToggleButton>

        <section className="leaflet-control-layers-list">
          <div className="leaflet-control-layers-overlays">
            {filtersDisabled && (
              <DisabledOverlayHint>
                {formatMessage({ id: disabledReasonKey })}
              </DisabledOverlayHint>
            )}

            <div
              style={
                filtersDisabled
                  ? { opacity: 0.5, pointerEvents: 'none' }
                  : undefined
              }>
              <ControlSectionTitle>
                {formatMessage({ id: 'Filter by size' }).toUpperCase()}
                <HelpOutlineOutlinedIcon
                  fontSize="small"
                  sx={{ cursor: 'pointer', color: 'text.secondary' }}
                  onClick={e => setSizeInfoAnchor(e.currentTarget)}
                />
              </ControlSectionTitle>
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
                <ControlOptionLabel key={filter.id}>
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
                </ControlOptionLabel>
              ))}

              <ControlSectionTitle>
                {formatMessage({ id: 'Filter by quality' }).toUpperCase()}
                <DataQualityHelpButton />
              </ControlSectionTitle>
              {qualityFilters.map(filter => (
                <ControlOptionLabel key={filter.id}>
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
                </ControlOptionLabel>
              ))}

              <ControlSectionTitle>
                {formatMessage({ id: 'Filter by interest' }).toUpperCase()}
                <HelpOutlineOutlinedIcon
                  fontSize="small"
                  sx={{ cursor: 'pointer', color: 'text.secondary' }}
                  onClick={e => setInterestInfoAnchor(e.currentTarget)}
                />
              </ControlSectionTitle>
              <Popover
                open={Boolean(interestInfoAnchor)}
                anchorEl={interestInfoAnchor}
                onClose={() => setInterestInfoAnchor(null)}
                anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
                transformOrigin={{ vertical: 'center', horizontal: 'left' }}>
                <PopoverContent>
                  {formatMessage({ id: 'Filter by interest help' })}
                </PopoverContent>
              </Popover>
              <InterestRow>
                <Rating
                  max={MAX_STARS}
                  precision={0.5}
                  value={interestToStars(minInterest)}
                  // MUI Rating fires with `null` when the user clicks the
                  // currently-active star (native "clear" gesture). That maps
                  // to "no min" — same effect as picking `Any rating`.
                  onChange={(_, newValue) =>
                    setMinInterest(
                      newValue == null ? 0 : starsToInterest(newValue)
                    )
                  }
                  aria-label={formatMessage({ id: 'Minimum rating' })}
                  // Target the SvgIcon directly rather than the Rating root's
                  // font-size: MuiRating-sizeMedium sets the root font-size via
                  // a themed class that wins over a plain sx `fontSize`, and
                  // the icons only inherit from the root. Sizing the icons
                  // directly bypasses that ordering. xs bump clears WCAG's
                  // 44×44 touch-target minimum with MUI Rating's own padding.
                  sx={{
                    color: INTEREST_STAR_COLOR,
                    '& .MuiSvgIcon-root': {
                      fontSize: { xs: 32, sm: 28 }
                    }
                  }}
                />
                {minInterest === 0 && (
                  <InterestHint>
                    {formatMessage({ id: 'Any rating' })}
                  </InterestHint>
                )}
              </InterestRow>
            </div>

            {hasActiveFilters && (
              <ResetAllRow>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<RestartAltIcon />}
                  onClick={resetAllFilters}
                  sx={{ fontSize: 12 }}>
                  {formatMessage({ id: 'Reset all filters' })}
                </Button>
              </ResetAllRow>
            )}
          </div>
        </section>
      </div>
    </CustomControl>
  );
};

const MemoizedFiltersControl = React.memo(FiltersControl);

FiltersControl.propTypes = {
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
  minInterest: PropTypes.number.isRequired,
  setMinInterest: PropTypes.func.isRequired,
  isMarkersMode: PropTypes.bool.isRequired,
  isEntrancesLayerOn: PropTypes.bool.isRequired,
  hasActiveFilters: PropTypes.bool.isRequired,
  resetAllFilters: PropTypes.func.isRequired,
  ...customControlProps
};

MemoizedFiltersControl.propTypes = FiltersControl.propTypes;

export default MemoizedFiltersControl;
