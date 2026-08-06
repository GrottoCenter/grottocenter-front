import { useContext, useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import PublishIcon from '@mui/icons-material/Publish';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { ImportPageContentContext } from '../Provider';
import {
  checkRowsInBdd,
  importDocumentRows,
  importEntranceRows
} from '../../../../actions/ImportCsv';
import ActionButton from '../../../common/ActionButton';
import { ENTRANCE, STEP_IMPORT } from '../constants';
import Alert from '../../../common/Alert';

// Step 4 — Confirmation: shows the dry-run review (what will / won't be
// imported) and triggers the import. The actual execution, progress and result
// live on step 5 (Import); this step advances there as soon as the submission
// is accepted, so a rejected submission (e.g. a 403) stays here and can be
// retried.
const Step4 = () => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const importCsv = useSelector(state => state.importCsv);
  const { importData, selectedType, updateCurrentStep } = useContext(
    ImportPageContentContext
  );

  const {
    willBeCreated: willBeCreatedData,
    willBeCreatedAsDuplicates: willBeCreatedAsDuplicatesData,
    wontBeCreated: wontBeCreateData
  } = importCsv.resultCheck;
  const { batchId, isPolling, resultImport } = importCsv;

  const isEntranceImport = selectedType === ENTRANCE;

  const handleOnClick = () => {
    const rows = [...willBeCreatedData, ...willBeCreatedAsDuplicatesData];
    if (isEntranceImport) {
      dispatch(importEntranceRows(rows));
    } else {
      dispatch(importDocumentRows(rows));
    }
  };

  // Move to the Import step only once the submission is accepted: an async
  // entrance import sets batchId/isPolling, a synchronous documents import sets
  // resultImport. A failed submission (403, 500) sets none of these, so we stay
  // here with the error shown and the button available for a retry.
  useEffect(() => {
    if (batchId || resultImport || isPolling) {
      updateCurrentStep(STEP_IMPORT);
    }
  }, [batchId, resultImport, isPolling, updateCurrentStep]);

  // Only trigger the check-rows dry-run when landing on this step fresh. If an
  // import is already ongoing or completed (batchId/resultImport set), the
  // effect above forwards to step 5 instead of re-running a check-rows POST for
  // thousands of rows. Captured once so the guard doesn't flip mid-render.
  const skipInitialCheck = useRef(
    importCsv.batchId !== null || importCsv.resultImport !== null
  );

  useEffect(() => {
    if (!skipInitialCheck.current) {
      dispatch(checkRowsInBdd(selectedType, importData));
    }
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

      {/* Loading feedback while the initial dry-run or the submission is in
          flight — both set isLoading and we stay on this step until it
          resolves, so a generic message fits both. Once the submission is
          accepted the effect advances to the Import step. */}
      {importCsv.isLoading && (
        <Typography>
          {formatMessage({ id: 'Processing, this may take some time...' })}
        </Typography>
      )}

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

      {/* Submit / check rejection (e.g. the 403 "not authorized" body).
          Grottocenter uses the English string itself as the translation key, so
          formatMessage localizes known messages and falls back to the raw text
          otherwise. Shown here — right above the Import button — because a
          rejected submission keeps the user on this step to retry. */}
      {importCsv.error && (
        <Alert
          data-testid="csv-import-error-alert"
          severity="error"
          title={formatMessage({
            id: importCsv.error,
            defaultMessage: importCsv.error
          })}
        />
      )}

      {somethingWillBeCreated && (
        <Box textAlign="center">
          <ActionButton
            data-testid="csv-import-submit-button"
            label={formatMessage({ id: 'Import' })}
            onClick={handleOnClick}
            loading={importCsv.isLoading}
            icon={<PublishIcon />}
          />
        </Box>
      )}
    </>
  );
};

Step4.propTypes = {};

export default Step4;
