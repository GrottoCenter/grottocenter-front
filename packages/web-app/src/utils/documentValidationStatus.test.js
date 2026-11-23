import {
  getDocumentModerationStatus,
  getDocumentValidationBadge
} from './documentValidationStatus';

describe('getDocumentModerationStatus', () => {
  it.each(['pending', 'modificationPending', 'rejected', 'validated'])(
    'uses the explicit API status %s independently of legacy metadata',
    validationStatus => {
      expect(
        getDocumentModerationStatus({
          validationStatus,
          isValidated: true,
          dateValidation: 'invalid',
          validator: { id: 9 }
        })
      ).toBe(validationStatus);
    }
  );

  it.each([undefined, null, 'future'])(
    'keeps status %s unknown instead of inferring a decision',
    validationStatus => {
      expect(
        getDocumentModerationStatus({
          validationStatus,
          isValidated: false,
          dateValidation: '2026-01-01'
        })
      ).toBe('unknown');
    }
  );

  it.each([undefined, null])('accepts a missing document %s', document => {
    expect(getDocumentModerationStatus(document)).toBe('unknown');
  });
});

describe('getDocumentValidationBadge', () => {
  it.each([
    ['pending', 'Awaiting validation', 'warning', 'warning'],
    ['modificationPending', 'Awaiting re-validation', 'info', 'info'],
    ['rejected', 'documentValidation.rejected', 'error', 'error']
  ])(
    'provides the label, badge color and notice severity for %s',
    (validationStatus, label, color, severity) => {
      expect(getDocumentValidationBadge(validationStatus)).toEqual({
        label,
        color,
        severity
      });
    }
  );

  it.each(['validated', undefined, null, 'future', 'constructor', 'toString'])(
    'returns no badge for %s',
    validationStatus => {
      expect(getDocumentValidationBadge(validationStatus)).toBeNull();
    }
  );
});
