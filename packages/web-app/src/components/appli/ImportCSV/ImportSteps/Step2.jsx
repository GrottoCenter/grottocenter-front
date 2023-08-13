import React, { useContext, useEffect, useState } from 'react';
import { useCSVReader, formatFileSize } from 'react-papaparse';
import { useIntl } from 'react-intl';
import Alert from '../../../common/Alert';
import { ImportPageContentContext } from '../Provider';
import checkData from '../checkData';

// From https://github.com/Bunlong/react-papaparse/blob/v4.0.0/examples/CSVReaderClickAndDragUpload.tsx
const GREY = '#CCC';
const GREY_LIGHT = 'rgba(255, 255, 255, 0.4)';
const GREY_DIM = '#686868';

const styles = {
  zone: {
    alignItems: 'center',
    border: `2px dashed ${GREY}`,
    borderRadius: 20,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'center',
    padding: 20
  },
  file: {
    background: 'linear-gradient(to bottom, #EEE, #DDD)',
    borderRadius: 20,
    display: 'flex',
    height: 120,
    width: 120,
    position: 'relative',
    zIndex: 10,
    flexDirection: 'column',
    justifyContent: 'center'
  },
  info: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: 10,
    paddingRight: 10
  },
  size: {
    backgroundColor: GREY_LIGHT,
    borderRadius: 3,
    marginBottom: '0.5em',
    justifyContent: 'center',
    display: 'flex'
  },
  name: {
    backgroundColor: GREY_LIGHT,
    borderRadius: 3,
    fontSize: 12,
    marginBottom: '0.5em'
  },
  progressBar: {
    bottom: 14,
    position: 'absolute',
    width: '100%',
    paddingLeft: 10,
    paddingRight: 10
  },
  zoneHover: {
    border: `2px dashed ${GREY_DIM}`
  },
  remove: {
    height: 23,
    position: 'absolute',
    right: 6,
    top: 6,
    width: 23
  }
};

const Step2 = () => {
  const { updateAttribute, selectedType } = useContext(
    ImportPageContentContext
  );

  const { formatMessage } = useIntl();
  const { CSVReader } = useCSVReader();

  const [rowErrors, setRowErrors] = useState([]);
  const [zoneHover, setZoneHover] = useState(false);

  // react-papaparse reset its content if go back to that step, so do we.
  useEffect(() => {
    updateAttribute('importData', undefined);
    updateAttribute('fileImported', false);
  }, [updateAttribute]);

  const handleOnRemove = () => {
    setRowErrors([]);
    updateAttribute('importData', undefined);
    updateAttribute('fileImported', false);
  };

  return (
    <>
      <CSVReader
        config={{
          transformHeader: header => header.trim(),
          header: true,
          skipEmptyLines: true
        }}
        onUploadAccepted={results => {
          const errors = [];
          if (results.errors.length !== 0) {
            const importErrors = results.errors.map(e => ({
              errorMessage: `Import error ${e[0].message}`,
              row: e[0].row + 2
            }));
            errors.push(...importErrors);
          }
          errors.push(...checkData(results.data, selectedType, formatMessage));
          if (errors.length === 0) {
            updateAttribute('importData', results.data);
            updateAttribute('fileImported', true);
            setRowErrors([]);
          } else {
            setRowErrors(errors);
          }
          setZoneHover(false);
        }}
        onDragOver={event => {
          event.preventDefault();
          setZoneHover(true);
        }}
        onDragLeave={event => {
          event.preventDefault();
          setZoneHover(false);
        }}>
        {({
          getRootProps,
          acceptedFile,
          ProgressBar,
          getRemoveFileProps,
          Remove
        }) => (
          <div
            {...getRootProps()}
            style={{
              ...styles.zone,
              ...(zoneHover && styles.zoneHover)
            }}>
            {acceptedFile ? (
              <div style={styles.file}>
                <div style={styles.info}>
                  <span style={styles.size}>
                    {formatFileSize(acceptedFile.size)}
                  </span>
                  <span style={styles.name}>{acceptedFile.name}</span>
                </div>
                <div style={styles.progressBar}>
                  <ProgressBar />
                </div>
                <div
                  role="button"
                  tabIndex="0"
                  onKeyUp={e => {
                    handleOnRemove();
                    getRemoveFileProps().onClick(e);
                  }}
                  onClick={e => {
                    handleOnRemove();
                    getRemoveFileProps().onClick(e);
                  }}
                  style={styles.remove}>
                  <Remove />
                </div>
              </div>
            ) : (
              formatMessage({ id: 'Drop CSV file here or click to upload.' })
            )}
          </div>
        )}
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
