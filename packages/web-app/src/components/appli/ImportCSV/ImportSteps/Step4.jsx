import React, { useContext, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import PublishIcon from '@mui/icons-material/Publish';
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

// https://formatjs.io/docs/core-concepts/icu-syntax/#select-format
// TODO: this is causing translation error and thus, is not translated in other languages than english.
// This needs to be rewordked & simplified.
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
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const importCsv = useSelector(state => state.importCsv);
  const { importData, selectedType } = useContext(ImportPageContentContext);

  const {
    willBeCreated: willBeCreatedData,
    willBeCreatedAsDuplicates: willBeCreatedAsDuplicatesData,
    wontBeCreated: wontBeCreateData
  } = importCsv.resultCheck;
  const { resultImport } = importCsv;

  const handleOnClick = () => {
    dispatch(
      importRows(
        [...willBeCreatedData, ...willBeCreatedAsDuplicatesData],
        selectedType
      )
    );
  };

  useEffect(() => {
    dispatch(checkRowsInBdd(selectedType, importData));
    return () => {
      dispatch(resetImportState());
    };
  }, [dispatch, selectedType, importData]);

  const somethingWillBeCreated =
    (willBeCreatedData && willBeCreatedData.length > 0) ||
    (willBeCreatedAsDuplicatesData && willBeCreatedAsDuplicatesData.length > 0);

  return (
    <>
      <Typography>
        {formatMessage({
          id: 'The functionality to check for duplicates has not been fully implemented.'
        })}
        &nbsp;
        {formatMessage({
          id: 'Please be careful not to import any documents or entrances which are already present in Grottocenter.'
        })}
      </Typography>
      {importCsv.isLoading && (
        <Typography>
          {formatMessage({ id: 'Processing, this may take some time...' })}
        </Typography>
      )}

      {importCsv.error && <Typography>{importCsv.error}</Typography>}

      {wontBeCreateData && wontBeCreateData.length > 0 && (
        <Alert
          severity="error"
          title={formatMessage(
            {
              id: 'csvImport.willNotBeImported',
              defaultMessage: `${translatedTypePrefix} {number, plural, one {is} other {are}} already present in Grottocenter and won't be imported.`
            },
            {
              number: wontBeCreateData.length,
              importType: selectedType
            }
          )}
          content={`${formatMessage({
            id: wontBeCreateData.length === 1 ? 'Row:' : 'Rows:'
          })} ${wontBeCreateData.map(row => `${row.line}`).join(',')}`}
        />
      )}

      {willBeCreatedData && willBeCreatedData.length > 0 && (
        <Alert
          severity="info"
          title={formatMessage(
            {
              id: 'csvImport.willBeImported',
              defaultMessage: `${translatedTypePrefix} will be imported.`
            },
            {
              number: willBeCreatedData.length,
              importType: selectedType,
              translatedTypePrefix
            }
          )}
        />
      )}

      {willBeCreatedAsDuplicatesData &&
        willBeCreatedAsDuplicatesData.length > 0 && (
          <Alert
            severity="warning"
            title={formatMessage(
              {
                id: 'csvImport.willBeImportedAsDuplicates',
                defaultMessage: `${translatedTypePrefix} will be imported as duplicate(s).`
              },
              {
                number: willBeCreatedAsDuplicatesData.length,
                importType: selectedType,
                translatedTypePrefix
              }
            )}
          />
        )}

      {somethingWillBeCreated && (
        <Box textAlign="center">
          <ActionButton
            label={formatMessage({ id: 'Import' })}
            onClick={handleOnClick}
            loading={importCsv.isLoading}
            icon={<PublishIcon />}
          />
        </Box>
      )}

      {resultImport && resultImport.total.successfulImportAsDuplicates > 0 && (
        <Alert
          severity="warning"
          title={formatMessage(
            {
              id: 'csvImport.successAsDuplicatesRecap',
              defaultMessage: `${translatedTypePrefix} {number, plural, one {was} other {were}} imported as duplicate(s).`
            },
            {
              number: resultImport.total.successfulImportAsDuplicates,
              importType: selectedType
            }
          )}
          action={
            <DownloadButton
              data={resultImport.successfulImportAsDuplicates}
              filename={SUCCESS_IMPORT}
            />
          }
        />
      )}
      {resultImport && resultImport.total.success > 0 && (
        <Alert
          severity="success"
          title={formatMessage(
            {
              id: 'csvImport.successRecap',
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
      )}
      {resultImport && resultImport.total.failure > 0 && (
        <Alert
          severity="error"
          title={formatMessage(
            {
              id: 'csvImport.errorRecap',
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
      )}
    </>
  );
};

Step4.propTypes = {};

export default Step4;
