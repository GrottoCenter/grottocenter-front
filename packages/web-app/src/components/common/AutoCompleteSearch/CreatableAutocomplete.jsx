import { createElement, useRef } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Autocomplete, Box } from '@mui/material';
import EntityCreationIcon from '@/components/common/EntityCreationIcon';

const entityOptionType = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
});

// MUI scrolls against the whole listbox. Leave room for the sticky actions so
// keyboard-highlighted results remain visible above them.
const revealHighlightedResult = input => {
  const doc = input.ownerDocument;
  const list = doc.getElementById(input.getAttribute('aria-controls'));
  const option = doc.getElementById(
    input.getAttribute('aria-activedescendant')
  );
  const actions = list?.querySelector('[data-creation-actions]');
  if (!option || !actions || actions.contains(option)) return;
  const overlap =
    option.getBoundingClientRect().bottom - actions.getBoundingClientRect().top;
  if (overlap > 0) list.scrollTop += Math.ceil(overlap);
};

// Creation uses real autocomplete options so pointer and keyboard interactions
// share the same list. An action opens its dialog without changing the value.
// This server-search selector deliberately exposes a limited MUI API: filtering,
// grouping, highlighting and keyboard activation belong to this component.
const CreatableAutocomplete = ({
  options,
  value,
  inputValue,
  onChange,
  onInputChange,
  renderInput,
  renderValue,
  isOptionEqualToValue,
  multiple,
  filterSelectedOptions,
  clearOnBlur,
  fullWidth,
  disabled,
  creationActions = [],
  getOptionLabel,
  renderOption,
  loading = false,
  loadingText,
  noOptionsText
}) => {
  const { formatMessage } = useIntl();
  const loadingLabel = loadingText ?? formatMessage({ id: 'Loading ...' });
  const highlightedActionIdRef = useRef(null);
  const actions = creationActions.map(action => ({
    ...action,
    isCreationAction: true
  }));

  const handleCreate = (event, action) => {
    event.preventDefault();
    action.onClick();
  };

  return createElement(Autocomplete, {
    // Clicks and typing open the list. Restoring focus after creation keeps it
    // closed so it cannot cover the next field or the form's submit button.
    options,
    value,
    inputValue,
    onChange,
    onInputChange,
    renderInput,
    renderValue,
    isOptionEqualToValue,
    multiple,
    filterSelectedOptions,
    clearOnBlur,
    fullWidth,
    disabled,
    // Each row owns its padding; avoid a dead strip below the last action.
    slotProps: { listbox: { sx: { p: 0 } } },
    loading,
    loadingText: loadingLabel,
    noOptionsText,
    filterOptions: available => {
      if (!actions.length) return available;
      const suggestions = available.length
        ? available
        : [{ isSearchHint: true }];
      return [...suggestions, ...actions];
    },
    groupBy: option => (option.isCreationAction ? 'creation' : 'results'),
    renderGroup: group =>
      createElement(
        Box,
        {
          key: group.key,
          component: 'li',
          role: 'presentation',
          'data-creation-actions': group.group === 'creation' || undefined,
          sx:
            group.group === 'creation'
              ? {
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 1,
                  bgcolor: 'background.paper',
                  borderTop: 1,
                  borderColor: 'divider'
                }
              : undefined
        },
        <Box component="ul" role="presentation" sx={{ p: 0, m: 0 }}>
          {group.children}
        </Box>
      ),
    getOptionLabel: option => {
      if (option.isCreationAction) return option.label;
      if (option.isSearchHint) return '';
      return getOptionLabel(option);
    },
    getOptionDisabled: option => !!option.isSearchHint,
    onHighlightChange: (event, option, reason) => {
      highlightedActionIdRef.current = option?.isCreationAction
        ? option.id
        : null;
      if (
        reason === 'keyboard' &&
        event?.target?.getAttribute('role') === 'combobox'
      ) {
        const input = event.target;
        requestAnimationFrame(() => revealHighlightedResult(input));
      }
    },
    onClose: () => {
      highlightedActionIdRef.current = null;
    },
    onKeyDown: event => {
      const action = actions.find(
        item => item.id === highlightedActionIdRef.current
      );
      if (event.key === 'Enter' && action) {
        // MUI must not select this action or reset the user's search text.
        Object.assign(event, { defaultMuiPrevented: true });
        handleCreate(event, action);
      }
    },
    renderOption: (optionProps, option) => {
      if (!option.isCreationAction && !option.isSearchHint)
        return renderOption(optionProps, option);
      const { key, ...itemProps } = optionProps;
      if (option.isSearchHint) {
        return createElement(
          Box,
          {
            ...itemProps,
            key: 'search-hint',
            component: 'li',
            sx: {
              typography: 'body2',
              color: 'text.secondary',
              '&&[aria-disabled="true"]': { opacity: 1 }
            }
          },
          loading ? loadingLabel : noOptionsText
        );
      }
      return createElement(
        Box,
        {
          ...itemProps,
          key: `create-${option.id}`,
          component: 'li',
          'data-testid': option.testId,
          onMouseDown: event => event.preventDefault(),
          onClick: event => handleCreate(event, option),
          sx: {
            '&&': {
              typography: 'body1',
              color: 'primary.main',
              minHeight: 48,
              gap: 1.25,
              py: 1
            }
          }
        },
        <Box
          component="span"
          aria-hidden
          sx={{ display: 'inline-flex', flexShrink: 0 }}>
          <EntityCreationIcon iconType={option.iconType} size={30} />
        </Box>,
        option.label
      );
    }
  });
};

CreatableAutocomplete.propTypes = {
  options: PropTypes.arrayOf(entityOptionType).isRequired,
  value: PropTypes.oneOfType([
    entityOptionType,
    PropTypes.arrayOf(entityOptionType)
  ]),
  inputValue: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onInputChange: PropTypes.func.isRequired,
  renderInput: PropTypes.func.isRequired,
  renderValue: PropTypes.func,
  isOptionEqualToValue: PropTypes.func.isRequired,
  multiple: PropTypes.bool,
  filterSelectedOptions: PropTypes.bool,
  clearOnBlur: PropTypes.bool,
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  creationActions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      iconType: PropTypes.string.isRequired,
      testId: PropTypes.string
    })
  ),
  getOptionLabel: PropTypes.func.isRequired,
  renderOption: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  loadingText: PropTypes.node,
  noOptionsText: PropTypes.node
};

export default CreatableAutocomplete;
