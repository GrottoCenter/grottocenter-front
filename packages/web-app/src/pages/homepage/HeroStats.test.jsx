import { screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';

import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/fr.json';
import { apiGet } from '@/api/client';
import { dynamicNumbersUrl } from '@/conf/apiRoutes';
import grottoTheme from '@/conf/grottoTheme';
import { organizationClubIcon } from '@/assets/icons';
import HeroStats from './HeroStats';

vi.mock('@/api/client', () => ({ apiGet: vi.fn() }));

it('presents the organization count as groups with the caving group icon', async () => {
  apiGet.mockResolvedValue({ count: 42 });
  renderWithProviders(
    <MemoryRouter>
      <ThemeProvider theme={grottoTheme}>
        <HeroStats />
      </ThemeProvider>
    </MemoryRouter>,
    { messages, locale: 'fr' }
  );

  const link = await screen.findByRole('link', { name: '42 groupes' });
  expect(link).toHaveAttribute('href', '/ui/organizations?type=SPELEOLOGY');
  expect(within(link).getByRole('img')).toHaveAttribute(
    'src',
    organizationClubIcon
  );
  expect(within(link).getByText('groupes')).toBeInTheDocument();
  expect(apiGet).toHaveBeenCalledWith(dynamicNumbersUrl.organizations);
});
