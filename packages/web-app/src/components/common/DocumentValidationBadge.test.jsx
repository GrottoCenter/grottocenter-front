import { screen } from '@testing-library/react';

import renderWithProviders from '@/test/renderWithProviders';
import messages from '@/../public/lang/fr.json';
import DocumentValidationBadge from './DocumentValidationBadge';

it.each([
  ['pending', 'En attente de validation', 'warning'],
  ['modificationPending', 'En attente de re-validation', 'info'],
  ['rejected', 'Refusé', 'error']
])(
  'renders %s as an outlined badge with its French label',
  (validationStatus, label, color) => {
    renderWithProviders(
      <DocumentValidationBadge validationStatus={validationStatus} />,
      { messages, locale: 'fr' }
    );
    const badge = screen.getByTestId('document-validation-badge');
    expect(badge).toHaveTextContent(label);
    expect(badge).toHaveClass(
      'MuiChip-outlined',
      `MuiChip-color${color[0].toUpperCase()}${color.slice(1)}`
    );
    expect(badge.tagName).toBe('SPAN');
  }
);

it.each(['validated', undefined, null, 'future', 'constructor', 'toString'])(
  'renders no badge for %s',
  validationStatus => {
    const { container } = renderWithProviders(
      <DocumentValidationBadge validationStatus={validationStatus} />,
      { messages }
    );
    expect(container).toBeEmptyDOMElement();
  }
);
