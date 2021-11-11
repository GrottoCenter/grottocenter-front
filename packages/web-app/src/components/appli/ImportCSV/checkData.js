import { keys, includes } from 'ramda';
import {
  ATTRIBUTION_NAME,
  COUNTRY_CODE,
  DOCUMENT,
  ENTRANCE,
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
      row.errors.forEach(err => {
        errors.push({
          errorMessage: err.message,
          row: err.row + 2
        });
      });
    } else {
      let requiredColumns;
      switch (selectedType) {
        case ENTRANCE:
          requiredColumns = requiredColumnsEntrance;
          break;
        case DOCUMENT:
          requiredColumns = requiredColumnsDocument;
          break;
        default:
      }

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
