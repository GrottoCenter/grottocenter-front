import { useController } from 'react-hook-form';
import PropTypes from 'prop-types';

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
  onSelectionChange
}) => {
  const {
    field: { onChange: onIdChange }
  } = useController({
    control,
    name: 'cave.id',
    rules: { required: true }
  });
  const {
    field: { onChange: onLengthChange }
  } = useController({
    control,
    name: 'cave.length'
  });
  const {
    field: { onChange: onDepthChange }
  } = useController({
    control,
    name: 'cave.depth'
  });
  const {
    field: { onChange: onIsDivingChange }
  } = useController({
    control,
    name: 'cave.isDiving'
  });
  const {
    field: { onChange: onTemperatureChange }
  } = useController({
    control,
    name: 'cave.temperature'
  });

  const handleSelection = selection => {
    if (selection?.id) {
      onLengthChange(selection.length ?? null);
      onDepthChange(selection.depth ?? null);
      onTemperatureChange(selection.temperature ?? null);
      onIsDivingChange(Boolean(selection.isDiving));
      onIdChange(Number(selection.id));
    } else {
      // Cleared via the search's native clear button: drop the linked cave's
      // id and its shared characteristics so nothing stale lingers.
      onIdChange(null);
      onLengthChange(null);
      onDepthChange(null);
      onTemperatureChange(null);
      onIsDivingChange(false);
    }
    onSelectionChange?.(selection);
  };

  return (
    <CaveAutoCompleteSearch
      disabled={disabled}
      required
      onSelection={handleSelection}
      value={value}
    />
  );
};

export default CaveSelection;

CaveSelection.propTypes = {
  control: PropTypes.shape({}),
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
