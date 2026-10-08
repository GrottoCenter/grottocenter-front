import PropTypes from 'prop-types';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { Box, TextField } from '@mui/material';
import { isNearLengthLimit } from '@/utils/textLengthLimits';

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
  testId,
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
        const limit = characterLimit ?? maxLength;
        const isTooLong = limit !== undefined && characterCount > limit;
        const lengthError =
          isTooLong || fieldState.error?.type === 'maxLength'
            ? formatMessage(
                { id: 'form.maxLength' },
                {
                  limit: characterLimit ?? maxLength,
                  count: characterCount
                }
              )
            : null;
        const shouldShowCounter =
          characterLimit !== undefined ||
          isNearLengthLimit(characterCount, maxLength);
        const displayedHelperText = shouldShowCounter ? (
          <Box
            component="span"
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%'
            }}>
            <span>
              {helperText && <span>{helperText}</span>}
              {helperText && lengthError && <br />}
              {lengthError && <span>{lengthError}</span>}
            </span>
            <Box
              component="span"
              sx={{ color: isTooLong ? 'error.main' : 'text.secondary' }}>
              {characterCount} / {limit}
            </Box>
          </Box>
        ) : (
          lengthError || helperText
        );

        return (
          <TextField
            data-testid={testId}
            fullWidth
            label={formatMessage({ id: labelName })}
            type={type}
            error={isError || isTooLong}
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
  testId: PropTypes.string,
  maxLength: PropTypes.number,
  characterLimit: PropTypes.number,
  characterLimitOverflow: PropTypes.number,
  isRequired: PropTypes.bool,
  isDisabled: PropTypes.bool
};

export default InputText;
