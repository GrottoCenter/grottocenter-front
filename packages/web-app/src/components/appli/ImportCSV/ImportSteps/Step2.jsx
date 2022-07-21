import React, { useContext, useEffect, useState } from 'react';
import { CSVReader } from 'react-papaparse';
import { useTheme } from '@material-ui/core/styles';
import { useIntl } from 'react-intl';
import Alert from '../../../common/Alert';
import { ImportPageContentContext } from '../Provider';
import checkData from '../checkData';

const inputRef = React.createRef();

const Step2 = () => {
  const { updateAttribute, selectedType } = useContext(
    ImportPageContentContext
  );
  const theme = useTheme();
  const { formatMessage } = useIntl();

  const [rowErrors, setRowErrors] = useState([]);

  const handleOnFileLoad = data => {
    const errors = checkData(data, selectedType, formatMessage);
    if (errors.length === 0) {
      updateAttribute('importData', data);
      updateAttribute('fileImported', true);
    } else {
      setRowErrors(errors);
    }
  };

  const handleOnRemoveFile = () => {
    setRowErrors([]);
    updateAttribute('fileImported', false);
  };

  const transformHeader = header => header.trim();

  // react-papaparse reset its content if go back to that step, so do we.
  useEffect(() => {
    updateAttribute('importData', undefined);
    updateAttribute('fileImported', false);
  }, [updateAttribute]);

  return (
    <>
      <CSVReader
        ref={inputRef}
        onFileLoad={handleOnFileLoad}
        onRemoveFile={handleOnRemoveFile}
        addRemoveButton
        isReset={false}
        progressBarColor={theme.palette.primary1Color}
        config={{
          transformHeader,
          header: true,
          skipEmptyLines: true
        }}>
        <span>
          {formatMessage({ id: 'Drop CSV file here or click to upload.' })}
        </span>
      </CSVReader>
      {rowErrors.map(err => (
        <Alert
          content={`${formatMessage({ id: 'Row' })} ${err.row} : ${
            err.errorMessage
          }`}
          key={err.row + err.errorMessage}
          severity="error"
        />
      ))}
    </>
  );
};

Step2.propTypes = {};

export default Step2;
