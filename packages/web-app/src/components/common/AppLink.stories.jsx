import { MemoryRouter } from 'react-router-dom';
import AppLink from './AppLink';

const meta = {
  title: 'Common/AppLink',
  component: AppLink,
  decorators: [
    Story => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    )
  ]
};
export default meta;

export const InternalSameTab = {
  args: { to: '/ui/entrances/42', children: 'Internal link (same tab on desktop)' }
};

export const InternalNewTabDesktop = {
  args: {
    to: '/ui/entrances/42',
    openInNewTabDesktop: true,
    children: 'Internal link (new tab on desktop, in-app on mobile)'
  }
};

export const External = {
  args: {
    href: 'https://www.openstreetmap.org',
    children: 'External link (always new tab)'
  }
};
