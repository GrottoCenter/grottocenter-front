import { screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';

import grottoTheme from '@/conf/grottoTheme';
import renderWithProviders from '@/test/renderWithProviders';
import messages from '@/../public/lang/fr.json';
import DocumentValidationBadge from './DocumentValidationBadge';

it.each([
  ['pending', 'En attente de validation', 'warning', 'HourglassEmptyIcon'],
  [
    'modificationPending',
    'En attente de re-validation',
    'info',
    'HourglassEmptyIcon'
  ],
  ['rejected', 'Refusé', 'error', 'CloseIcon']
])(
  'renders %s as an outlined badge with its French label',
  (validationStatus, label, color, icon) => {
    renderWithProviders(
      <ThemeProvider theme={grottoTheme}>
        <DocumentValidationBadge validationStatus={validationStatus} />
      </ThemeProvider>,
      { messages, locale: 'fr' }
    );
    const badge = screen.getByTestId('document-validation-badge');
    expect(badge).toHaveTextContent(label);
    expect(badge).toHaveStyle({ color: grottoTheme.palette[color].main });
    expect(badge).toHaveClass(
      'MuiChip-outlined',
      `MuiChip-color${color[0].toUpperCase()}${color.slice(1)}`
    );
    expect(badge.tagName).toBe('SPAN');
    expect(screen.getByTestId(icon)).toHaveAttribute('aria-hidden', 'true');
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
