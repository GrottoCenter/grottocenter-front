import { Typography } from '@mui/material';
import AppLink from './AppLink';
import DuplicateMergeResult from './DuplicateMergeResult';

export default {
  title: 'Common/DuplicateMergeResult',
  component: DuplicateMergeResult,
  args: {
    onAcknowledge: () => {},
    children: (
      <Typography sx={{ fontWeight: 600 }}>
        The author Unknown (#37330) was deleted and its references were
        transferred to <AppLink to="/ui/persons/33">Unknown (#33)</AppLink>.
      </Typography>
    )
  }
};

export const Completed = {};
export const Disabled = { args: { isDisabled: true } };
