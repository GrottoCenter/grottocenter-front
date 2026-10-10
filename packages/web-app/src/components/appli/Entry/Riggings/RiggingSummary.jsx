import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Chip, Stack, Tooltip } from '@mui/material';
import PropTypes from 'prop-types';
import {
  EQUIPMENT_TYPES,
  parseRiggingEquipment
} from '@/utils/anchorEquipment';
import { parseRopeLengths } from '@/utils/ropeLength';
import { ObstaclePropTypes } from '@/types/entrance.type';
import { ropeIcon } from '@/assets/icons';

const EQUIPMENT_LABELS = {
  hangers: 'rigging.equipment.hangers',
  carabiners: 'rigging.equipment.carabiners',
  expansionBolts: 'rigging.equipment.expansionBolts',
  softAnchors: 'rigging.equipment.softAnchors',
  slings: 'rigging.equipment.slings'
};

const EQUIPMENT_TOOLTIPS = {
  hangers: 'rigging.equipment.estimate.hangers',
  carabiners: 'rigging.equipment.estimate.carabiners',
  expansionBolts: 'rigging.equipment.estimate.expansionBolts',
  softAnchors: 'rigging.equipment.estimate.softAnchors',
  slings: 'rigging.equipment.estimate.slings'
};

const RiggingSummary = ({ obstacles, language }) => {
  const { formatMessage, formatNumber } = useIntl();
  const { total, unparsedCount } = parseRopeLengths(obstacles.map(o => o.rope));
  const equipment = useMemo(
    () =>
      parseRiggingEquipment(
        obstacles.map(o => o.anchor),
        language
      ),
    [obstacles, language]
  );

  return (
    <Stack
      direction="row"
      spacing={0.5}
      useFlexGap
      sx={{ flexWrap: 'wrap' }}
      data-testid="rigging-summary">
      <Chip
        size="small"
        variant="outlined"
        label={formatMessage(
          {
            id: '{count, plural, one {# obstacle} other {# obstacles}}'
          },
          { count: obstacles.length }
        )}
      />
      {total > 0 && (
        <Tooltip
          title={formatMessage({
            id: 'Approximate total rope length, automatically calculated from rope cells'
          })}>
          <Chip
            size="small"
            variant="outlined"
            icon={
              <img
                src={ropeIcon}
                alt=""
                aria-hidden="true"
                width={18}
                height={18}
              />
            }
            label={`${unparsedCount > 0 ? '~' : ''}${formatNumber(total)} m`}
          />
        </Tooltip>
      )}
      {EQUIPMENT_TYPES.filter(kind => equipment[kind].max > 0).map(kind => {
        const { min, max } = equipment[kind];
        const quantity =
          min === max
            ? formatNumber(min)
            : `${formatNumber(min)}–${formatNumber(max)}`;
        return (
          <Tooltip
            key={kind}
            title={formatMessage({ id: EQUIPMENT_TOOLTIPS[kind] })}>
            <Chip
              size="small"
              variant="outlined"
              data-testid={`rigging-equipment-${kind}`}
              label={formatMessage(
                { id: 'rigging.equipment.count' },
                {
                  equipment: formatMessage(
                    { id: EQUIPMENT_LABELS[kind] },
                    { count: max }
                  ),
                  quantity
                }
              )}
            />
          </Tooltip>
        );
      })}
    </Stack>
  );
};

RiggingSummary.propTypes = {
  obstacles: PropTypes.arrayOf(ObstaclePropTypes).isRequired,
  language: PropTypes.string
};

export default RiggingSummary;
