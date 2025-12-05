import React from 'react';
import { Box } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import UnreadNotificationIcon from '@mui/icons-material/FiberManualRecord';
import GCLink from '../GCLink';
import Translate from '../Translate';

import * as CSV from '../../appli/ImportCSV/constants';

const cellsRender = {
  notificationIsRead: value =>
    value ? (
      <CheckIcon color="primary" fontSize="small" />
    ) : (
      <UnreadNotificationIcon color="secondary" fontSize="small" />
    ),
  notificationEntityType: (value, doc) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <img src={doc.iconPath} alt="icon" style={{ width: '24px' }} />
      <span>
        <Translate>{value}</Translate>
      </span>
    </Box>
  ),
  person: value => {
    if (!value) return false;
    if (value.id && value.nickname) {
      return (
        <GCLink
          href={`/ui/persons/${value.id}`}
          onClick={e => e.stopPropagation()}>
          {value.nickname}
        </GCLink>
      );
    }
    return value;
  },
  keyArray: key => value =>
    !value || !Array.isArray(value) ? null : value.map(e => e[key]).join(', ') || '-',
  translate: value => (!value ? null : <Translate>{value}</Translate>),
  ellipsis: value =>
    value && value.length > 60 ? `${value.substring(0, 60)}...` : value,
  date: value => (!value ? null : new Date(value).toLocaleDateString())
};

const placeholder = {
  columns: [[true, 'name', 'Name', false]],
  link: () => false
};

const notifications = {
  columns: [
    [true, 'dateInscription', 'Date', false],
    [true, 'notifier', 'From', false, cellsRender.person],
    [true, 'action', 'Action', false, cellsRender.translate],
    [true, 'entityType', 'Type', false, cellsRender.notificationEntityType],
    [true, 'entityName', 'Name', false],
    [true, 'isRead', 'Read', false, cellsRender.notificationIsRead]
  ],
  link: doc => doc.link
};

const massifs = {
  columns: [
    [false, 'id', 'Id', false],
    [true, 'name', 'Name', true],
    [false, 'language', 'Language', true],
    [true, 'nbEntrances', 'Entrances', true]
  ],
  link: doc => `/ui/massifs/${doc.id}`
};

const organizations = {
  columns: [
    [false, 'id', 'Id', false],
    [true, 'name', 'Name', true],
    [false, 'language', 'Language', true],
    [true, 'mail', 'Email', false],
    [false, 'url', 'URL', false],
    [false, 'isOfficialPartner', 'Is a partner', true],
    [false, 'address', 'Address', false],
    [false, 'postalCode', 'Postal code', true],
    [true, 'city', 'City', true],
    [true, 'county', 'County', true],
    [true, 'region', 'Region', true],
    [true, 'country', 'Country', true],
    [true, 'nbCavers', 'Cavers', true],
    [false, 'iso3166', 'ISO code', true],
    [false, 'customMessage', 'Message', false]
  ],
  link: doc => `/ui/organizations/${doc.id}`
};

const persons = {
  columns: [
    [true, 'id', 'Id', false],
    [true, 'nickname', 'Username', true],
    [true, 'name', 'First name', true],
    [true, 'surname', 'Last name', true]
  ],
  link: doc => `/ui/persons/${doc.id}`
};

const entrances = {
  columns: [
    [false, 'id', 'Id', false],
    [true, 'name', 'Name', true],
    [false, 'language', 'Language', true],
    [true, 'city', 'City', true],
    [false, 'county', 'County', true],
    [false, 'region', 'Region', true],
    [true, 'country', 'Country', true],
    [false, 'iso3166', 'ISO code', true],
    [false, 'cave.name', 'Network name', true],
    [true, 'cave.depth', 'Depth', true],
    [true, 'cave.length', 'Length', true],
    [false, 'cave.isDiving', 'Has siphons', true],
    [false, 'cave.temperature', 'Temperature', true],
    [true, 'commentsRating.approach', 'Ease of reach', true],
    [true, 'commentsRating.caving', 'Ease of move', true],
    [true, 'commentsRating.aestheticism', 'Aesthetic', true]
  ],
  link: doc => `/ui/entrances/${doc.id}`
};

const documents = {
  columns: [
    [false, 'id', 'Id', false],
    [false, 'creator', 'Creator', false, cellsRender.person],
    [false, 'dateInscription', 'Added at', true, cellsRender.date],
    [false, 'reviewer', 'Reviewer', false, cellsRender.person],
    [false, 'validator', 'Validator', false, cellsRender.person],
    [false, 'creatorComment', 'Creator comment', false],
    [true, 'type', 'Type', true, cellsRender.translate],
    [true, 'title', 'Title', true, cellsRender.ellipsis],
    [true, 'description', 'Description', false, cellsRender.ellipsis],
    [false, 'datePublication', 'Publication date', true],
    [true, 'authors', 'Author', false, cellsRender.keyArray('nickname')],
    [false, 'library.name', 'Library', true],
    [false, 'editor.name', 'Editor', true],
    [true, 'parent.title', 'Parent', true],
    [false, 'issue', 'Issue', true],
    [false, 'pages', 'Pages', true],
    [false, 'identifierType', 'Identifier type', true],
    [true, 'identifier', 'Identifier', true],
    [false, 'license', 'License', true],
    [false, 'subjects', 'Subjects', false, cellsRender.keyArray('code')],
    [true, 'iso3166', 'Country / Region', false, cellsRender.keyArray('iso')],
    [false, 'importSource', 'Import source', false],
    [false, 'importId', 'Import Id', false],
    [false, 'cave.name', 'Cave', true],
    [false, 'entrance.name', 'Entrance', true],
    [false, 'massifs', 'Massifs', false, cellsRender.keyArray('name')]
  ],
  link: doc => `/ui/documents/${doc.id}`
};

const commonCSVColumns = [
  [false, CSV.ID, 'Id', false],
  [true, CSV.DESCRIPTION_DOCUMENT_TITLE, 'Title of the document', false],
  [false, CSV.MODIFICATION_DATE, 'Modification date', false],
  [false, CSV.LABEL, 'Label', false],
  [false, CSV.LABEL_LANGUAGE, 'Label language', false],
  [false, CSV.TYPE, 'Type', false],
  [true, CSV.LICENSE, 'License', false],
  [false, CSV.ALTERNATE_NAME, 'Alternate name', false],
  [false, CSV.ATTRIBUTION_NAME, 'Attribution name', false],
  [false, CSV.ATTRIBUTION_URL, 'Attribution URL', false],
  [false, CSV.CREATION_DATE, 'Creation date', false],
  [false, CSV.DESCRIPTION_DOCUMENT, 'Document description', false],
  [
    false,
    CSV.DESCRIPTION_DOCUMENT_CREATOR,
    'Author of the document description',
    false
  ],
  [
    false,
    CSV.DESCRIPTION_DOCUMENT_LANGUAGE,
    'Language of the document description',
    false
  ]
];

const csvImportEntrances = {
  columns: [
    ...commonCSVColumns,
    [false, CSV.CONTAINED_IN_PLACE, 'Schema: contained in place', false],
    [true, CSV.COUNTRY_CODE, 'Country', false],
    [false, CSV.DESCRIPTION_LOCATION, 'Location description', false],
    [
      true,
      CSV.DESCRIPTION_LOCATION_TITLE,
      'Title of the location description',
      false
    ],
    [
      false,
      CSV.DESCRIPTION_LOCATION_CREATOR,
      'Author of the location description',
      false
    ],
    [
      false,
      CSV.DESCRIPTION_LOCATION_LANGUAGE,
      'Language of the location description',
      false
    ],
    [false, CSV.DISCOVERED_BY, 'Discovered by', false],
    [true, CSV.LATITUDE, 'Latitude', false],
    [true, CSV.LONGITUDE, 'Longitude', false],
    [true, CSV.LENGTH, 'Length', false],
    [true, CSV.VERTICAL_EXTEND, 'Vertical extend', false],
    [false, CSV.EXTEND_ABOVE, 'Extend above', false],
    [false, CSV.EXTEND_BELOW, 'Extend below', false],
    [false, CSV.ALTITUDE, 'Altitude', false],
    [false, CSV.PRECISION, 'Precision', false]
  ],
  link: () => false
};

const csvImportDocuments = {
  columns: [
    ...commonCSVColumns,
    [true, CSV.DOCUMENT_TYPE, 'Document type', false],
    [true, CSV.CREATOR, 'Author', false],
    [true, CSV.DATE, 'Date', false],
    [false, CSV.FORMAT, 'Format', false],
    [false, CSV.IDENTIFIER, 'Identifier', false],
    [false, CSV.IS_PART_OF, 'Document parent', false],
    [true, CSV.LANGUAGE, 'Language', false],
    [true, CSV.PUBLISHER, 'Publisher', false],
    [true, CSV.REFERENCES, 'References', false],
    [true, CSV.SOURCE, 'Source', false],
    [true, CSV.SUBJECT, 'Subject', false],
    [false, CSV.UNDERGROUND, 'Related to underground cavity', false]
  ],
  link: () => false
};

const duplicate = {
  columns: [
    [false, 'id', 'Duplicate id', false],
    [true, 'docId', 'Id', false],
    [true, 'name', 'Name', false]
  ],
  link: () => false
};

const o = {
  placeholder,
  persons,
  organizations,
  massifs,
  entrances,
  documents,
  notifications,
  csvImportEntrances,
  csvImportDocuments,
  duplicate
};
export default o;
