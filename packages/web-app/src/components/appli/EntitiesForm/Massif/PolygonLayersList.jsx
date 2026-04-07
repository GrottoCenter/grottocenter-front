import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  IconButton,
  Paper,
  Checkbox,
  Box,
  Typography,
  Tooltip,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const PolygonLayersList = ({
  layers,
  hoveredLayerId,
  onLayerClick,
  onLayerHover,
  onLayerUnhover,
  onLayerDelete,
  onLayerHoleToggle
}) => {
  const { formatMessage } = useIntl();

  if (layers.length === 0) return null;

  const allHoles = layers.every(l => l.isHole);
  const hasNeedles = layers.some(l => l.isNeedle);

  return (
    <Paper sx={{ width: 250, maxHeight: '70vh', overflow: 'auto' }}>
      {allHoles && (
        <Alert severity="error" sx={{ py: 0 }}>
          {formatMessage({
            id: 'At least one polygon must not be marked as a hole.'
          })}
        </Alert>
      )}
      {hasNeedles && (
        <Alert severity="warning" sx={{ py: 0 }}>
          {formatMessage({
            id: 'Some polygons are very thin or elongated. Check them before saving.'
          })}
        </Alert>
      )}
      <List
        dense
        subheader={
          <ListSubheader
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              lineHeight: '32px',
              py: '4px'
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              {formatMessage({ id: 'Polygon' })}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                pr: '4px'
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                {formatMessage({ id: 'Hole' })}
              </Typography>
              <Box sx={{ width: 28 }} />
            </Box>
          </ListSubheader>
        }
      >
        {[...layers]
          .sort((a, b) => b.latlngs.length - a.latlngs.length)
          .map(layer => (
            <ListItem
              key={layer.id}
              onClick={() => onLayerClick(layer.id)}
              onMouseEnter={() => onLayerHover(layer.id)}
              onMouseLeave={onLayerUnhover}
              sx={{
                bgcolor:
                  hoveredLayerId === layer.id ? 'action.hover' : 'transparent',
                cursor: 'pointer'
              }}
              secondaryAction={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Tooltip
                    title={formatMessage({
                      id: 'Mark this polygon as a hole (inner ring) within another polygon'
                    })}
                    arrow
                  >
                    <Checkbox
                      checked={layer.isHole || false}
                      onChange={e => {
                        e.stopPropagation();
                        onLayerHoleToggle(layer.id);
                      }}
                      size="small"
                      sx={{ p: 0 }}
                      inputProps={{
                        'aria-label': formatMessage({
                          id: 'Mark this polygon as a hole (inner ring) within another polygon'
                        })
                      }}
                    />
                  </Tooltip>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={e => {
                      e.stopPropagation();
                      onLayerDelete(layer.id);
                    }}
                    aria-label={formatMessage({ id: 'Delete' })}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    {layer.isNeedle && (
                      <Tooltip
                        title={formatMessage({
                          id: 'This polygon is very thin or elongated (needle shape). It may represent a stream corridor or narrow buffer. Verify it is intentional.'
                        })}
                        arrow
                      >
                        <WarningAmberIcon
                          fontSize="small"
                          color="warning"
                          sx={{ flexShrink: 0 }}
                        />
                      </Tooltip>
                    )}
                    {`${layer.latlngs.length} ${formatMessage({ id: 'vertices' })}${layer.isHole ? ` - ${formatMessage({ id: 'hole' })}` : ''}`}
                  </Box>
                }
                sx={{
                  fontStyle: layer.isHole ? 'italic' : 'normal',
                  opacity: layer.isHole ? 0.6 : 1
                }}
                slotProps={{
                  primary: { sx: { fontStyle: 'inherit' } }
                }}
              />
            </ListItem>
          ))}
      </List>
    </Paper>
  );
};

PolygonLayersList.propTypes = {
  layers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      latlngs: PropTypes.array.isRequired,
      isHole: PropTypes.bool,
      isNeedle: PropTypes.bool
    })
  ).isRequired,
  hoveredLayerId: PropTypes.number,
  onLayerClick: PropTypes.func.isRequired,
  onLayerHover: PropTypes.func.isRequired,
  onLayerUnhover: PropTypes.func.isRequired,
  onLayerDelete: PropTypes.func.isRequired,
  onLayerHoleToggle: PropTypes.func.isRequired
};

export default PolygonLayersList;
