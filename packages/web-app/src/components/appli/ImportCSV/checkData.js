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
  const errors = [];
  data.forEach((row, index) => {
    if (row.errors.length !== 0) {
      // first we handle errors from csv downloader
      row.errors.forEach(err => {
        errors.push({
          errorMessage: err.message,
          row: err.row + 2
        });
      });
    } else {
      let requiredColumns;
      let rowType;
      switch (selectedType) {
        case ENTRANCE:
          requiredColumns = requiredColumnsEntrance;
          rowType = ENTRANCE_KARSTLINK;
          break;
        case DOCUMENT:
          requiredColumns = requiredColumnsDocument;
          rowType = DOCUMENT_KARSTLINK;
          break;
        default:
      }

      // Then we check if the type of the imported file corresponds to the type the user is importing
      if (row.data[TYPE] && row.data[TYPE].replaceAll(/\s/g, '') !== rowType) {
        errors.push({
          errorMessage: formatMessage(
            {
              id: 'The type column is incorrect, expecting {rowType}.',
              defaultMessage:
                'The type column is incorrect, expecting {rowType}.'
            },
            { rowType }
          ),
          row: index + 2
        });
        return;
      }

      // Then we check for mandatory columns
      const rowDataKeys = keys(row.data);
      requiredColumns.forEach(requiredColumn => {
        if (
          !includes(requiredColumn, rowDataKeys) ||
          row.data[requiredColumn] === ''
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
            row: index + 2
          });
        }
      });
    }
  });
  return errors;
};

export default checkData;
