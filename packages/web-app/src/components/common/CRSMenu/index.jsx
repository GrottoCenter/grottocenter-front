import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl, defineMessages } from 'react-intl';
import { Check } from '@mui/icons-material';
import {
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  MenuList,
  MenuItem,
  Popover
} from '@mui/material';
import { groupBy } from 'ramda';
import getLocalizedCountryName from '../../../helpers/countryName';
import SearchInput from '../SearchInput';
import Translate from '../Translate';
import { WGS84_DD, DMS_CODE } from '../../../hooks';

const WGS84_LABEL = 'Decimal degrees (WGS84)';
const DMS_LABEL = 'Degrees Minutes Seconds';

defineMessages({
  wgs84: { id: 'Decimal degrees (WGS84)' },
  dms: { id: 'Degrees Minutes Seconds' }
});

const CRSMenu = ({
  anchorEl = null,
  onClose,
  preferred,
  projections = [],
  onSelect
}) => {
  const { formatMessage, locale } = useIntl();
  const [filter, setFilter] = useState('');

  const worldLabel = formatMessage({ id: 'World' });
  const normalizedFilter = filter.trim().toLowerCase();

  const sortedGroups = useMemo(
    () =>
      Object.entries(
        groupBy(
          p =>
            getLocalizedCountryName(
              p.iso2 || p.country_code,
              locale,
              p.en_name
            ) || worldLabel,
          projections
        )
      )
        .map(([name, projs]) => [
          name,
          [...projs].sort((a, b) => a.title.localeCompare(b.title))
        ])
        // The world-wide group is pinned first, the rest is alphabetical.
        .sort(([a], [b]) => {
          if (a === worldLabel) return -1;
          if (b === worldLabel) return 1;
          return a.localeCompare(b);
        }),
    [projections, locale, worldLabel]
  );

  const showWGS84 =
    !normalizedFilter ||
    WGS84_LABEL.toLowerCase().includes(normalizedFilter) ||
    'wgs84'.includes(normalizedFilter);
  const showDMS =
    !normalizedFilter || DMS_LABEL.toLowerCase().includes(normalizedFilter);

  const filteredGroups = useMemo(() => {
    if (!normalizedFilter) return sortedGroups;
    return sortedGroups
      .map(([groupName, groupProjections]) => [
        groupName,
        groupProjections.filter(
          p =>
            p.title.toLowerCase().includes(normalizedFilter) ||
            p.code.toLowerCase().includes(normalizedFilter) ||
            groupName.toLowerCase().includes(normalizedFilter)
        )
      ])
      .filter(([, projs]) => projs.length > 0);
  }, [sortedGroups, normalizedFilter]);

  const handleClose = (...args) => {
    setFilter('');
    onClose(...args);
  };

  return (
    <Popover
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleClose}
      PaperProps={{
        sx: {
          maxHeight: 480,
          width: 320,
          maxWidth: 'calc(100vw - 32px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }
      }}>
      <Box sx={{ p: 0.5, borderBottom: 1, borderColor: 'divider' }}>
        <ListSubheader
          disableSticky
          sx={{ lineHeight: '28px', fontWeight: 'bold', px: 0.25 }}>
          <Translate>Coordinate system</Translate>
        </ListSubheader>
        <SearchInput
          value={filter}
          onChange={setFilter}
          sx={{ '& input': { fontSize: '0.875rem' } }}
        />
      </Box>
      <MenuList
        dense
        sx={{
          overflowY: 'auto',
          overflowX: 'hidden',
          flex: 1
        }}>
        {showWGS84 && (
          <MenuItem onClick={() => onSelect(WGS84_DD)}>
            <ListItemIcon>
              {preferred === WGS84_DD && (
                <Check fontSize="small" color="primary" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={<Translate>{WGS84_LABEL}</Translate>}
              slotProps={{ primary: { variant: 'body2' } }}
            />
          </MenuItem>
        )}
        {showDMS && (
          <MenuItem onClick={() => onSelect(DMS_CODE)}>
            <ListItemIcon>
              {preferred === DMS_CODE && (
                <Check fontSize="small" color="primary" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={<Translate>{DMS_LABEL}</Translate>}
              slotProps={{ primary: { variant: 'body2' } }}
            />
          </MenuItem>
        )}

        {projections.length > 0 &&
          filteredGroups.length > 0 && [
            <Divider key="proj-divider" />,
            ...filteredGroups.map(([groupName, groupProjections]) => [
              <ListSubheader
                key={`header-${groupName}`}
                disableSticky
                sx={{ lineHeight: '28px' }}>
                {groupName}
              </ListSubheader>,
              ...groupProjections.map(p => (
                <MenuItem key={p.code} onClick={() => onSelect(p.code)}>
                  <ListItemIcon>
                    {preferred === p.code && (
                      <Check fontSize="small" color="primary" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={p.title}
                    slotProps={{
                      primary: {
                        variant: 'body2',
                        noWrap: true,
                        title: p.title
                      }
                    }}
                  />
                </MenuItem>
              ))
            ])
          ]}
      </MenuList>
    </Popover>
  );
};

CRSMenu.propTypes = {
  anchorEl: PropTypes.instanceOf(Element),
  onClose: PropTypes.func.isRequired,
  preferred: PropTypes.string.isRequired,
  projections: PropTypes.arrayOf(
    PropTypes.shape({ code: PropTypes.string, title: PropTypes.string })
  ),
  onSelect: PropTypes.func.isRequired
};

export default CRSMenu;
