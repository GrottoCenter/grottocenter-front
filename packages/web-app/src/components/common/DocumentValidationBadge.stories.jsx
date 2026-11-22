import { Box } from '@mui/material';

import { DOCUMENT_VALIDATION_STATUSES } from '@/utils/documentValidationStatus';
import DocumentValidationBadge from './DocumentValidationBadge';

const meta = {
  title: 'Common/DocumentValidationBadge',
  component: DocumentValidationBadge,
  argTypes: {
    validationStatus: {
      control: 'select',
      options: DOCUMENT_VALIDATION_STATUSES
    }
  }
};
export default meta;

export const Pending = { args: { validationStatus: 'pending' } };
export const ModificationPending = {
  args: { validationStatus: 'modificationPending' }
};
export const Rejected = { args: { validationStatus: 'rejected' } };
export const Validated = { args: { validationStatus: 'validated' } };
export const MissingStatus = {};
export const UnknownStatus = { args: { validationStatus: 'future' } };
export const Narrow = {
  args: { validationStatus: 'modificationPending' },
  render: args => (
    <Box sx={{ width: 120 }}>
      <DocumentValidationBadge validationStatus={args.validationStatus} />
    </Box>
  )
};
