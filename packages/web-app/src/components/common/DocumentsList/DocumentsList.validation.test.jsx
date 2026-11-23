import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import messages from '@/../public/lang/en.json';
import renderWithProviders from '@/test/renderWithProviders';
import DocumentsList from './DocumentsList';

const renderDocument = validation =>
  renderWithProviders(
    <MemoryRouter>
      <DocumentsList
        documents={[{ id: 1, title: 'Cave survey', ...validation }]}
      />
    </MemoryRouter>,
    { messages }
  );

it.each([
  ['pending', 'Awaiting validation'],
  ['modificationPending', 'Awaiting re-validation'],
  ['rejected', 'Rejected']
])(
  'uses the API status %s even when legacy fields disagree',
  (validationStatus, label) => {
    renderDocument({ validationStatus, isValidated: true });
    expect(screen.getByTestId('document-validation-badge')).toHaveTextContent(
      label
    );
    expect(screen.queryByText('Not validated')).not.toBeInTheDocument();
  }
);

it.each(['validated', undefined, 'future'])(
  'omits the badge for %s without falling back to legacy moderation fields',
  validationStatus => {
    renderDocument({
      validationStatus,
      isValidated: false,
      validator: { id: 9 },
      dateValidation: '2026-01-01'
    });
    expect(screen.getByRole('link', { name: 'Cave survey' })).toBeVisible();
    expect(
      screen.queryByTestId('document-validation-badge')
    ).not.toBeInTheDocument();
  }
);
