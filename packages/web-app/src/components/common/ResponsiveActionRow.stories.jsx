import { Button, Tooltip } from '@mui/material';
import ResponsiveActionRow from './ResponsiveActionRow';

export default {
  title: 'Common/ResponsiveActionRow',
  component: ResponsiveActionRow
};

export const Default = {
  render: () => (
    <ResponsiveActionRow>
      <Button variant="outlined">Cancel</Button>
      <Button variant="contained">Save changes</Button>
    </ResponsiveActionRow>
  )
};

export const WrappedUnavailableAction = {
  render: () => (
    <ResponsiveActionRow>
      <Button variant="outlined">Keep editing</Button>
      <Tooltip title="Unavailable offline">
        <span>
          <Button variant="contained" disabled>
            Save all changes to the entrance
          </Button>
        </span>
      </Tooltip>
    </ResponsiveActionRow>
  )
};
