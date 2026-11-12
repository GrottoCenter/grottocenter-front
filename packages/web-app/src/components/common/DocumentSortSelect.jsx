import { useId, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, MenuItem, Select, Tooltip } from '@mui/material';
import SwapVertIcon from '@mui/icons-material/SwapVert';

import { useIsDesktopLayout } from '@/hooks/useIsDesktopLayout';
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
  const isDesktop = useIsDesktopLayout();
  const descriptionId = useId();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    [DOCUMENT_SORT_ORDERS.TYPE]: formatMessage({ id: 'Document type' }),
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
  const sortLabel = formatMessage({ id: 'Sort by' });
  const tooltip = formatMessage(
    { id: 'documentsSort.optionLabel' },
    { criterion: sortLabel, direction: labels[value] }
  );
  return (
    <Box
      role="presentation"
      onClick={event => event.stopPropagation()}
      sx={{
        display: 'inline-flex',
        flexShrink: 0,
        '@media print': { display: 'none' }
      }}>
      <span id={descriptionId} hidden>
        {labels[value]}
      </span>
      <Tooltip title={!isDesktop && !isMenuOpen ? tooltip : ''} describeChild>
        <Select
          variant="standard"
          disableUnderline
          value={value}
          onOpen={() => setIsMenuOpen(true)}
          onClose={() => setIsMenuOpen(false)}
          onChange={event => onChange(event.target.value)}
          inputProps={{
            'aria-label': sortLabel,
            'aria-describedby': descriptionId
          }}
          renderValue={selected => (
            <>
              <SwapVertIcon fontSize="small" />
              {isDesktop && labels[selected]}
            </>
          )}
          // A control, not content: it stays muted and a notch below the body size
          // so it reads without competing with the list it acts on.
          sx={theme => ({
            flexShrink: 0,
            width: isDesktop ? undefined : 44,
            color: 'text.secondary',
            '& .MuiSelect-icon': { display: isDesktop ? undefined : 'none' },
            '&& .MuiSelect-select': {
              display: 'flex',
              alignItems: 'center',
              justifyContent: isDesktop ? undefined : 'center',
              minHeight: isDesktop ? undefined : 44,
              boxSizing: 'border-box',
              gap: 0.5,
              fontSize: theme.typography.body2.fontSize,
              paddingTop: 0,
              paddingBottom: 0,
              paddingInline: isDesktop ? undefined : theme.spacing(1)
            }
          })}>
          {Object.entries(labels).map(([order, label]) => (
            <MenuItem key={order} value={order}>
              {label}
            </MenuItem>
          ))}
        </Select>
      </Tooltip>
    </Box>
  );
};

DocumentSortSelect.propTypes = {
  value: PropTypes.oneOf(Object.values(DOCUMENT_SORT_ORDERS)).isRequired,
  onChange: PropTypes.func.isRequired
};

export default DocumentSortSelect;
