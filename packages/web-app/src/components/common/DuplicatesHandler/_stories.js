import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { boolean } from '@storybook/addon-knobs';
import PropTypes from 'prop-types';
import DuplicatesHandler from './index';

const e1 = {
  author: 2,
  reviewer: 4,
  country: 'FR',
  region: 'paca',
  county: 'bdr',
  city: 'aix',
  address: 'address',
  yearDiscovery: '2010',
  dateInscription: '2012',
  dateReviewed: '2013',
  latitude: 30,
  longitude: 40,
  altitude: 10,
  precision: '3',
  geology: 'G123',
  names: [
    {
      name: 'my name'
    },
    {
      name: 'my 2nd name'
    }
  ]
};
const e2 = {
  author: 'ccc',
  reviewer: 'bbb',
  country: 'germany',
  region: 'paca',
  county: 'bdr',
  city: 'aix',
  address: 'address',
  yearDiscovery: '2010',
  externalUrl: 'http',
  dateInscription: '2012',
  dateReviewed: '2013',
  isPublic: 'true',
  isSensitive: 'true',
  contact: 'contanct',
  modalities: 'no,no,no',
  latitude: 30,
  longitude: 40,
  altitude: '10',
  isOfInterest: 'true',
  precision: '3',
  geology: 'G123',
  names: [
    {
      name: 'aaa'
    }
  ]
};

const d1 = {
  author: {
    nickname: 'Pierre'
  },
  reviewer: {
    nickname: 'Paul'
  },
  dateInscription: '2010',
  datePublication: '2009',
  dateReviewed: '2011',
  authorComment: 'The author comment.',
  identifier: 'identifier',
  identifierType: {
    code: 'issn'
  },
  refBbs: 500069,
  editor: {
    name: 'Hachette'
  },
  library: {
    name: 'Hachette'
  },
  type: {
    name: 'Article'
  },
  license: {
    name: 'CC-BY-SA'
  },
  authors: [
    {
      nickname: 'Sabrina'
    },
    {
      nickname: 'Oscar'
    }
  ],
  regions: [
    {
      name: 'PACA'
    }
  ],
  subjects: [
    {
      subject: 'Karstology'
    }
  ],
  languages: [
    {
      part1: 'fr'
    }
  ]
};

const d2 = {
  author: {
    nickname: 'Patrick'
  },
  reviewer: {
    nickname: 'Jean'
  },
  dateInscription: '2012',
  datePublication: '2006',
  dateReviewed: '2001',
  authorComment: 'The author comment 2.',
  identifier: 'identifier 2',
  identifierType: {
    code: 'issn2'
  },
  refBbs: 504369,
  editor: {
    name: 'Editor'
  },
  library: {
    name: 'Library'
  },
  type: {
    name: 'Image'
  },
  license: {
    name: 'CC-BY-SA'
  },
  authors: [
    'Sabrina',
    {
      nickname: 'Aymeric'
    }
  ],
  regions: [
    {
      name: 'PACA'
    }
  ],
  subjects: [
    {
      subject: 'Karstology'
    }
  ],
  languages: [
    {
      part1: 'en'
    }
  ]
};

const HydratedDuplicatesHandler = ({ isEntrance }) => {
  const params = isEntrance
    ? {
        duplicateType: 'entrance',
        duplicate1: e1,
        duplicate2: e2,
        handleSubmit: action('Submitted')
      }
    : {
        duplicateType: 'document',
        duplicate1: d1,
        duplicate2: d2,
        handleSubmit: action('Submitted')
      };

  return <DuplicatesHandler {...params} />;
};
boolean('Entrances', true);
storiesOf('Duplicates handler', module).add('Default', () => (
  <HydratedDuplicatesHandler isEntrance={boolean('Handle entrance', false)} />
));

HydratedDuplicatesHandler.propTypes = {
  isEntrance: PropTypes.bool.isRequired
};
