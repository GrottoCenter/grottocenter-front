import React from 'react';
import { Box } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import UnreadNotificationIcon from '@mui/icons-material/FiberManualRecord';
import GCLink from '../GCLink';
import Translate from '../Translate';
import DataQualityBadge from '../DataQualityBadge';
import CustomIcon from '../CustomIcon';

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
    !value || !Array.isArray(value)
      ? null
      : value.map(e => e[key]).join(', ') || '-',
  translate: value => (!value ? null : <Translate>{value}</Translate>),
  ellipsis: value =>
    value && value.length > 60 ? `${value.substring(0, 60)}...` : value,
  date: value => (!value ? null : new Date(value).toLocaleDateString())
};

const placeholder = {
  columns: [{ visible: true, field: 'name', label: 'Name', sortable: false }],
  link: () => false
};

const notifications = {
  columns: [
    { visible: true, field: 'dateInscription', label: 'Date', sortable: false },
    {
      visible: true,
      field: 'notifier',
      label: 'From',
      sortable: false,
      render: cellsRender.person
    },
    {
      visible: true,
      field: 'action',
      label: 'Action',
      sortable: false,
      render: cellsRender.translate
    },
    {
      visible: true,
      field: 'entityType',
      label: 'Type',
      sortable: false,
      render: cellsRender.notificationEntityType
    },
    { visible: true, field: 'entityName', label: 'Name', sortable: false },
    {
      visible: true,
      field: 'isRead',
      label: 'Read',
      sortable: false,
      render: cellsRender.notificationIsRead
    }
  ],
  link: doc => doc.link
};

const massifs = {
  icon: <CustomIcon type="massif" size={16} />,
  columns: [
    { visible: false, field: 'id', label: 'Id', sortable: false },
    { visible: true, field: 'name', label: 'Name', sortable: true },
    { visible: false, field: 'language', label: 'Language', sortable: true },
    { visible: true, field: 'nbEntrances', label: 'Entrances', sortable: true }
  ],
  link: doc => `/ui/massifs/${doc.id}`
};

const organizations = {
  icon: <CustomIcon type="organization" size={16} />,
  columns: [
    { visible: false, field: 'id', label: 'Id', sortable: false },
    { visible: true, field: 'name', label: 'Name', sortable: true },
    { visible: false, field: 'language', label: 'Language', sortable: true },
    { visible: true, field: 'mail', label: 'Email', sortable: false },
    { visible: false, field: 'url', label: 'URL', sortable: false },
    {
      visible: false,
      field: 'isOfficialPartner',
      label: 'Is a partner',
      sortable: true
    },
    { visible: false, field: 'address', label: 'Address', sortable: false },
    {
      visible: false,
      field: 'postalCode',
      label: 'Postal code',
      sortable: true
    },
    { visible: true, field: 'city', label: 'City', sortable: true },
    { visible: true, field: 'county', label: 'County', sortable: true },
    { visible: true, field: 'region', label: 'Region', sortable: true },
    { visible: true, field: 'country', label: 'Country', sortable: true },
    { visible: true, field: 'nbCavers', label: 'Cavers', sortable: true },
    { visible: false, field: 'iso3166', label: 'ISO code', sortable: true },
    {
      visible: false,
      field: 'customMessage',
      label: 'Message',
      sortable: false
    }
  ],
  link: doc => `/ui/organizations/${doc.id}`
};

const PERSON_TYPE_LABEL = { CAVER: 'Caver', AUTHOR: 'Author' };

const persons = {
  icon: <CustomIcon type="caver" size={16} />,
  columns: [
    { visible: true, field: 'id', label: 'Id', sortable: false },
    { visible: true, field: 'nickname', label: 'Username', sortable: true, isTitle: true },
    { visible: true, field: 'name', label: 'First name', sortable: true },
    { visible: true, field: 'surname', label: 'Last name', sortable: true },
    {
      visible: false,
      field: 'type',
      label: 'Type',
      sortable: true,
      render: value =>
        value && PERSON_TYPE_LABEL[value] ? (
          <Translate>{PERSON_TYPE_LABEL[value]}</Translate>
        ) : (
          value || null
        )
    }
  ],
  link: doc => `/ui/persons/${doc.id}`
};

const entrances = {
  icon: <CustomIcon type="entrance" size={16} />,
  columns: [
    {
      visible: false,
      field: 'id',
      label: 'Id',
      sortable: true,
      apiField: 'numericId'
    },
    { visible: true, field: 'name', label: 'Name', sortable: true },
    { visible: false, field: 'language', label: 'Language', sortable: true },
    { visible: true, field: 'city', label: 'City', sortable: true },
    { visible: false, field: 'county', label: 'County', sortable: true },
    { visible: false, field: 'region', label: 'Region', sortable: true },
    { visible: true, field: 'country', label: 'Country', sortable: true },
    { visible: false, field: 'iso3166', label: 'ISO code', sortable: true },
    {
      visible: false,
      field: 'massifs',
      label: 'Massif',
      sortable: false,
      render: cellsRender.keyArray('name')
    },
    {
      visible: false,
      field: 'cave.name',
      label: 'Network name',
      sortable: true
    },
    { visible: true, field: 'cave.depth', label: 'Depth', sortable: true },
    { visible: true, field: 'cave.length', label: 'Length', sortable: true },
    {
      visible: false,
      field: 'cave.isDiving',
      label: 'Diving cave',
      sortable: true
    },
    {
      visible: false,
      field: 'cave.temperature',
      label: 'Temperature',
      sortable: true
    },
    {
      visible: true,
      field: 'commentsRating.approach',
      label: 'Ease of reach',
      sortable: true
    },
    {
      visible: true,
      field: 'commentsRating.caving',
      label: 'Ease of move',
      sortable: true
    },
    {
      visible: true,
      field: 'commentsRating.aestheticism',
      label: 'Aesthetic',
      sortable: true
    },
    {
      visible: false,
      field: 'dateInscription',
      label: 'Creation date',
      sortable: true,
      render: cellsRender.date
    },
    {
      visible: false,
      field: 'dateLastModif',
      label: 'Last modified',
      sortable: true,
      render: cellsRender.date
    },
    {
      visible: true,
      field: 'dataQuality',
      label: 'Data quality',
      sortable: true,
      render: value =>
        value != null ? <DataQualityBadge value={value} size={24} /> : undefined
    }
  ],
  link: doc => `/ui/entrances/${doc.id}`
};

const documents = {
  icon: <CustomIcon type="bibliography" size={16} />,
  columns: [
    { visible: false, field: 'id', label: 'Id', sortable: false },
    {
      visible: false,
      field: 'creator',
      label: 'Creator',
      sortable: false,
      render: cellsRender.person
    },
    {
      visible: false,
      field: 'dateInscription',
      label: 'Added at',
      sortable: true,
      render: cellsRender.date
    },
    {
      visible: false,
      field: 'reviewer',
      label: 'Reviewer',
      sortable: false,
      render: cellsRender.person
    },
    {
      visible: false,
      field: 'validator',
      label: 'Validator',
      sortable: false,
      render: cellsRender.person
    },
    {
      visible: false,
      field: 'creatorComment',
      label: 'Creator comment',
      sortable: false
    },
    { visible: false, field: 'language', label: 'Language', sortable: true },
    {
      visible: true,
      field: 'type',
      label: 'Type',
      sortable: true,
      render: cellsRender.translate
    },
    {
      visible: true,
      field: 'title',
      label: 'Title',
      sortable: true,
      render: cellsRender.ellipsis
    },
    {
      visible: true,
      field: 'description',
      label: 'Description',
      sortable: false,
      render: cellsRender.ellipsis
    },
    {
      visible: false,
      field: 'datePublication',
      label: 'Publication date',
      sortable: true
    },
    {
      visible: true,
      field: 'authors',
      label: 'Author',
      sortable: false,
      render: cellsRender.keyArray('nickname'),
      apiField: 'authors.nickname'
    },
    { visible: false, field: 'library.name', label: 'Library', sortable: true },
    { visible: false, field: 'editor.name', label: 'Editor', sortable: true },
    { visible: true, field: 'parent.title', label: 'Parent', sortable: true },
    { visible: false, field: 'issue', label: 'Issue', sortable: true },
    { visible: false, field: 'pages', label: 'Pages', sortable: true },
    {
      visible: false,
      field: 'identifierType',
      label: 'Identifier type',
      sortable: true
    },
    { visible: true, field: 'identifier', label: 'Identifier', sortable: true },
    { visible: false, field: 'license', label: 'License', sortable: true },
    {
      visible: false,
      field: 'subjects',
      label: 'Subjects',
      sortable: false,
      render: cellsRender.keyArray('code')
    },
    {
      visible: true,
      field: 'iso3166',
      label: 'Country / Region',
      sortable: false,
      render: cellsRender.keyArray('iso'),
      apiField: 'iso3166.iso'
    },
    {
      visible: false,
      field: 'importSource',
      label: 'Import source',
      sortable: true
    },
    { visible: false, field: 'importId', label: 'Import Id', sortable: true },
    { visible: false, field: 'cave.name', label: 'Cave', sortable: true },
    {
      visible: false,
      field: 'entrances',
      label: 'Entrances',
      sortable: false,
      render: cellsRender.keyArray('name')
    },
    {
      visible: false,
      field: 'massifs',
      label: 'Massifs',
      sortable: false,
      render: cellsRender.keyArray('name')
    }
  ],
  link: doc => `/ui/documents/${doc.id}`
};

const commonCSVColumns = [
  { visible: false, field: CSV.ID, label: 'Id', sortable: false },
  {
    visible: true,
    field: CSV.DESCRIPTION_DOCUMENT_TITLE,
    label: 'Title of the document',
    sortable: false
  },
  {
    visible: false,
    field: CSV.MODIFICATION_DATE,
    label: 'Modification date',
    sortable: false
  },
  { visible: false, field: CSV.LABEL, label: 'Label', sortable: false },
  {
    visible: false,
    field: CSV.LABEL_LANGUAGE,
    label: 'Label language',
    sortable: false
  },
  { visible: false, field: CSV.TYPE, label: 'Type', sortable: false },
  { visible: true, field: CSV.LICENSE, label: 'License', sortable: false },
  {
    visible: false,
    field: CSV.ALTERNATE_NAME,
    label: 'Alternate name',
    sortable: false
  },
  {
    visible: false,
    field: CSV.ATTRIBUTION_NAME,
    label: 'Attribution name',
    sortable: false
  },
  {
    visible: false,
    field: CSV.ATTRIBUTION_URL,
    label: 'Attribution URL',
    sortable: false
  },
  {
    visible: false,
    field: CSV.CREATION_DATE,
    label: 'Creation date',
    sortable: false
  },
  {
    visible: false,
    field: CSV.DESCRIPTION_DOCUMENT,
    label: 'Document description',
    sortable: false
  },
  {
    visible: false,
    field: CSV.DESCRIPTION_DOCUMENT_CREATOR,
    label: 'Author of the document description',
    sortable: false
  },
  {
    visible: false,
    field: CSV.DESCRIPTION_DOCUMENT_LANGUAGE,
    label: 'Language of the document description',
    sortable: false
  }
];

const csvImportEntrances = {
  columns: [
    ...commonCSVColumns,
    {
      visible: false,
      field: CSV.CONTAINED_IN_PLACE,
      label: 'Schema: contained in place',
      sortable: false
    },
    {
      visible: true,
      field: CSV.COUNTRY_CODE,
      label: 'Country',
      sortable: false
    },
    {
      visible: false,
      field: CSV.DESCRIPTION_LOCATION,
      label: 'Location description',
      sortable: false
    },
    {
      visible: true,
      field: CSV.DESCRIPTION_LOCATION_TITLE,
      label: 'Title of the location description',
      sortable: false
    },
    {
      visible: false,
      field: CSV.DESCRIPTION_LOCATION_CREATOR,
      label: 'Author of the location description',
      sortable: false
    },
    {
      visible: false,
      field: CSV.DESCRIPTION_LOCATION_LANGUAGE,
      label: 'Language of the location description',
      sortable: false
    },
    {
      visible: false,
      field: CSV.DISCOVERED_BY,
      label: 'Discovered by',
      sortable: false
    },
    { visible: true, field: CSV.LATITUDE, label: 'Latitude', sortable: false },
    {
      visible: true,
      field: CSV.LONGITUDE,
      label: 'Longitude',
      sortable: false
    },
    { visible: true, field: CSV.LENGTH, label: 'Length', sortable: false },
    {
      visible: true,
      field: CSV.VERTICAL_EXTEND,
      label: 'Vertical extend',
      sortable: false
    },
    {
      visible: false,
      field: CSV.EXTEND_ABOVE,
      label: 'Extend above',
      sortable: false
    },
    {
      visible: false,
      field: CSV.EXTEND_BELOW,
      label: 'Extend below',
      sortable: false
    },
    { visible: false, field: CSV.ALTITUDE, label: 'Altitude', sortable: false },
    {
      visible: false,
      field: CSV.PRECISION,
      label: 'Precision',
      sortable: false
    }
  ],
  link: () => false
};

const csvImportDocuments = {
  columns: [
    ...commonCSVColumns,
    {
      visible: true,
      field: CSV.DOCUMENT_TYPE,
      label: 'Document type',
      sortable: false
    },
    { visible: true, field: CSV.CREATOR, label: 'Author', sortable: false },
    { visible: true, field: CSV.DATE, label: 'Date', sortable: false },
    { visible: false, field: CSV.FORMAT, label: 'Format', sortable: false },
    {
      visible: false,
      field: CSV.IDENTIFIER,
      label: 'Identifier',
      sortable: false
    },
    {
      visible: false,
      field: CSV.IS_PART_OF,
      label: 'Document parent',
      sortable: false
    },
    { visible: true, field: CSV.LANGUAGE, label: 'Language', sortable: false },
    {
      visible: true,
      field: CSV.PUBLISHER,
      label: 'Publisher',
      sortable: false
    },
    {
      visible: true,
      field: CSV.REFERENCES,
      label: 'References',
      sortable: false
    },
    { visible: true, field: CSV.SOURCE, label: 'Source', sortable: false },
    { visible: true, field: CSV.SUBJECT, label: 'Subject', sortable: false },
    {
      visible: false,
      field: CSV.UNDERGROUND,
      label: 'Related to underground cavity',
      sortable: false
    }
  ],
  link: () => false
};

const duplicate = {
  columns: [
    { visible: false, field: 'id', label: 'Duplicate id', sortable: false },
    { visible: true, field: 'docId', label: 'Id', sortable: false },
    { visible: true, field: 'name', label: 'Name', sortable: false }
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
