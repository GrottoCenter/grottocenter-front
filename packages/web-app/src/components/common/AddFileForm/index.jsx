import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { FormControl, Button, Typography } from '@material-ui/core';

import styled from 'styled-components';
import { isEmpty, isNil, remove } from 'ramda';
import LicenseSelect from '../../../features/Form/LicenseSelect';
import { DOCUMENT_AUTHORIZE_TO_PUBLISH } from '../../../hooks/useDocumentOptions';
import FilesList from './FilesList';
import DocumentAuthorizationSelect from '../../../features/Form/DocumentAuthorizationSelect';
import ErrorsList from './ErrorsList';
import useFileFormats from '../../../hooks/useFileFormats';
import OptionSelect from './OptionSelect';
import { MAX_SIZE_OF_UPLOADED_FILES } from '../../../conf/Config';
import { IS_DELETED, IS_INTACT, IS_MODIFIED, IS_NEW } from './FileHelpers';

const StyledButton = styled(Button)`
  margin-left: ${({ theme }) => theme.spacing(4)}%;
  margin-right: ${({ theme }) => theme.spacing(4)}%;
`;

const ListWrapper = styled.div`
  margin-left: ${({ theme }) => theme.spacing(4)}%;
  margin-right: ${({ theme }) => theme.spacing(4)}%;
`;

const StyledTypography = styled(Typography)`
  margin-top: ${({ theme }) => theme.spacing(2)}px;
  margin-bottom: ${({ theme }) => theme.spacing(2)}px;
`;

const AddFileForm = ({
  files,
  setFiles,
  option,
  setOption,
  license,
  setLicense,
  authorizationDocument,
  setAuthorizationDocument
}) => {
  const { formatMessage } = useIntl();
  const [errors, setErrors] = useState([]);
  const { mimeTypes, extensions, loading } = useFileFormats();
  const inputRef = useRef();

  const showAuthDocSelect = option === DOCUMENT_AUTHORIZE_TO_PUBLISH;

  const updateOption = newOption => {
    setOption(newOption);
    setAuthorizationDocument(null);
  };

  const updateFiles = newFiles => {
    // newFiles is type of FileList, which is a read only class.
    // It doesn't allow much freedom when it comes to removing or renaming
    const filesArray = Array.from(newFiles);
    const errorsList = [];

    const newAddedFiles = filesArray
      .filter(file => {
        if (file.size && file.size > MAX_SIZE_OF_UPLOADED_FILES) {
          errorsList.push(
            formatMessage(
              {
                id: 'error on file size',
                defaultMessage:
                  'The following file is too big: {file}. Max accepted size: {maxSize}'
              },
              {
                file: file.name,
                maxSize: `${MAX_SIZE_OF_UPLOADED_FILES / 1000000} Mo`
              }
            )
          );
          return false;
        }
        // Refuse files whose name possesses more than 1 dot,
        // or those which are already stored in the prop (comparison on name and extension, and only if the one in the prop is new)
        if (file.name) {
          const nameArray = file.name.split('.');
          if (nameArray.length !== 2) {
            errorsList.push(
              formatMessage(
                {
                  id: 'error on file name',
                  defaultMessage: 'The following file name is invalid : {file}.'
                },
                { file: file.name }
              )
            );
            return false;
          }
          return isNil(
            files.find(
              fileInProp =>
                fileInProp.name === nameArray[0] &&
                fileInProp.extension === nameArray[1] &&
                fileInProp.state === IS_NEW
            )
          );
        }
        return true;
      })
      .map(file => {
        let fileName = '';
        let fileExtension = '';
        // file.name may not be supported (only for Opera Android)
        if (file.name) {
          [fileName, fileExtension] = file.name.split('.');
        }

        return {
          file,
          name: fileName,
          extension: fileExtension,
          state: IS_NEW
        };
      });

    if (isEmpty(errorsList)) {
      setErrors([]);
    } else {
      setErrors(errorsList);
    }
    setFiles([...files, ...newAddedFiles]);
    // The input value is resetted so we can still add the same file (specifically if it has been removed, it's still in the input).
    inputRef.current.value = '';
  };

  // Files is removed if it is new (or previously new), else we change its state.
  const removeFile = index => {
    const newFiles = [...files];
    const removedFile = newFiles[index];
    if (removedFile.state === IS_NEW) {
      setFiles(remove(index, 1, newFiles));
    } else {
      removedFile.previousState = removedFile.state;
      removedFile.state = IS_DELETED;
      setFiles(newFiles);
    }
  };

  const undoRemove = index => {
    const newFiles = [...files];
    const removedFile = newFiles[index];
    removedFile.state = removedFile.previousState || IS_INTACT;
    setFiles(newFiles);
  };

  const updateFileName = index => {
    const newFilesState = [...files];
    const updatedFile = newFilesState[index];
    return newName => {
      updatedFile.name = newName;
      if (updatedFile.state === IS_INTACT) {
        updatedFile.state = IS_MODIFIED;
      }
      setFiles(newFilesState);
    };
  };

  return (
    <>
      <FormControl variant="filled">
        <StyledButton
          disabled={loading}
          color="secondary"
          variant="contained"
          component="label">
          {formatMessage({ id: 'Upload files' })}
          <input
            ref={inputRef}
            multiple
            onChange={event => updateFiles(event.target.files)}
            type="file"
            hidden
            accept={mimeTypes.toString()}
          />
        </StyledButton>
      </FormControl>
      {files.length > 0 && (
        <>
          <ListWrapper>
            <FilesList
              files={files}
              updateFileName={updateFileName}
              removeFile={removeFile}
              undoRemove={undoRemove}
            />
          </ListWrapper>
          <OptionSelect
            label={formatMessage({ id: 'License type' })}
            selectedOption={option}
            updateSelectedOption={updateOption}
          />
          {option && (
            <LicenseSelect
              label={formatMessage({ id: 'License' })}
              selected={license}
              updateSelected={setLicense}
            />
          )}
          {showAuthDocSelect && (
            <DocumentAuthorizationSelect
              label={formatMessage({ id: 'Authorization from authors' })}
              selectedDocument={authorizationDocument}
              updateSelectedDocument={setAuthorizationDocument}
            />
          )}
        </>
      )}
      <ErrorsList errors={errors} />
      <StyledTypography color="textSecondary">
        {formatMessage(
          {
            id: 'Accepted file formats: {extensions}',
            defaultMessage: 'Accepted file formats: {extensions}.'
          },
          {
            extensions: extensions
              .filter(e => e !== null)
              .map(e => e.trim())
              .sort((e1, e2) => e1 > e2)
              .join(', ')
          }
        )}
      </StyledTypography>
    </>
  );
};

AddFileForm.propTypes = {
  files: PropTypes.arrayOf(PropTypes.object).isRequired,
  setFiles: PropTypes.func.isRequired,
  option: PropTypes.string,
  setOption: PropTypes.func.isRequired,
  license: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    text: PropTypes.string
  }),
  setLicense: PropTypes.func.isRequired,
  authorizationDocument: PropTypes.oneOf([PropTypes.string, PropTypes.number]),
  setAuthorizationDocument: PropTypes.func.isRequired
};

export default AddFileForm;
