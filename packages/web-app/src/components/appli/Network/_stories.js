import React, { useContext } from 'react';
import { storiesOf } from '@storybook/react';
import { Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { boolean } from '@storybook/addon-knobs';

import Provider, { CaveContext } from './Provider';
import Layout from '../../common/Layouts/Main';
import { Search, FakeAppBar } from '../../common/Layouts/Main/_stories';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import Properties from './Properties';
import { Network } from './index';
import EntrancesSelection from './EntrancesSelection';
import EntrancesList from './EntrancesList';
import Descriptions from './Descriptions';

const date = new Date('2015-03');
const today = new Date();

const data = {
  name: 'Félix Trombe',
  localisation:
    "Nans-les-Pins, Var (83), Provence-Alpes-Côte d'Azur (PAC), FRANCE",
  depth: 1004,
  altitude: 748,
  development: 105767,
  interest: 7,
  progression: 5,
  access: 3,
  author: 'Author name',
  creationDate: date.toISOString().substring(0, 10),
  lastEditor: 'Editor name',
  editionDate: today.toISOString().substring(0, 10),
  undergroundType: 'Karstic (all carbonate rocks)',
  discoveryYear: 1925,
  mountain: 'ARbas (massif d)',
  isDivingCave: true,
  entrances: [
    {
      id: 'Network 1',
      name: 'Petit Saint-Cassien (Gouffre du)',
      depth: 403,
      development: 10865,
      author: 'Author name',
      creationDate: date.toISOString().substring(0, 10),
      undergroundType: 'Karstic (all carbonate rocks)',
      latitude: 43.35266,
      longitude: 5.81689,
      massif: { id: 1, name: 'Sainte-Baume (massif de la)' },
      isDivingCave: true
    },
    {
      id: 'Network 2',
      name: '2 eme entrée (Gouffre du)',
      depth: 403,
      development: 10865,
      author: 'Author name',
      creationDate: date.toISOString().substring(0, 10),
      undergroundType: 'Karstic (all carbonate rocks)',
      latitude: 43.35766,
      longitude: 5.82089,
      massif: { id: 1, name: 'Sainte-Baume (massif de la)' },
      isDivingCave: true
    }
  ]
};

const Content = ({ title, icon }) => {
  const { formatMessage } = useIntl();

  return (
    <ScrollableContent
      title={formatMessage({ id: title })}
      content={
        <Typography>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec mattis
          pretium massa. Aliquam erat volutpat. Nulla facilisi. Donec vulputate
          interdum sollicitudin. Nunc lacinia auctor quam sed pellentesque.
          Aliquam dui mauris, mattis quis lacus id, pellentesque lobortis odio.
        </Typography>
      }
      footer={formatMessage({ id: 'Created by' })}
      icon={icon}
    />
  );
};

Content.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.element
};

// eslint-disable-next-line react/prop-types
const StoryContextProvider = ({ loading, children }) => (
  <Provider loading={loading} data={data}>
    {children}
  </Provider>
);

const NetworkWithContent = () => (
  <Network>
    <>
      <EntrancesList />
      <Descriptions />
    </>
  </Network>
);

const WithLayout = () => {
  const [isSideMenuOpen, setToggleSideMenu] = React.useState(false);

  const toggleSideMenu = () => {
    setToggleSideMenu(!isSideMenuOpen);
  };

  return (
    <Layout
      AppBar={FakeAppBar}
      isSideMenuOpen={isSideMenuOpen}
      toggleSideMenu={toggleSideMenu}
      HeaderQuickSearch={Search}
      SideBarQuickSearch={Search}>
      <NetworkWithContent />
    </Layout>
  );
};

// eslint-disable-next-line react/prop-types
const WithStateEntrancesList = ({ loading }) => {
  const {
    state: { selectedEntrances, entrances },
    action: { onSelectEntrance }
  } = useContext(CaveContext);

  return (
    <EntrancesSelection
      onSelect={onSelectEntrance}
      entrances={entrances}
      selection={selectedEntrances}
      loading={loading}
    />
  );
};

storiesOf('Cave system', module)
  .addDecorator(storyFn => (
    <StoryContextProvider loading={boolean('Loading', false)}>
      {storyFn()}
    </StoryContextProvider>
  ))
  .add('Entrances selection', () => (
    <WithStateEntrancesList loading={boolean('Loading', false)} />
  ))
  .add('Entrances list', () => <EntrancesList />)
  .add('Properties', () => <Properties />)
  .add('With Layouts', () => (
    <WithLayout loading={boolean('Loading', false)} />
  ));
