import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
// Deep imports, not the '@mui/icons-material' barrel: the barrel pulls in every
// icon of the package, which Vite tree-shakes but Vitest does not — it opens
// thousands of files and dies with EMFILE.
import MapIcon from '@mui/icons-material/Map';
import FlagRounded from '@mui/icons-material/FlagRounded';

import AppLink from '../AppLink';
import CustomIcon from '../CustomIcon';
import Translate from '../Translate';

// ONE size for every icon in the menu, MUI glyphs and brown entity cards alike.
// The two families fill their box to within a few percent of each other — the
// entity cards cover ~92% of their 100-unit viewBox, Material glyphs ~92% of
// their 24 — so a shared box is what makes them read at the same weight.
// Giving one family its own size is what put them out of step.
//
// It also sets `theme.sideMenuCollapsedWidth`: see the formula there.
export const MENU_ICON_SIZE = 32;

// Matches the item inset below, so the section labels stay in the same column
// as the icons they head (ListSubheader's own default is 16px).
const SectionHeader = styled(ListSubheader)(({ theme }) => ({
  fontSize: '0.71875rem',
  fontWeight: 600,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color: theme.palette.text.secondary,
  lineHeight: 1.5,
  paddingTop: theme.spacing(0.5),
  paddingLeft: theme.spacing(1)
}));

// Shared by every row of the menu, including the "User guide" one in the footer
// — exported so the two cannot drift apart and break the column.
//
// The 8px inset is what sets `theme.sideMenuCollapsedWidth`: with Content's own
// 8px and a 28px icon, the icon centre lands at 30px, and the rail is twice
// that so the column does not move when it folds. ListItemButton's default 16px
// would put the centre at 38px and force a 76px rail.
//
// Collapsed, the inset goes to 0 and the row spans the full width: every
// collapsed control — these rows, the "User guide" one, the Contribute button —
// then centres its icon inside the exact same box. Anything that computes its
// own box instead drifts the moment the container width changes (a scrollbar
// appearing is enough), which is how the icons and the button ended up on two
// different axes.
export const menuItemSx = isExpanded => ({
  py: '5px',
  px: 1,
  ...(!isExpanded && { justifyContent: 'center', px: 0, width: '100%' })
});

// Expanded keeps ListItemIcon's default flex-start: the 42px box is what lines
// every label up. Collapsed, the icon is centred instead — and CustomIcon's 4px
// right margin, meant for inline use next to text, has to go or it sits the
// icon off-centre.
export const menuItemIconSx = isExpanded => ({
  minWidth: isExpanded ? 42 : 0,
  ...(!isExpanded && {
    justifyContent: 'center',
    '& > span': { marginRight: 0 }
  })
});

export const LinkedItem = ({
  href = '',
  icon,
  label,
  onClick,
  isExpanded = true
}) => (
  // The label is only reachable through the tooltip once the rail is collapsed;
  // when it is expanded the text is right there, and a tooltip repeating it
  // would just be noise.
  <Tooltip
    title={label}
    placement="right"
    disableHoverListener={isExpanded}
    disableFocusListener={isExpanded}
    disableTouchListener={isExpanded}>
    <ListItemButton
      sx={menuItemSx(isExpanded)}
      aria-label={label}
      component={AppLink}
      to={href}
      onClick={onClick}>
      <ListItemIcon sx={menuItemIconSx(isExpanded)}>{icon}</ListItemIcon>
      {/* Unmounted, not just faded: an invisible ListItemText still takes its
          width, and a flex row that overflows its 57px rail spills out on BOTH
          sides under `justify-content: center`. The icon would then sit further
          left the longer its label is — every row misaligned by a different
          amount. */}
      {isExpanded && <ListItemText primary={label} />}
    </ListItemButton>
  </Tooltip>
);

LinkedItem.propTypes = {
  href: PropTypes.string,
  // An element, not a component: a factory would be a new component type on
  // every render, throwing away the subtree's DOM and state each time.
  icon: PropTypes.node,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  isExpanded: PropTypes.bool
};

const MenuLinks = ({ toggle, isExpanded = true }) => {
  const { formatMessage } = useIntl();

  // Group labels have no icon-only form, so the collapsed rail drops them and
  // lets the divider between the two lists carry the grouping.
  const sectionHeader = labelId =>
    isExpanded ? (
      <SectionHeader disableSticky>
        <Translate>{labelId}</Translate>
      </SectionHeader>
    ) : null;

  return (
    <>
      <List component="nav" subheader={sectionHeader('Explore')}>
        <LinkedItem
          icon={<MapIcon color="primary" sx={{ fontSize: MENU_ICON_SIZE }} />}
          label={formatMessage({ id: 'Map' })}
          href="/ui/map"
          onClick={toggle}
          isExpanded={isExpanded}
        />
        <LinkedItem
          icon={
            <FlagRounded color="primary" sx={{ fontSize: MENU_ICON_SIZE }} />
          }
          label={formatMessage({ id: 'Countries' })}
          href="/ui/countries"
          onClick={toggle}
          isExpanded={isExpanded}
        />
      </List>
      <Divider />
      <List
        component="nav"
        sx={{ pb: 0.25 }}
        subheader={sectionHeader('Browse')}>
        <LinkedItem
          icon={<CustomIcon type="entrance" size={MENU_ICON_SIZE} />}
          label={formatMessage({ id: 'Entrances' })}
          href="/ui/entrances"
          onClick={toggle}
          isExpanded={isExpanded}
        />
        <LinkedItem
          icon={<CustomIcon type="massif" size={MENU_ICON_SIZE} />}
          label={formatMessage({ id: 'Massifs' })}
          href="/ui/massifs"
          onClick={toggle}
          isExpanded={isExpanded}
        />
        <LinkedItem
          icon={<CustomIcon type="bibliography" size={MENU_ICON_SIZE} />}
          label={formatMessage({ id: 'Documents' })}
          href="/ui/documents"
          onClick={toggle}
          isExpanded={isExpanded}
        />
        <LinkedItem
          icon={<CustomIcon type="organization" size={MENU_ICON_SIZE} />}
          label={formatMessage({ id: 'Organizations' })}
          href="/ui/organizations"
          onClick={toggle}
          isExpanded={isExpanded}
        />
        <LinkedItem
          icon={<CustomIcon type="caver" size={MENU_ICON_SIZE} />}
          label={formatMessage({ id: 'Cavers' })}
          href="/ui/persons"
          onClick={toggle}
          isExpanded={isExpanded}
        />
      </List>
    </>
  );
};

MenuLinks.propTypes = {
  toggle: PropTypes.func,
  isExpanded: PropTypes.bool
};

export default MenuLinks;
