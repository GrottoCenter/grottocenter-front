import React, { useContext, useEffect } from 'react';
import { makeStyles, Typography } from '@material-ui/core';
import PublishIcon from '@material-ui/icons/Publish';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { ImportPageContentContext } from '../Provider';
import {
  checkRowsInBdd,
  importRows,
  resetImportState
} from '../../../../actions/ImportCsv';
import ActionButton from '../../../common/ActionButton';
import {
  DOCUMENT,
  ENTRANCE,
  FAILURE_IMPORT,
  SUCCESS_IMPORT
} from '../constants';
import Alert from '../../../common/Alert';
import DownloadButton from '../DownloadButton';

const useStyles = makeStyles({
  cardBottomButtons: {
    display: 'block',
    marginTop: `${({ theme }) => theme.spacing(2)}px`,
    marginBottom: `${({ theme }) => theme.spacing(2)}px`,
    padding: 0,
    textAlign: 'center',
    width: '100%'
  }
});

// https://formatjs.io/docs/core-concepts/icu-syntax/#select-format
const translatedSingularType = `{importType, select,
  ${DOCUMENT} {document}
  ${ENTRANCE} {entrance}
  other {}}`;

const translatedPluralType = `{importType, select,
  ${DOCUMENT} {documents}
  ${ENTRANCE} {entrances}
  other {}}`;

const translatedTypePrefix = `{number, plural,
  zero {no ${translatedPluralType}}
  one {# ${translatedSingularType}}
  other {# ${translatedPluralType}}
}`;

const Step4 = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const importCsv = useSelector(state => state.importCsv);
  const { importData, selectedType } = useContext(ImportPageContentContext);

  const willBeCreatedData = importCsv.resultCheck.willBeCreated;
  const wontBeCreateData = importCsv.resultCheck.wontBeCreated;
  const { resultImport } = importCsv;

  const handleOnClick = () => {
    dispatch(importRows(willBeCreatedData, selectedType));
  };

  useEffect(() => {
    dispatch(checkRowsInBdd(selectedType, importData));
    return () => {
      dispatch(resetImportState());
    };
  }, [dispatch, selectedType, importData]);

  return (
    <>
      <Typography>
        {formatMessage({
          id:
            'The functionality to check for duplicates has not been fully implemented.'
        })}
        {formatMessage({
          id:
            'Please be careful not to import any documents or entrances which are already present in Grottocenter.'
        })}
      </Typography>
      {importCsv.isLoading && (
        <Typography>
          {formatMessage({ id: 'Processing, this may take some time...' })}
        </Typography>
      )}

      {importCsv.error && <Typography>{importCsv.error}</Typography>}

      {wontBeCreateData && wontBeCreateData.length > 0 && (
        <>
          <Alert
            severity="error"
            title={formatMessage(
              {
                id: 'importCsv not imported',
                defaultMessage: `${translatedTypePrefix} {number, plural, one {is} other {are}} already present in Grottocenter and won't be imported.`
              },
              {
                number: wontBeCreateData.length,
                importType: selectedType
              }
            )}
            content={wontBeCreateData.map(row => `${row.line}, `)}
          />
        </>
      )}

      {willBeCreatedData && willBeCreatedData.length > 0 && (
        <>
          <Alert
            severity="info"
            title={formatMessage(
              {
                id: 'importCsv imported',
                defaultMessage: `${translatedTypePrefix} will be imported.`
              },
              {
                number: willBeCreatedData.length,
                importType: selectedType
              }
            )}
          />
          <div className={classes.cardBottomButtons}>
            <ActionButton
              label={formatMessage({ id: 'Import' })}
              onClick={handleOnClick}
              loading={importCsv.isLoading}
              icon={<PublishIcon />}
            />
          </div>
        </>
      )}

      {resultImport && resultImport.total.success > 0 && (
        <>
          <Alert
            severity="success"
            title={formatMessage(
              {
                id: 'success import csv',
                defaultMessage: `${translatedTypePrefix} {number, plural, one {was} other {were}} imported.`
              },
              {
                number: resultImport.total.success,
                importType: selectedType
              }
            )}
            action={
              <DownloadButton
                data={resultImport.successfulImport}
                filename={SUCCESS_IMPORT}
              />
            }
          />
        </>
      )}
      {resultImport && resultImport.total.failure > 0 && (
        <>
          <Alert
            severity="error"
            title={formatMessage(
              {
                id: 'failure import csv',
                defaultMessage: `${translatedTypePrefix} {number, plural, one {was} other {were}} not imported.`
              },
              {
                number: resultImport.total.failure,
                importType: selectedType
              }
            )}
            action={
              <DownloadButton
                data={resultImport.failureImport}
                filename={FAILURE_IMPORT}
              />
            }
          />
        </>
      )}
    </>
  );
};

Step4.propTypes = {};

export default Step4;
