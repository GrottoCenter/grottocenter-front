import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '../../../public/lang/en.json';
import Footer from './Footer';

afterEach(() => {
  vi.unstubAllEnvs();
});

it('links a published version to its matching GitHub release', () => {
  vi.stubEnv('VITE_APP_VERSION', '3.2.1');

  renderWithProviders(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
    { messages }
  );

  expect(
    screen.getByRole('link', { name: 'Grottocenter web v3.2.1' })
  ).toHaveAttribute(
    'href',
    'https://github.com/GrottoCenter/grottocenter-front/releases/tag/3.2.1'
  );
});

it.each(['3.2.2-preview', '0.0.0-dev'])(
  'does not link version %s without a published release',
  version => {
    vi.stubEnv('VITE_APP_VERSION', version);

    renderWithProviders(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
      { messages }
    );

    expect(
      screen.getByText(`Grottocenter web v${version}`)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: `Grottocenter web v${version}` })
    ).not.toBeInTheDocument();
  }
);
