import { FormControl as MuiFormControl, FormLabel } from '@mui/material';
import { React } from 'react';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Dropzone from 'react-dropzone-uploader';
import { MAX_ORGANIZATION_LOGO_SIZE_IN_BYTES } from '../../../../conf/config';
import 'react-phone-input-2/lib/style.css';
import 'react-dropzone-uploader/dist/styles.css';

const FormControl = styled(MuiFormControl)`
  padding-bottom: ${({ theme }) => theme.spacing(4)};
`;

const Uploader = ({ control, errors }) => {
  const { formatMessage } = useIntl();

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
                maxSizeBytes={MAX_ORGANIZATION_LOGO_SIZE_IN_BYTES}
                inputWithFilesContent={files => `${1 - files.length} more`}
                submitButtonDisabled={false}
                accept="image/*"
                inputContent={(files, extra) =>
                  extra.reject
                    ? formatMessage({ id: 'Image only' })
                    : formatMessage({ id: 'Drag and drop your logo here' })
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
  control: PropTypes.shape({}).isRequired,
  errors: PropTypes.shape({
    organization: PropTypes.shape({
      logo: PropTypes.shape({ message: PropTypes.string })
    })
  })
};

export default Uploader;
