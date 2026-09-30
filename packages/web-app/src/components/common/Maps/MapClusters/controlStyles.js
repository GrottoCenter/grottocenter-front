import { styled } from '@mui/material/styles';

// Shared styled parts of the hover-expand Leaflet controls in this folder
// (DataDisplayControl, FiltersControl). Both wrap a 36×36 toggle button and a
// list of "SectionTitle → OptionLabel row" panels, and the visual has to stay
// identical for the two controls to read as siblings on the map.

// `position: relative` is here so a control can absolutely-position an
// indicator (see the "active filters" dot in FiltersControl). Cost is nil when
// no such child exists.
export const ControlToggleButton = styled('button')`
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
  position: relative;

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }

  .leaflet-control-layers-expanded & {
    display: none !important;
  }
`;

export const ControlSectionTitle = styled('div')(({ theme }) => ({
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

export const ControlOptionLabel = styled('label')`
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
