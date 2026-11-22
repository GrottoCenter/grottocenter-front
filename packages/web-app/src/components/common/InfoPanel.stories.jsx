import { Box, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EntranceProperties from '@/components/appli/Entry/Properties';
import NetworkProperties from '@/components/appli/Network/Properties';
import OrganizationDetails from '@/components/appli/Organization/Details';
import InfoPanel from './InfoPanel';
import { Property } from './Properties';
import CustomIcon from './CustomIcon';

const cave = {
  id: 7,
  depth: 40,
  length: 120,
  temperature: 8,
  exploringOrganizations: [{ id: 9, name: 'Example organization' }]
};

const meta = {
  title: 'Common/InfoPanel',
  component: InfoPanel,
  args: {
    title: 'Characteristics',
    children: (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 0.5
        }}>
        <Property
          label="Depth"
          value="40 m"
          icon={<CustomIcon type="depth" />}
        />
        <Property
          label="Development"
          value="120 m"
          icon={<CustomIcon type="length" />}
        />
      </Box>
    )
  }
};
export default meta;

export const Default = {};
export const Hazards = {
  args: {
    title: 'Hazards & restrictions',
    titleColor: 'secondary.main',
    icon: <WarningAmberIcon sx={{ color: 'secondary.main', fontSize: 20 }} />,
    sx: { bgcolor: 'secondary.veryLight', borderColor: 'secondary.light' },
    children: <Typography>Bat habitat. Clean gear required.</Typography>
  }
};
export const Untitled = {
  args: {
    title: undefined,
    children: <Typography>An untitled organization summary.</Typography>
  }
};
export const Entrance = {
  render: () => (
    <EntranceProperties
      entrance={{
        id: 42,
        city: 'Example city',
        region: 'Example region',
        altitude: 650,
        cave,
        hasBat: true,
        needCleanGear: true
      }}
      dataQuality={{
        total: 72,
        categories: { general: 80, location: 70, description: 65 }
      }}
    />
  )
};
export const Network = {
  render: () => <NetworkProperties cave={cave} isLoading={false} />
};
export const Organization = {
  render: () => (
    <OrganizationDetails
      organization={{
        id: 9,
        name: 'Example organization',
        type: 'SPELEOLOGY',
        address: 'Example address',
        city: 'Example city',
        mail: 'contact@example.org',
        url: 'https://example.org',
        customMessage: 'An example organization description.',
        cavers: [{ id: 1, nickname: 'Example member' }],
        exploredEntrances: [{ id: 42, name: 'Example entrance' }]
      }}
    />
  )
};
