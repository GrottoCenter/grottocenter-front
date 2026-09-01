import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  ButtonGroup,
  Chip,
  ListItem,
  Paper,
  Tooltip,
  Typography
} from '@mui/material';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { useIntl } from 'react-intl';

import AppLink from '@/components/common/AppLink';
import Contribution from '@/components/common/Contribution/Contribution';
import CustomIcon from '@/components/common/CustomIcon';
import OfflineDisabled from '@/components/common/OfflineDisabled';
import StandardDialog from '@/components/common/StandardDialog';
import { useOnlineStatus } from '@/hooks';
import GuidelinePropTypes from '@/types/guideline.type';

const SCOPE_LABEL_IDS = {
  country: 'Country guideline',
  region: 'Region guideline',
  massif: 'Massif guideline'
};

const getScopeCount = guideline =>
  (guideline.countries?.length ?? 0) +
  (guideline.regions?.length ?? 0) +
  (guideline.massifs?.length ?? 0);

const Guideline = ({
  guideline,
  onUnlink,
  scopeTypes = [],
  hideAttribution = false
}) => {
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
        sx={{
          p: 1,
          borderRadius: 2,
          borderLeftWidth: 3,
          borderLeftColor: 'secondary.main',
          bgcolor: 'grey.50'
        }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 0.5
          }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              columnGap: 1,
              rowGap: 0.5,
              minWidth: 0
            }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                minWidth: 0
              }}>
              <Box aria-hidden="true" sx={{ flexShrink: 0 }}>
                <CustomIcon type="guidelines" size={22} />
              </Box>
              <Typography
                variant="h4"
                component="h3"
                sx={{ overflowWrap: 'anywhere' }}>
                <AppLink to={`/ui/guidelines/${guideline.id}`}>
                  {guideline.title}
                </AppLink>
              </Typography>
            </Box>
            {scopeTypes.map(scopeType => (
              <Chip
                key={scopeType}
                label={formatMessage({ id: SCOPE_LABEL_IDS[scopeType] })}
                size="small"
                variant="outlined"
                sx={{
                  height: 22,
                  color: 'text.secondary',
                  borderColor: 'divider',
                  '& .MuiChip-label': { px: 0.75 }
                }}
              />
            ))}
          </Box>
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
            hideAttribution={hideAttribution}
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
  onUnlink: PropTypes.func,
  scopeTypes: PropTypes.arrayOf(
    PropTypes.oneOf(['country', 'region', 'massif'])
  ),
  hideAttribution: PropTypes.bool
};

export default Guideline;
