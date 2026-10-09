import { useController } from 'react-hook-form';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import CaveAutoCompleteSearch from '../../../common/AutoCompleteSearch/CaveAutoCompleteSearch';

// `value` is the currently selected cave/network (drives the search field's
// display). It is intentionally NOT backed by the shared `cave.name` RHF
// field: that field also holds the name of a newly created cave, and writing
// the searched network's name into it would silently overwrite the user's own
// entrance name once they switch back to "new cave" mode.
const CaveSelection = ({
  control,
  disabled = false,
  value,
  onSelectionChange,
  setValue
}) => {
  const { formatMessage } = useIntl();
  const {
    field: { onChange: onIdChange, onBlur, ref },
    fieldState: { error }
  } = useController({
    control,
    name: 'cave.id',
    rules: { required: formatMessage({ id: 'Required' }) }
  });

  const handleSelection = selection => {
    if (selection?.id) {
      onIdChange(Number(selection.id));
    } else {
      // Cleared via the search's native clear button: drop the linked cave's
      // id and its shared characteristics so nothing stale lingers.
      onIdChange(null);
    }
    const options = { shouldValidate: true, shouldDirty: true };
    setValue('cave.length', selection?.length ?? null, options);
    setValue('cave.depth', selection?.depth ?? null, options);
    setValue('cave.temperature', selection?.temperature ?? null, options);
    setValue('cave.isDiving', Boolean(selection?.isDiving), options);
    onSelectionChange?.(selection);
  };

  return (
    <CaveAutoCompleteSearch
      disabled={disabled}
      required
      onSelection={handleSelection}
      value={value}
      onBlur={onBlur}
      inputRef={ref}
      error={!!error}
      helperText={error?.message}
    />
  );
};

export default CaveSelection;

CaveSelection.propTypes = {
  control: PropTypes.shape({}),
  setValue: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  errors: PropTypes.shape({
    caveName: PropTypes.string
  }),
  value: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string
  }),
  onSelectionChange: PropTypes.func
};
