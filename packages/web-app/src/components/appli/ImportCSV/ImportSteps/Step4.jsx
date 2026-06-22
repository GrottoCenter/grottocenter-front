import React, { useContext, useEffect } from 'react';
import { Box, Link, Typography } from '@mui/material';
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
import { FAILURE_IMPORT, SUCCESS_IMPORT } from '../constants';
import Alert from '../../../common/Alert';
import DownloadButton from '../DownloadButton';
import { useOpenBi } from '../../../../hooks';

const Step4 = () => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const { openBi, isOpening } = useOpenBi();
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
              defaultMessage:
                "{number} entities are already present in Grottocenter and won't be imported."
            },
            {
              number: wontBeCreateData.length
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
              defaultMessage: '{number} entities will be imported.'
            },
            {
              number: willBeCreatedData.length
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
                defaultMessage:
                  '{number} entities will be imported as duplicates.'
              },
              {
                number: willBeCreatedAsDuplicatesData.length
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
              defaultMessage: '{number} entities have been imported as duplicates.'
            },
            {
              number: resultImport.total.successfulImportAsDuplicates
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
              defaultMessage: '{number} entities have been imported.'
            },
            {
              number: resultImport.total.success
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
              defaultMessage: '{number} entities failed to be imported.'
            },
            {
              number: resultImport.total.failure
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
      {resultImport &&
        (resultImport.total.success > 0 ||
          resultImport.total.successfulImportAsDuplicates > 0) && (
          <Typography sx={{ mt: 2 }}>
            <Link
              component="button"
              type="button"
              onClick={openBi}
              disabled={isOpening}
              sx={{ opacity: isOpening ? 0.5 : 1 }}>
              {formatMessage({
                id: 'View your imported data on the statistics dashboard'
              })}
            </Link>
          </Typography>
        )}
    </>
  );
};

Step4.propTypes = {};

export default Step4;
