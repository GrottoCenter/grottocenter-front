import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import WizardProgress from './WizardProgress';

const mockUseIsDesktopLayout = vi.fn();

vi.mock('@/hooks/useIsDesktopLayout', () => ({
  useIsDesktopLayout: () => mockUseIsDesktopLayout()
}));

const steps = [
  { id: 'upload', label: 'Upload' },
  { id: 'mapping', label: 'Map columns' },
  { id: 'submit', label: 'Submit' }
];

const renderComponent = activeStep =>
  render(
    <IntlProvider
      locale="en"
      messages={{ 'Step {current} of {total}': 'Step {current} of {total}' }}>
      <WizardProgress activeStep={activeStep} steps={steps} />
    </IntlProvider>
  );

it('renders every step in the desktop layout', () => {
  mockUseIsDesktopLayout.mockReturnValue(true);

  renderComponent(1);

  expect(screen.getByText('Upload')).toBeInTheDocument();
  expect(screen.getByText('Map columns')).toBeInTheDocument();
  expect(screen.getByText('Submit')).toBeInTheDocument();
  expect(
    screen.getByText('Map columns').closest('.MuiStep-root')
  ).toHaveAttribute('aria-current', 'step');
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});

it('renders only the active label and progress in the compact layout', () => {
  mockUseIsDesktopLayout.mockReturnValue(false);

  renderComponent(1);

  expect(screen.queryByText('Upload')).not.toBeInTheDocument();
  expect(screen.getByText('Map columns')).toBeInTheDocument();
  expect(screen.queryByText('Submit')).not.toBeInTheDocument();
  expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();

  const progressbar = screen.getByRole('progressbar', {
    name: 'Step 2 of 3'
  });
  expect(progressbar).toHaveAttribute('aria-valuenow', '67');
});
