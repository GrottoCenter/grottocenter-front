import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { MenuItem, Select } from '@mui/material';
import SwapVertIcon from '@mui/icons-material/SwapVert';

import { DOCUMENT_SORT_ORDERS } from '@/utils/documentSort';

/**
 * The sort control for every list of documents — the ones attached to an entity
 * and the children of a collection. The label table lives here and nowhere else,
 * so the two lists can never drift into naming the same order differently.
 *
 * Composed from the labels the app already had rather than five new sentences:
 * the criterion and the direction are separate ideas and are already translated
 * in every language as such.
 */
const DocumentSortSelect = ({ value, onChange }) => {
  const { formatMessage } = useIntl();
  const option = (criterion, direction) =>
    formatMessage(
      { id: 'documentsSort.optionLabel' },
      {
        criterion: formatMessage({ id: criterion }),
        direction: formatMessage({ id: direction })
      }
    );
  // The criterion is the bare noun, not "Publication date" / "Date added": the
  // direction that follows already says a date is what is being compared, and
  // the option has to stay readable inside the closed select.
  const labels = {
    [DOCUMENT_SORT_ORDERS.PUBLICATION_DESC]: option(
      'Publication',
      'Newest first'
    ),
    [DOCUMENT_SORT_ORDERS.PUBLICATION_ASC]: option(
      'Publication',
      'Oldest first'
    ),
    [DOCUMENT_SORT_ORDERS.ADDED_DESC]: option('Added', 'Newest first'),
    [DOCUMENT_SORT_ORDERS.ADDED_ASC]: option('Added', 'Oldest first'),
    [DOCUMENT_SORT_ORDERS.TITLE]: formatMessage({ id: 'Title' })
  };
  return (
    <Select
      variant="standard"
      disableUnderline
      value={value}
      onChange={event => onChange(event.target.value)}
      inputProps={{ 'aria-label': formatMessage({ id: 'Sort by' }) }}
      renderValue={selected => (
        <>
          <SwapVertIcon fontSize="small" />
          {labels[selected]}
        </>
      )}
      // A control, not content: it stays muted and a notch below the body size
      // so it reads without competing with the list it acts on.
      sx={theme => ({
        flexShrink: 0,
        color: 'text.secondary',
        '& .MuiSelect-select': {
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          fontSize: theme.typography.body2.fontSize,
          paddingTop: 0,
          paddingBottom: 0
        }
      })}>
      {Object.entries(labels).map(([order, label]) => (
        <MenuItem key={order} value={order}>
          {label}
        </MenuItem>
      ))}
    </Select>
  );
};

DocumentSortSelect.propTypes = {
  value: PropTypes.oneOf(Object.values(DOCUMENT_SORT_ORDERS)).isRequired,
  onChange: PropTypes.func.isRequired
};

export default DocumentSortSelect;
