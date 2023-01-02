import React from 'react';
import PropTypes from 'prop-types';
import Drawer from '@mui/material/Drawer';
import ArrowDownIcon from '@mui/icons-material/Navigation';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import NetworkIcon from '@mui/icons-material/Timelapse';
import ExportIcon from '@mui/icons-material/ImportExport';
import withTheme from '@mui/styles/withTheme';
import styled from 'styled-components';
import Translate from '../common/Translate';
import SimpleMenuEntryConnector from '../../containers/SimpleMenuEntryConnector';
import ComplexMenuEntryConnector from '../../containers/ComplexMenuEntryConnector';

const Menubar = withTheme(styled(Drawer)`
  > div {
    width: ${props => props.theme.sideMenuWidth} !important;
    top: 60px !important;
    background-color: ${props => props.theme.palette.primary1Color} !important;
  }
`);

const SideMenu = ({ visible }) => (
  <Menubar open={visible}>
    <ComplexMenuEntryConnector
      identifier="entry1"
      open={false}
      icon={<ArrowDownIcon />}
      text={<Translate>Entries</Translate>}>
      <SimpleMenuEntryConnector
        identifier="entrysub1"
        open={false}
        icon={<SearchIcon />}
        text={<Translate>Search</Translate>}
        target="/ui/entries/search"
      />
      <SimpleMenuEntryConnector
        identifier="entrysub2"
        open={false}
        icon={<AddIcon />}
        text={<Translate>Add</Translate>}
        target="/ui/entries/add"
      />
    </ComplexMenuEntryConnector>
    <ComplexMenuEntryConnector
      identifier="cave1"
      open={false}
      icon={<ArrowDownIcon />}
      text={<Translate>Caves</Translate>}>
      <SimpleMenuEntryConnector
        identifier="cavesub1"
        open={false}
        icon={<SearchIcon />}
        text={<Translate>Search</Translate>}
        target="/ui/caves/search"
      />
      <SimpleMenuEntryConnector
        identifier="cavesub2"
        open={false}
        icon={<AddIcon />}
        text={<Translate>Add</Translate>}
        target="/ui/caves/add"
      />
    </ComplexMenuEntryConnector>
    <ComplexMenuEntryConnector
      identifier="orga1"
      open={false}
      icon={<NetworkIcon />}
      text={<Translate>Organizations</Translate>}
      target="/ui/orga/"
    />
    <ComplexMenuEntryConnector
      identifier="export1"
      open={false}
      icon={<ExportIcon />}
      text={<Translate>Exports</Translate>}
      target="/ui/orga/export/"
    />
  </Menubar>
);

SideMenu.propTypes = {
  visible: PropTypes.bool.isRequired
};

export default SideMenu;
