import { action } from 'storybook/actions';

import LinkedEntityCards from './LinkedEntityCards';

const entities = [
  {
    id: 'FR',
    type: 'country',
    iconType: 'country',
    label: 'France',
    secondary: 'Country',
    url: '/ui/countries/FR'
  },
  {
    id: 7,
    type: 'massif',
    iconType: 'massif',
    label: 'Vercors',
    secondary: 'Massif',
    url: '/ui/massifs/7'
  },
  {
    id: 42,
    type: 'entrance',
    iconType: 'entrance',
    label: 'Grotte exemple',
    secondary: 'Entrance',
    url: '/ui/entrances/42'
  }
];

const meta = {
  title: 'Common/LinkedEntityCards',
  component: LinkedEntityCards,
  args: { entities }
};

export default meta;

export const Default = {};

export const WithUnlink = {
  args: { onUnlink: action('unlink') }
};
