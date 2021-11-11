import { useIntl } from 'react-intl';
import * as CONSTANTS from './constants';

const useCustomHeaderRender = () => {
  const { formatMessage } = useIntl();

  return [
    {
      id: CONSTANTS.ALTERNATE_NAME,
      customRender: () => formatMessage({ id: 'Alternate name' })
    },
    {
      id: CONSTANTS.ALTITUDE,
      customRender: () => formatMessage({ id: 'Altitude' })
    },
    {
      id: CONSTANTS.ATTRIBUTION_NAME,
      customRender: () => formatMessage({ id: 'Attribution name' })
    },
    {
      id: CONSTANTS.ATTRIBUTION_URL,
      customRender: () => formatMessage({ id: 'Attribution URL' })
    },
    {
      id: CONSTANTS.CONTAINED_IN_PLACE,
      customRender: () => formatMessage({ id: 'Schema: contained in place' })
    },
    {
      id: CONSTANTS.COUNTRY_CODE,
      customRender: () => formatMessage({ id: 'Country' })
    },
    {
      id: CONSTANTS.CREATION_DATE,
      customRender: () => formatMessage({ id: 'Creation date' })
    },
    {
      id: CONSTANTS.CREATOR,
      customRender: () => formatMessage({ id: 'Author' })
    },
    {
      id: CONSTANTS.DATE,
      customRender: () => formatMessage({ id: 'Date' })
    },
    {
      id: CONSTANTS.DESCRIPTION_DOCUMENT,
      customRender: () => formatMessage({ id: 'Document description' })
    },
    {
      id: CONSTANTS.DESCRIPTION_DOCUMENT_CREATOR,
      customRender: () =>
        formatMessage({ id: 'Author of the document description' })
    },
    {
      id: CONSTANTS.DESCRIPTION_DOCUMENT_LANGUAGE,
      customRender: () =>
        formatMessage({ id: 'Language of the document description' })
    },
    {
      id: CONSTANTS.DESCRIPTION_DOCUMENT_TITLE,
      customRender: () =>
        formatMessage({ id: 'Title of the document description' })
    },
    {
      id: CONSTANTS.DESCRIPTION_LOCATION,
      customRender: () => formatMessage({ id: 'Location description' })
    },
    {
      id: CONSTANTS.DESCRIPTION_LOCATION_CREATOR,
      customRender: () =>
        formatMessage({ id: 'Author of the location description' })
    },
    {
      id: CONSTANTS.DESCRIPTION_LOCATION_LANGUAGE,
      customRender: () =>
        formatMessage({ id: 'Language of the location description' })
    },
    {
      id: CONSTANTS.DESCRIPTION_LOCATION_TITLE,
      customRender: () =>
        formatMessage({ id: 'Title of the location description' })
    },
    {
      id: CONSTANTS.DISCOVERED_BY,
      customRender: () => formatMessage({ id: 'Discovered by' })
    },
    {
      id: CONSTANTS.DOCUMENT_TYPE,
      customRender: () => formatMessage({ id: 'Document type' })
    },
    {
      id: CONSTANTS.EXTEND_ABOVE,
      customRender: () => formatMessage({ id: 'Extend above' })
    },
    {
      id: CONSTANTS.EXTEND_BELOW,
      customRender: () => formatMessage({ id: 'Extend below' })
    },
    {
      id: CONSTANTS.FORMAT,
      customRender: () => formatMessage({ id: 'Format' })
    },
    {
      id: CONSTANTS.ID,
      customRender: () => formatMessage({ id: 'Id' })
    },
    {
      id: CONSTANTS.IDENTIFIER,
      customRender: () => formatMessage({ id: 'Identifier' })
    },
    {
      id: CONSTANTS.IS_PART_OF,
      customRender: () => formatMessage({ id: 'Document parent' })
    },
    {
      id: CONSTANTS.LABEL,
      customRender: () => formatMessage({ id: 'Label' })
    },
    {
      id: CONSTANTS.LANGUAGE,
      customRender: () => formatMessage({ id: 'Language' })
    },
    {
      id: CONSTANTS.LATITUDE,
      customRender: () => formatMessage({ id: 'Latitude' })
    },
    {
      id: CONSTANTS.LENGTH,
      customRender: () => formatMessage({ id: 'Length' })
    },
    {
      id: CONSTANTS.LICENSE,
      customRender: () => formatMessage({ id: 'License' })
    },
    {
      id: CONSTANTS.LONGITUDE,
      customRender: () => formatMessage({ id: 'Longitude' })
    },
    {
      id: CONSTANTS.MODIFICATION_DATE,
      customRender: () => formatMessage({ id: 'Modification date' })
    },
    {
      id: CONSTANTS.PRECISION,
      customRender: () => formatMessage({ id: 'Precision' })
    },
    {
      id: CONSTANTS.PUBLISHER,
      customRender: () => formatMessage({ id: 'Publisher' })
    },
    {
      id: CONSTANTS.REFERENCES,
      customRender: () => formatMessage({ id: 'References' })
    },
    {
      id: CONSTANTS.SOURCE,
      customRender: () => formatMessage({ id: 'Source' })
    },
    {
      id: CONSTANTS.SUBJECT,
      customRender: () => formatMessage({ id: 'Subject' })
    },
    {
      id: CONSTANTS.UNDERGROUND,
      customRender: () => formatMessage({ id: 'Related to underground cavity' })
    },
    {
      id: CONSTANTS.VERTICAL_EXTEND,
      customRender: () => formatMessage({ id: 'Vertical extend' })
    }
  ];
};

export default useCustomHeaderRender;
