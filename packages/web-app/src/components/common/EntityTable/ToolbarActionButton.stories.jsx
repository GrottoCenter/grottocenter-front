import { Box } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import ViewListIcon from '@mui/icons-material/ViewList';

import ToolbarActionButton from './ToolbarActionButton';

const meta = {
  title: 'EntityTable/ToolbarActionButton',
  component: ToolbarActionButton,
  args: { icon: FileDownloadIcon, onClick: () => {} },
  argTypes: { icon: { control: false }, endIcon: { control: false } }
};
export default meta;

export const Labelled = {
  args: { label: 'Export to CSV' }
};

export const IconOnly = {
  args: { tooltip: 'Export to CSV' }
};

export const Disabled = {
  args: {
    label: 'Export to CSV',
    disabled: true,
    tooltip: 'Export unavailable above 10 000 results'
  }
};

// The point of the component: a row of controls built from different icons and
// label states still lines up on one height and one border.
export const Cluster = {
  render: () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <ToolbarActionButton
        icon={FileDownloadIcon}
        label="Export to CSV"
        onClick={() => {}}
      />
      <ToolbarActionButton
        icon={ViewColumnIcon}
        label="Change columns"
        onClick={() => {}}
      />
      <ToolbarActionButton
        icon={ViewListIcon}
        tooltip="Card view"
        onClick={() => {}}
      />
    </Box>
  )
};
