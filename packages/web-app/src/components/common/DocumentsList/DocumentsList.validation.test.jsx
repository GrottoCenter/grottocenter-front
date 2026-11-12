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

describe('DocumentsList validation label', () => {
  it('labels non-validated documents neutrally', () => {
    renderDocument({ isValidated: false });

    expect(screen.getByText('Not validated')).toBeVisible();
    expect(
      screen.queryByText('Waiting for validation')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Awaiting validation')).not.toBeInTheDocument();
  });

  it.each([
    ['validated', { isValidated: true }],
    ['without validation information', {}]
  ])('omits the validation label for documents %s', (_status, validation) => {
    renderDocument(validation);

    expect(screen.getByRole('link', { name: 'Cave survey' })).toBeVisible();
    expect(screen.queryByText('Not validated')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Waiting for validation')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Awaiting validation')).not.toBeInTheDocument();
  });
});
