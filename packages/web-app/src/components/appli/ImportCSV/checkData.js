import { keys, includes } from 'ramda';
import {
  ATTRIBUTION_NAME,
  COUNTRY_CODE,
  DOCUMENT,
  DOCUMENT_KARSTLINK,
  ENTRANCE,
  ENTRANCE_KARSTLINK,
  ID,
  LATITUDE,
  LICENSE,
  LONGITUDE,
  TYPE
} from './constants';

const requiredColumnsDocument = [
  ID,
  TYPE,
  ATTRIBUTION_NAME,
  LICENSE,
  COUNTRY_CODE
];

const requiredColumnsEntrance = [
  ID,
  TYPE,
  ATTRIBUTION_NAME,
  LICENSE,
  COUNTRY_CODE,
  LATITUDE,
  LONGITUDE
];

const checkData = (data, selectedType, formatMessage) => {
  let requiredColumns;
  let rowType;
  if (selectedType === ENTRANCE) {
    requiredColumns = requiredColumnsEntrance;
    rowType = ENTRANCE_KARSTLINK;
  } else if (selectedType === DOCUMENT) {
    requiredColumns = requiredColumnsDocument;
    rowType = DOCUMENT_KARSTLINK;
  }

  const errors = [];
  for (let i = 0; i < data.length; i += 1) {
    const row = data[i];

    // We check if the type of the imported file corresponds to the type the user is importing
    if (row[TYPE] && row[TYPE].replaceAll(/\s/g, '') !== rowType) {
      errors.push({
        errorMessage: formatMessage(
          {
            id: 'The type column is incorrect, expecting {rowType}.',
            defaultMessage: 'The type column is incorrect, expecting {rowType}.'
          },
          { rowType }
        ),
        row: i + 2
      });
      // eslint-disable-next-line no-continue
      continue;
    }

    // Then we check for mandatory columns
    const rowDataKeys = keys(row);
    for (const requiredColumn of requiredColumns) {
      if (
        !includes(requiredColumn, rowDataKeys) ||
        row[requiredColumn] === ''
      ) {
        errors.push({
          errorMessage: formatMessage(
            {
              id: 'column value missing',
              defaultMessage:
                'The following column is missing a value : {column}.'
            },
            { column: requiredColumn }
          ),
          row: i + 2
        });
      }
    }
  }
  return errors;
};

export default checkData;
