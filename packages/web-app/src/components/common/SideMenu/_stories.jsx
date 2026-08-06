import { useDispatch, useSelector } from 'react-redux';
import { styled } from '@mui/material/styles';

import { AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import SideMenu from './index';
import {
  openMobileSideMenu,
  setSideMenuExpanded
} from '../../../actions/SideMenu';
import { useIsDesktopLayout, useSideMenuOffset } from '../../../hooks';

const MainWrapper = styled('main', {
  shouldForwardProp: prop => prop !== '$offset' && prop !== '$transition'
})`
  flex-grow: 1;
  padding: ${({ theme }) => theme.spacing(2)};
  transition: ${({ $transition }) => $transition};
  margin-left: ${({ $offset }) => $offset}px;
`;

const WithState = () => {
  const dispatch = useDispatch();
  const isDesktop = useIsDesktopLayout();
  const isExpanded = useSelector(state => state.sideMenu.isExpanded);
  const { width: offset, transition } = useSideMenuOffset();

  const handleClick = () =>
    dispatch(
      isDesktop ? setSideMenuExpanded(!isExpanded) : openMobileSideMenu()
    );

  const chevron = isExpanded ? <ChevronLeftIcon /> : <ChevronRightIcon />;

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${offset}px)`,
          ml: `${offset}px`,
          transition
        }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle menu"
            edge="start"
            onClick={handleClick}
            size="large">
            {isDesktop ? chevron : <MenuIcon />}
          </IconButton>
          <Typography variant="h4" noWrap>
            Side Menu
          </Typography>
        </Toolbar>
      </AppBar>
      <SideMenu />
      <MainWrapper $offset={offset} $transition={transition}>
        <Typography paragraph>
          Resize the preview across 900px to switch between the permanent
          desktop rail and the temporary mobile overlay. Below that width the
          menu is an overlay opened by the burger; above it, the chevron folds
          the rail down to its icons instead of hiding it.
        </Typography>
        <Typography paragraph>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Rhoncus
          dolor purus non enim praesent elementum facilisis leo vel. Risus at
          ultrices mi tempus imperdiet. Semper risus in hendrerit gravida rutrum
          quisque non tellus. Convallis convallis tellus id interdum velit
          laoreet id donec ultrices. Odio morbi quis commodo odio aenean sed
          adipiscing. Amet nisl suscipit adipiscing bibendum est ultricies
          integer quis. Cursus euismod quis viverra nibh cras. Metus vulputate
          eu scelerisque felis imperdiet proin fermentum leo. Mauris commodo
          quis imperdiet massa tincidunt. Cras tincidunt lobortis feugiat
          vivamus at augue.
        </Typography>
      </MainWrapper>
    </>
  );
};

const meta = {
  title: 'SideMenu',
  component: SideMenu
};

export default meta;

export const Default = {
  render: () => <WithState />
};
