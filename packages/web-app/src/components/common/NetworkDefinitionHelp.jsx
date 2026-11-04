import { useState } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { useIntl } from 'react-intl';

import CustomIcon from './CustomIcon';
import NetworkDefinition from './NetworkDefinition';
import StandardDialog from './StandardDialog';

const NetworkDefinitionHelp = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { formatMessage } = useIntl();
  const title = formatMessage({ id: 'network.definition.title' });

  return (
    <>
      <Tooltip title={title}>
        <IconButton
          type="button"
          size="small"
          aria-label={title}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          data-testid="network-definition-help"
          onClick={() => setIsOpen(true)}
          sx={{ color: 'text.secondary', verticalAlign: 'middle', ml: 0.5 }}>
          <HelpOutlineOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <StandardDialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={
          <Box
            component="span"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CustomIcon type="network" size={24} alt="" />
            {title}
          </Box>
        }
        fullWidth
        scrollable>
        <NetworkDefinition />
      </StandardDialog>
    </>
  );
};

export default NetworkDefinitionHelp;
