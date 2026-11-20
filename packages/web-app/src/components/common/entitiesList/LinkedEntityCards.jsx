import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { useIntl } from 'react-intl';

import { useOnlineStatus } from '@/hooks';
import CustomIcon from '@/components/common/CustomIcon';
import OfflineDisabled from '@/components/common/OfflineDisabled';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
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
    if (!entityToUnlink || !onUnlink || isBusy || !isOnline) return;
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
          // Entities default to unlinkable so existing callers (massifs, caves)
          // keep their behaviour; opt out per entity when the entity's own
          // endpoint doesn't support it or isn't wired up yet.
          const canUnlinkEntity = entity.canUnlink !== false;
          const itemActionButton =
            onUnlink && canUnlinkEntity ? (
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
                  sx={{
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                  {entity.label}
                </Typography>
                {entity.secondary && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary'
                    }}>
                    {entity.secondary}
                  </Typography>
                )}
              </Box>
            </EntityCard>
          );
        })}
      </EntityCardsGrid>

      {onUnlink && (
        <ConfirmationDialog
          open={Boolean(entityToUnlink)}
          onClose={() => setEntityToUnlink(null)}
          title={formatMessage({ id: 'Unlink' })}
          onConfirm={handleUnlink}
          isBusy={isBusy}
          disabled={!isOnline}
          cancelLabel={formatMessage({ id: 'No' })}
          confirmLabel={formatMessage({ id: 'Unlink' })}
          color="error">
          {entityToUnlink &&
            formatMessage(
              { id: 'Are you sure you want to unlink {name}?' },
              { name: entityToUnlink.label }
            )}
        </ConfirmationDialog>
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
      url: PropTypes.string.isRequired,
      canUnlink: PropTypes.bool
    })
  ),
  emptyMessage: PropTypes.node,
  // The callback owns user-facing error reporting when its promise rejects.
  onUnlink: PropTypes.func,
  isUnlinking: PropTypes.bool
};

export default LinkedEntityCards;
