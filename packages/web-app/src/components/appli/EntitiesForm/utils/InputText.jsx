import PropTypes from 'prop-types';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { Box, TextField } from '@mui/material';

const InputText = ({
  control,
  formKey,
  labelName,
  validatorFn,
  onChangeAdditionalFn,
  isError,
  type = 'text',
  helperText,
  minRows,
  maxLength = undefined,
  characterLimit = undefined,
  characterLimitOverflow = 0,
  isRequired = false,
  isDisabled = false
}) => {
  const { formatMessage } = useIntl();
  return (
    <Controller
      name={formKey}
      control={control}
      rules={{
        required: isRequired,
        maxLength: characterLimit ?? maxLength,
        validate: value =>
          validatorFn ? validatorFn(value, formatMessage) : undefined
      }}
      render={({ field: { ref, value, onChange }, fieldState }) => {
        const characterCount = String(value ?? '').length;
        const lengthError =
          fieldState.error?.type === 'maxLength' && !helperText
            ? formatMessage(
                { id: 'form.maxLength' },
                {
                  limit: characterLimit ?? maxLength,
                  count: characterCount
                }
              )
            : null;
        const lengthHint =
          maxLength && characterCount >= Math.ceil(maxLength * 0.8)
            ? formatMessage(
                { id: 'form.maxLength' },
                { limit: maxLength, count: characterCount }
              )
            : null;
        const displayedHelperText = characterLimit ? (
          <Box
            component="span"
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%'
            }}>
            <span>{helperText || lengthError}</span>
            <span>
              {characterCount} / {characterLimit}
            </span>
          </Box>
        ) : (
          lengthError || lengthHint || helperText
        );

        return (
          <TextField
            fullWidth
            label={formatMessage({ id: labelName })}
            type={type}
            error={isError}
            required={isRequired}
            helperText={displayedHelperText}
            disabled={isDisabled ? true : undefined}
            multiline={minRows ? true : undefined}
            minRows={minRows || undefined}
            slotProps={
              characterLimit || maxLength
                ? {
                    htmlInput: {
                      maxLength: characterLimit
                        ? characterLimit + characterLimitOverflow
                        : maxLength
                    }
                  }
                : undefined
            }
            inputRef={ref}
            value={value}
            onChange={e => {
              onChange(e);
              if (onChangeAdditionalFn) onChangeAdditionalFn(e);
            }}
          />
        );
      }}
    />
  );
};

InputText.propTypes = {
  control: PropTypes.shape({}).isRequired,
  formKey: PropTypes.string.isRequired,
  labelName: PropTypes.string.isRequired,
  isError: PropTypes.bool.isRequired,
  validatorFn: PropTypes.func,
  onChangeAdditionalFn: PropTypes.func,
  type: PropTypes.string,
  helperText: PropTypes.node,
  minRows: PropTypes.number,
  maxLength: PropTypes.number,
  characterLimit: PropTypes.number,
  characterLimitOverflow: PropTypes.number,
  isRequired: PropTypes.bool,
  isDisabled: PropTypes.bool
};

export default InputText;
