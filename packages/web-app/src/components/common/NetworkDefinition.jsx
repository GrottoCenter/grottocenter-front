import { Box, Typography } from '@mui/material';
import { FormattedMessage } from 'react-intl';

const strong = chunks => <strong>{chunks}</strong>;

const NetworkDefinition = () => (
  <Box
    data-testid="network-definition"
    sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
    <Typography variant="body2">
      <FormattedMessage id="network.definition" values={{ strong }} />
    </Typography>
    <Typography variant="body2">
      <FormattedMessage id="network.definition.exclusions" />
    </Typography>
  </Box>
);

export default NetworkDefinition;
