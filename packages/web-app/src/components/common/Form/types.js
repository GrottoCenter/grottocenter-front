import PropTypes from 'prop-types';

export const FormAutoCompleteTypes = {
  autoCompleteSearch: PropTypes.node,
  children: PropTypes.node,
  getValueName: PropTypes.func.isRequired,
  hasError: PropTypes.bool.isRequired,
  helperContent: PropTypes.node,
  isSideActionOpen: PropTypes.bool,
  label: PropTypes.string.isRequired,
  onSideAction: PropTypes.func,
  required: PropTypes.bool.isRequired,
  resultEndAdornment: PropTypes.node,
  sideActionDisabled: PropTypes.bool,
  sideActionIcon: PropTypes.node,
  value: PropTypes.any
};

export const MultipleSelectTypes = {
  children: PropTypes.node,
  computeHasError: PropTypes.func.isRequired,
  getOptionLabel: PropTypes.func.isRequired,
  getOptionSelected: PropTypes.func.isRequired,
  helperText: PropTypes.string.isRequired,
  isLoading: PropTypes.bool,
  isSideActionOpen: PropTypes.bool,
  labelName: PropTypes.string.isRequired,
  loadSearchResults: PropTypes.func.isRequired, // should load new search results according to the search string entered by the user
  nbCharactersNeededToLaunchSearch: PropTypes.number,
  noOptionsText: PropTypes.node,
  onSideAction: PropTypes.func,
  renderOption: PropTypes.func,
  required: PropTypes.bool,
  resetSearchResults: PropTypes.func.isRequired, // should reset all the search results
  searchError: PropTypes.string,
  searchResults: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  sideActionDisabled: PropTypes.bool,
  sideActionIcon: PropTypes.node
};

export const MultipleSelectWithOptionsTypes = {
  computeHasError: PropTypes.func.isRequired,
  getOptionLabel: PropTypes.func.isRequired,
  getOptionSelected: PropTypes.func.isRequired,
  helperText: PropTypes.string.isRequired,
  labelName: PropTypes.string.isRequired,
  noOptionsText: PropTypes.node,
  options: PropTypes.arrayOf(PropTypes.shape({})),
  renderOption: PropTypes.func,
  required: PropTypes.bool,
  contextValueName: PropTypes.string.isRequired
};
