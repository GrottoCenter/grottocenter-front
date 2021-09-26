import React from 'react';
import { storiesOf } from '@storybook/react';
import { Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { boolean } from '@storybook/addon-knobs';

import Properties from './Properties';
import EntryMap from './EntryMap';
import Provider from './Provider';
import { Entry } from './index';
import Layout from '../../common/Layouts/Main';
import { Search, FakeAppBar } from '../../common/Layouts/Main/_stories';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';

const date = new Date('2015-03');
const today = new Date();

const details = {
  name: 'Petit Saint-Cassien (Gouffre du)',
  localisation:
    "Nans-les-Pins, Var (83), Provence-Alpes-Côte d'Azur (PAC), FRANCE",
  depth: 403,
  development: 10865,
  interestRate: 3.5,
  progressionRate: 2.5,
  accessRate: 1.5,
  author: 'Author name',
  creationDate: date.toISOString().substring(0, 10),
  lastEditor: 'Editor name',
  editionDate: today.toISOString().substring(0, 10),
  undergroundType: 'Karstic (all carbonate rocks)',
  discoveryYear: 1925,
  coordinates: [43.35266, 5.81689],
  mountain: 'Sainte-Baume (massif de la)',
  altitude: 748,
  isDivingCave: true
};

const comments = [
  {
    accessRate: 2,
    author: { name: 'Author' },
    body: 'body description',
    date: date.toISOString().substring(0, 10),
    id: 3,
    interestRate: 3,
    language: 'fra',
    progressionRate: 5,
    title: 'titre'
  },
  {
    accessRate: 2,
    author: { name: 'Author' },
    body: 'body description 2',
    date: date.toISOString().substring(0, 10),
    id: 4,
    language: 'fra',
    progressionRate: 2,
    title: 'titre 2'
  }
];
const descriptions = [
  {
    author: { name: 'Author' },
    body:
      "Toutes les cordes sur la progression vers le fond (siphon de Barnabé) ont été changées le 02/12/2017 (les cordes vers la salle Richard Chabardez n'ont pas été changées). Tout est équipé en place sauf le puits d'entrée (prévoir C40 et 7 mousquetons, tout broché).",
    date: date.toISOString().substring(0, 10),
    id: 3,
    language: 'fra',
    title: 'titre description'
  },
  {
    author: { name: 'Author' },
    body: 'body description body description body description',
    date: date.toISOString().substring(0, 10),
    id: 4,
    language: 'fra',
    title: 'titre description'
  }
];
const riggings = [
  {
    obstacles: [
      {
        obstacle: 'P17 (entrée)',
        observation:
          "Plusieurs broches à l'entrée. Plein de possibilités d'équipement de ce puit! Les AN sont des arbres.",
        rope: 'C30',
        anchor: '1 AN (MC) 1 AN (tête) 1B (dev)'
      },
      {
        obstacle: 'P6',
        observation: "l'AN est une barre de fer",
        rope: 'C25',
        anchor: '1B+1S (MC) 1 AN (tête de puits)'
      }
    ],
    author: { name: 'Author' },
    id: 1,
    language: 'fra',
    date: date.toISOString().substring(0, 10),
    title: 'titre riggings'
  },
  {
    obstacles: [
      {
        obstacle: 'P17 (entrée)',
        observation:
          "Plusieurs broches à l'entrée. Plein de possibilités d'équipement de ce puit! Les AN sont des arbres.",
        rope: 'C30',
        anchor: '1 AN (MC) 1 AN (tête) 1B (dev)'
      },
      {
        obstacle: 'P6',
        observation: "l'AN est une barre de fer",
        rope: 'C25',
        anchor: '1B+1S (MC) 1 AN (tête de puits)'
      }
    ],
    author: { name: 'Author' },
    id: 2,
    language: 'fra',
    date: date.toISOString().substring(0, 10),
    title: 'titre riggings'
  }
];

const Content = ({ title }) => {
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
    />
  );
};

Content.propTypes = {
  title: PropTypes.string.isRequired
};

// eslint-disable-next-line react/prop-types
const StoryContextProvider = ({ loading, children }) => (
  <Provider
    loading={loading}
    details={details}
    comments={comments}
    descriptions={descriptions}
    riggings={riggings}>
    {children}
  </Provider>
);

const PropertiesWithState = () => {
  return (
    <>
      <EntryMap />
      <Properties />
    </>
  );
};

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
      SideBarQuickSearch={Search}>
      <Entry />
    </Layout>
  );
};

storiesOf('Entry', module)
  .addDecorator(storyFn => (
    <StoryContextProvider loading={boolean('Loading', false)}>
      {storyFn()}
    </StoryContextProvider>
  ))
  .add('Properties', () => <PropertiesWithState />)
  .add('With Fixed-Content layout', () => <Entry />)
  .add('With Fixed-Content and Main Layout', () => (
    <WithLayout loading={boolean('Loading', false)} />
  ));
