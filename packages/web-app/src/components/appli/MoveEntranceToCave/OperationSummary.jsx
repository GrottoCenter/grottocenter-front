import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import { useIntl } from 'react-intl';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

import CustomIcon from '../../common/CustomIcon';
import NetworkInlineLink from '../../common/NetworkInlineLink';
import { useOtherEntranceName } from '../../../hooks';
import { CaveType, EntranceType } from './types';

// Global "Now → After" preview of the operation: it lists every network/entrance
// affected on each side, not only the moved entrance. The source network can lose
// an entrance (count −1, or dissolve into independent entrances) and a target
// network can gain one (count +1, or a brand-new network of 2). We only ever have
// a network's name + entrance count (never the individual entrances), so networks
// are shown as "name (N entrances)". We speak of entrances and networks only —
// never "cavity".
const OperationSummary = ({ entrance, newCave, variant = 'link' }) => {
  const { formatMessage } = useIntl();

  // Entrance count shown as secondary text *next to* the network link, never
  // inside it, so the link stays just the network name.
  const countLabel = count =>
    formatMessage({ id: 'network.entranceCount' }, { count: count ?? 0 });

  const networkItem = (caveId, name, count, note) => ({
    icon: 'network',
    caveId,
    name,
    count,
    note
  });
  const entranceItem = (name, { note, accent } = {}) => ({
    icon: 'entrance',
    name,
    note,
    accent
  });

  const sourceCave = entrance.cave;
  const sourceCount = sourceCave?.entrances?.length ?? 1;
  const targetCount =
    typeof newCave?.nbEntrances === 'number' ? newCave.nbEntrances : null;
  const isSameCave = newCave && Number(newCave.id) === sourceCave?.id;
  const hasTarget = Boolean(newCave?.name) && !isSameCave && targetCount !== null;

  // When the source is a 2-entrance network, the operation leaves it with a
  // single, now-standalone entrance. Show that entrance by its own name (the
  // entrance payload only carries sibling ids, so resolve it via the cave).
  const willDissolve =
    sourceCount === 2 && (variant === 'detach' || hasTarget);
  const otherEntranceName = useOtherEntranceName(
    sourceCave?.id,
    entrance.id,
    willDissolve
  );

  // Residual of a dissolved 2-entrance network: the remaining entrance, standalone.
  const dissolvedResidual = () =>
    entranceItem(
      otherEntranceName ?? formatMessage({ id: 'The other entrance' }),
      { note: formatMessage({ id: 'Becomes independent' }) }
    );

  let before = [];
  let after = [];

  if (variant === 'detach') {
    before = [networkItem(sourceCave?.id, sourceCave?.name, sourceCount)];
    after = [
      entranceItem(entrance.name, {
        note: formatMessage({ id: 'Independent entrance' }),
        accent: true
      }),
      sourceCount - 1 >= 2
        ? networkItem(sourceCave?.id, sourceCave?.name, sourceCount - 1)
        : dissolvedResidual()
    ];
  } else {
    // Source side (always present).
    before.push(
      sourceCount >= 2
        ? networkItem(sourceCave?.id, sourceCave?.name, sourceCount)
        : entranceItem(entrance.name)
    );
    if (hasTarget) {
      before.push(
        targetCount >= 2
          ? networkItem(newCave.id, newCave.name, targetCount)
          : entranceItem(newCave.name)
      );

      // Source residual: solo source disappears (its entrance joins the target);
      // a 2-entrance source dissolves into an independent entrance.
      if (sourceCount >= 2) {
        after.push(
          sourceCount - 1 >= 2
            ? networkItem(sourceCave?.id, sourceCave?.name, sourceCount - 1)
            : dissolvedResidual()
        );
      }
      // Target gains the entrance.
      after.push(
        networkItem(
          newCave.id,
          newCave.name,
          targetCount + 1,
          formatMessage({ id: 'Now includes {name}' }, { name: entrance.name })
        )
      );
    }
  }

  const renderItem = (item, index) => (
    <Box
      key={`${item.icon}-${item.name ?? ''}-${index}`}
      sx={{ p: 0.5, borderRadius: 1, bgcolor: 'action.hover', minWidth: 0 }}
    >
      {item.icon === 'network' ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            columnGap: '4px',
            minWidth: 0
          }}
        >
          {item.caveId ? (
            <NetworkInlineLink caveId={item.caveId} label={item.name} />
          ) : (
            <Typography variant="body2" component="span">
              {item.name}
            </Typography>
          )}
          {typeof item.count === 'number' && (
            <Typography
              variant="caption"
              color="text.secondary"
              component="span"
            >
              {countLabel(item.count)}
            </Typography>
          )}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <CustomIcon type={item.icon} size={16} />
          <Typography
            variant="body2"
            color={item.accent ? 'primary' : 'text.primary'}
            sx={{ minWidth: 0, fontWeight: item.accent ? 600 : 400 }}
          >
            {item.name}
          </Typography>
        </Box>
      )}
      {item.note && (
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
        >
          {item.note}
        </Typography>
      )}
    </Box>
  );

  const column = (label, items) => (
    <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
      <Typography
        variant="overline"
        color="text.secondary"
        display="block"
        sx={{ mb: 0.5 }}
      >
        {label}
      </Typography>
      {items.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {items.map(renderItem)}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {formatMessage({ id: 'To be selected' })}
        </Typography>
      )}
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 1
      }}
    >
      {column(formatMessage({ id: 'Now' }), before)}
      <KeyboardArrowRightIcon
        fontSize="large"
        sx={{
          alignSelf: 'center',
          color: 'text.secondary',
          transform: { xs: 'rotate(90deg)', sm: 'none' }
        }}
      />
      {column(formatMessage({ id: 'After' }), after)}
    </Box>
  );
};

OperationSummary.propTypes = {
  entrance: EntranceType,
  newCave: CaveType,
  variant: PropTypes.oneOf(['link', 'detach'])
};

export default OperationSummary;
