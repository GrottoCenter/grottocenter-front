import { FormControl as MuiFormControl, FormLabel } from '@material-ui/core';
import { React, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useHistory } from 'react-router-dom';
import Dropzone from 'react-dropzone-uploader';
import { usePermissions } from '../../../../hooks/usePermissions';
import 'react-phone-input-2/lib/style.css';
import 'react-dropzone-uploader/dist/styles.css';

const FormControl = styled(MuiFormControl)`
  padding-bottom: ${({ theme }) => theme.spacing(4)}px;
`;

const Uploader = ({ control, errors }) => {
  const history = useHistory();
  const permissions = usePermissions();
  const { formatMessage } = useIntl();
  useEffect(() => {
    if (!permissions.isAuth) {
      history.push('');
    }
  }, [permissions, history]);

  const LOGO_SIZE_IN_BYTES = 10485760; // 10MB
  return (
    <div>
      <FormControl component="fieldset" style={{ width: '50vh' }}>
        <FormLabel>{formatMessage({ id: 'Upload a logo' })}</FormLabel>
        <Controller
          name="organization.logo"
          control={control}
          fullwidth
          render={({ field: { onChange } }) => (
            <FormControl
              component="fieldset"
              error={!!errors?.organization?.logo}>
              <Dropzone
                onChangeStatus={onChange}
                maxFiles={1}
                maxSizeBytes={LOGO_SIZE_IN_BYTES}
                inputWithFilesContent={files => `${1 - files.length} more`}
                submitButtonDisabled={false}
                accept="image/*"
                inputContent={(files, extra) =>
                  extra.reject
                    ? formatMessage({ id: 'Image only' })
                    : formatMessage({ id: 'Drag your logo' })
                }
                styles={{
                  dropzone: { width: 400, height: 200 },
                  dropzoneActive: { borderColor: 'green' },
                  inputLabel: (files, extra) =>
                    extra.reject ? { color: 'red' } : {}
                }}
              />
            </FormControl>
          )}
        />
      </FormControl>
    </div>
  );
};
Uploader.propTypes = {
  control: PropTypes.shape({}),
  errors: PropTypes.shape({
    organization: PropTypes.shape({
      logo: PropTypes.shape({ message: PropTypes.string })
    })
  })
};

export default Uploader;
