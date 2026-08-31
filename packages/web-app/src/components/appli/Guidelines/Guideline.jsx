import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  ButtonGroup,
  ListItem,
  Paper,
  Tooltip,
  Typography
} from '@mui/material';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { useIntl } from 'react-intl';

import AppLink from '@/components/common/AppLink';
import Contribution from '@/components/common/Contribution/Contribution';
import OfflineDisabled from '@/components/common/OfflineDisabled';
import StandardDialog from '@/components/common/StandardDialog';
import { useOnlineStatus } from '@/hooks';
import GuidelinePropTypes from '@/types/guideline.type';

const getScopeCount = guideline =>
  (guideline.countries?.length ?? 0) +
  (guideline.regions?.length ?? 0) +
  (guideline.massifs?.length ?? 0);

const Guideline = ({ guideline, onUnlink }) => {
  const { formatMessage } = useIntl();
  const isOnline = useOnlineStatus();
  const [isUnlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [isUnlinking, setUnlinking] = useState(false);
  // TODO(api#1775): allow unlinking the final country, region or massif once
  // the API accepts a guideline whose three scope arrays are all empty.
  const isLastScope = getScopeCount(guideline) <= 1;
  const isUnlinkDisabled = !isOnline || isUnlinking || isLastScope;

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      await onUnlink(guideline);
      setUnlinkDialogOpen(false);
    } catch {
      /* toast handled globally */
    } finally {
      setUnlinking(false);
    }
  };

  const unlinkButton = onUnlink ? (
    <ButtonGroup color="primary" size="small" variant="outlined">
      <OfflineDisabled disabled={!isOnline}>
        <Tooltip
          title={
            isLastScope
              ? formatMessage({
                  id: 'guidelines.scope_required',
                  defaultMessage:
                    'Select at least one country, region, or massif.'
                })
              : formatMessage({ id: 'unlink' })
          }>
          <span>
            <Button
              disabled={isUnlinkDisabled}
              aria-label={formatMessage({ id: 'unlink' })}
              onClick={() => setUnlinkDialogOpen(true)}>
              <LinkOffIcon />
            </Button>
          </span>
        </Tooltip>
      </OfflineDisabled>
    </ButtonGroup>
  ) : null;

  return (
    <ListItem disableGutters sx={{ display: 'block' }}>
      <Paper
        variant="outlined"
        sx={{ p: 1, borderRadius: 2, bgcolor: 'grey.50' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 0.5
          }}>
          <Typography variant="h4" component="h3">
            <AppLink openInNewTabDesktop to={`/ui/guidelines/${guideline.id}`}>
              {guideline.title}
            </AppLink>
          </Typography>
          {unlinkButton}
        </Box>
        <Box sx={{ mt: 0.5 }}>
          <Contribution
            body={guideline.description}
            author={guideline.author}
            reviewer={guideline.reviewer}
            dateInscription={guideline.dateInscription}
            dateReviewed={guideline.dateReviewed}
            language={guideline.language}
            isDeleted={guideline.isDeleted}
          />
        </Box>
      </Paper>
      {onUnlink && (
        <StandardDialog
          open={isUnlinkDialogOpen}
          onClose={() => setUnlinkDialogOpen(false)}
          title={formatMessage({ id: 'unlink' })}
          actions={[
            <Button
              key="cancel"
              variant="outlined"
              onClick={() => setUnlinkDialogOpen(false)}>
              {formatMessage({ id: 'No' })}
            </Button>,
            <Button
              key="confirm"
              variant="contained"
              color="error"
              disabled={isUnlinking}
              onClick={handleUnlink}>
              {formatMessage({ id: 'Unlink' })}
            </Button>
          ]}>
          {formatMessage(
            { id: 'Are you sure you want to unlink {name}?' },
            { name: guideline.title }
          )}
        </StandardDialog>
      )}
    </ListItem>
  );
};

Guideline.propTypes = {
  guideline: GuidelinePropTypes.isRequired,
  onUnlink: PropTypes.func
};

export default Guideline;
