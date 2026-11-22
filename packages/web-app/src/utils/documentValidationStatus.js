export const DOCUMENT_VALIDATION_STATUSES = [
  'pending',
  'modificationPending',
  'rejected',
  'validated'
];

const BADGES = {
  pending: {
    label: 'Awaiting validation',
    color: 'warning',
    severity: 'warning'
  },
  modificationPending: {
    label: 'Awaiting re-validation',
    color: 'info',
    severity: 'info'
  },
  rejected: {
    label: 'documentValidation.rejected',
    color: 'error',
    severity: 'error'
  }
};

// Partial responses and older indexes can omit the read-only API status.
export const getDocumentModerationStatus = document =>
  DOCUMENT_VALIDATION_STATUSES.includes(document?.validationStatus)
    ? document.validationStatus
    : 'unknown';

export const getDocumentValidationBadge = validationStatus =>
  Object.hasOwn(BADGES, validationStatus) ? BADGES[validationStatus] : null;
