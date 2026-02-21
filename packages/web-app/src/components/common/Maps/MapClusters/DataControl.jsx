import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import {
  Menu,
  MenuItem,
  IconButton as MuiIconButton,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  FormGroup
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useIntl } from 'react-intl';
import { useFullScreen } from 'react-browser-hooks';

import CustomControl, { customControlProps } from '../common/CustomControl';

export const heatmapTypes = {
  ENTRANCES: 'entrances',
  NETWORKS: 'networks',
  NONE: 'none'
};
export const markerTypes = {
  ORGANIZATIONS: 'organizations'
};

const Wrapper = styled('div')`
  background: white;
`;

const IconButton = styled(MuiIconButton)`
  // override leaflet properties
  background-image: none !important;
  padding: 9px;
`;

const DataControl = ({
  updateHeatmap,
  selectedMarkers,
  setSelectedMarkers,
  ...props
}) => {
  const { fullScreen } = useFullScreen();
  const { formatMessage } = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedHeat, setSelectedHeat] = useState(heatmapTypes.ENTRANCES);

  const handleOpenMenu = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleHeatChange = selection => () => {
    setSelectedHeat(selection);
  };

  const handleMarkerChange = type => () => {
    setSelectedMarkers(prev => ({ ...prev, [type]: !prev[type] }));
  };

  useEffect(() => {
    updateHeatmap(selectedHeat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHeat]);
  return (
    <CustomControl {...props}>
      <Wrapper>
        <IconButton
          className="leaflet-control-layers-toggle"
          aria-label={formatMessage({ id: 'data-control' })}
          onMouseOver={handleOpenMenu}
          onClick={handleOpenMenu}
          // TODO enable on fullscreen as it's currently hidden
          disabled={fullScreen}
          size="large">
          <VisibilityIcon fontSize="inherit" />
        </IconButton>
      </Wrapper>
      <Menu
        container={() => document.getElementsByClassName('fullscreen')[0]}
        id="data-menu-selection"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        MenuListProps={{ onMouseLeave: handleClose }}>
        <MenuItem disabled>
          {formatMessage({ id: 'heat map' }).toUpperCase()}
        </MenuItem>
        <RadioGroup
          aria-label={formatMessage({ id: 'heatmap' })}
          name="heatmap"
          value={selectedHeat}>
          <MenuItem onClick={handleHeatChange(heatmapTypes.ENTRANCES)}>
            <FormControlLabel
              value={heatmapTypes.ENTRANCES}
              control={<Radio size="small" />}
              label={formatMessage({ id: heatmapTypes.ENTRANCES })}
            />
          </MenuItem>
          <MenuItem onClick={handleHeatChange(heatmapTypes.NETWORKS)}>
            <FormControlLabel
              value={heatmapTypes.NETWORKS}
              control={<Radio size="small" />}
              label={formatMessage({ id: heatmapTypes.NETWORKS })}
            />
          </MenuItem>
          <MenuItem onClick={handleHeatChange(heatmapTypes.NONE)}>
            <FormControlLabel
              value={heatmapTypes.NONE}
              control={<Radio size="small" />}
              label={formatMessage({ id: heatmapTypes.NONE })}
            />
          </MenuItem>
        </RadioGroup>
        <MenuItem disabled>
          {formatMessage({ id: 'markers' }).toUpperCase()}
        </MenuItem>
        <FormGroup>
          <MenuItem>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  name={markerTypes.ORGANIZATIONS}
                  checked={selectedMarkers[markerTypes.ORGANIZATIONS]}
                  onChange={handleMarkerChange(markerTypes.ORGANIZATIONS)}
                />
              }
              label={formatMessage({ id: markerTypes.ORGANIZATIONS })}
            />
          </MenuItem>
        </FormGroup>
      </Menu>
    </CustomControl>
  );
};

const MemoizedDataControl = React.memo(DataControl);

DataControl.propTypes = {
  updateHeatmap: PropTypes.func.isRequired,
  selectedMarkers: PropTypes.objectOf(PropTypes.bool).isRequired,
  setSelectedMarkers: PropTypes.func.isRequired,
  ...customControlProps
};

MemoizedDataControl.propTypes = DataControl.propTypes;

export default MemoizedDataControl;
