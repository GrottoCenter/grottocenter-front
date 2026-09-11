import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { useIntl } from 'react-intl';

import { useOnlineStatus } from '@/hooks';
import CustomIcon from '@/components/common/CustomIcon';
import OfflineDisabled from '@/components/common/OfflineDisabled';
import StandardDialog from '@/components/common/StandardDialog';
import { EntityCard, EntityCardsGrid } from './EntitiesListItem';

const LinkedEntityCards = ({
  entities = [],
  emptyMessage = null,
  onUnlink,
  isUnlinking = false
}) => {
  const { formatMessage } = useIntl();
  const isOnline = useOnlineStatus();
  const [entityToUnlink, setEntityToUnlink] = useState(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const isBusy = isUnlinking || isSubmitting;

  useEffect(() => {
    const isSelectedEntityPresent = entities.some(
      entity =>
        entity.id === entityToUnlink?.id && entity.type === entityToUnlink.type
    );

    if (entityToUnlink && !isSelectedEntityPresent) {
      setEntityToUnlink(null);
    }
  }, [entities, entityToUnlink]);

  const handleUnlink = async () => {
    if (!entityToUnlink || !onUnlink) return;
    setSubmitting(true);
    try {
      await onUnlink(entityToUnlink);
      setEntityToUnlink(null);
    } catch {
      /* Error reporting is owned by the onUnlink callback. */
    } finally {
      setSubmitting(false);
    }
  };

  if (entities.length === 0) return emptyMessage;

  return (
    <>
      <EntityCardsGrid>
        {entities.map(entity => {
          const unlinkLabel = `${formatMessage({ id: 'unlink' })} ${
            entity.label
          }`;
          const itemActionButton = onUnlink ? (
            <OfflineDisabled disabled={!isOnline}>
              <Tooltip
                title={formatMessage({ id: 'unlink' })}
                disableTouchListener>
                <span>
                  <IconButton
                    aria-label={unlinkLabel}
                    color="error"
                    disabled={!isOnline || isBusy}
                    onClick={() => setEntityToUnlink(entity)}
                    sx={{ touchAction: 'manipulation' }}>
                    <LinkOffIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </OfflineDisabled>
          ) : null;

          return (
            <EntityCard
              key={`${entity.type}-${entity.id}`}
              to={entity.url}
              icon={<CustomIcon type={entity.iconType} size={32} />}
              itemActionButton={itemActionButton}>
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                  {entity.label}
                </Typography>
                {entity.secondary && (
                  <Typography variant="body2" color="text.secondary">
                    {entity.secondary}
                  </Typography>
                )}
              </Box>
            </EntityCard>
          );
        })}
      </EntityCardsGrid>

      {onUnlink && (
        <StandardDialog
          open={Boolean(entityToUnlink)}
          onClose={() => setEntityToUnlink(null)}
          title={formatMessage({ id: 'Unlink' })}
          actions={[
            <Button
              key="cancel"
              variant="outlined"
              disabled={isBusy}
              onClick={() => setEntityToUnlink(null)}>
              {formatMessage({ id: 'No' })}
            </Button>,
            <Button
              key="confirm"
              variant="contained"
              color="error"
              disabled={isBusy}
              onClick={handleUnlink}>
              {formatMessage({ id: 'Unlink' })}
            </Button>
          ]}>
          {entityToUnlink &&
            formatMessage(
              { id: 'Are you sure you want to unlink {name}?' },
              { name: entityToUnlink.label }
            )}
        </StandardDialog>
      )}
    </>
  );
};

LinkedEntityCards.propTypes = {
  entities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      type: PropTypes.string.isRequired,
      iconType: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      secondary: PropTypes.string,
      url: PropTypes.string.isRequired
    })
  ),
  emptyMessage: PropTypes.node,
  // The callback owns user-facing error reporting when its promise rejects.
  onUnlink: PropTypes.func,
  isUnlinking: PropTypes.bool
};

export default LinkedEntityCards;
