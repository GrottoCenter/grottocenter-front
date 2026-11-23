import { screen } from '@testing-library/react';

import renderWithProviders from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import DocumentSnapshots from './DocumentSnapshots';

it.each([
  ['pending', 'Awaiting validation'],
  ['modificationPending', 'Awaiting re-validation'],
  ['rejected', 'Rejected']
])(
  'uses the historical version status %s and preserves its moderation metadata',
  (validationStatus, label) => {
    renderWithProviders(
      <DocumentSnapshots
        document={{
          validationStatus,
          isValidated: true,
          validator: { id: 9, nickname: 'Moderator' },
          validatorComment: 'Historical decision reason',
          dateValidation: '2026-01-01T12:00:00Z'
        }}
      />,
      { messages }
    );
    expect(screen.getByTestId('document-validation-badge')).toHaveTextContent(
      label
    );
    expect(screen.getByText('Moderator')).toBeVisible();
    expect(screen.getByText('Historical decision reason')).toBeVisible();
    expect(screen.getByText('Validation date')).toBeVisible();
  }
);

it.each(['validated', undefined, 'future'])(
  'shows no badge for snapshot status %s',
  validationStatus => {
    renderWithProviders(
      <DocumentSnapshots document={{ validationStatus, isValidated: false }} />,
      { messages }
    );
    expect(
      screen.queryByTestId('document-validation-badge')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Not validated')).not.toBeInTheDocument();
    expect(screen.queryByText('Validated')).not.toBeInTheDocument();
  }
);
