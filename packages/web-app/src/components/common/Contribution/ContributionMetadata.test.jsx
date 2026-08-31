import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';

import ContributionMetadata from './ContributionMetadata';

const messages = {
  'author.by': '{verb} by',
  Created: 'Created',
  Updated: 'Updated',
  Language: 'Language'
};

const renderMetadata = props =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <MemoryRouter>
        <ContributionMetadata {...props} />
      </MemoryRouter>
    </IntlProvider>
  );

describe('ContributionMetadata', () => {
  it('renders linked contributors, dates and an object language', () => {
    const { container } = renderMetadata({
      createdBy: { id: 1, nickname: 'Paul' },
      createdAt: '2026-05-12T09:30:00.000Z',
      updatedBy: { id: 2, nickname: 'Jane' },
      updatedAt: '2026-08-10T09:30:00.000Z',
      language: { id: 'eng', name: 'English' },
      creationVerb: 'Created'
    });

    expect(screen.getByRole('link', { name: 'Paul' })).toHaveAttribute(
      'href',
      '/ui/persons/1'
    );
    expect(screen.getByRole('link', { name: 'Jane' })).toHaveAttribute(
      'href',
      '/ui/persons/2'
    );
    expect(container.firstChild).toHaveTextContent(
      /Created by Paul .* · Updated by Jane .* · Language : ENG/
    );
  });

  it('renders nothing without attribution metadata', () => {
    const { container } = renderMetadata({});

    expect(container).toBeEmptyDOMElement();
  });
});
