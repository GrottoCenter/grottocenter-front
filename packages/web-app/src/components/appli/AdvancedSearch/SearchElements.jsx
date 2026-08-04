import React, { useState, useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import { styled } from '@mui/material/styles';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Box,
  Chip,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
  FormLabel,
  FormHelperText,
  IconButton,
  Slider,
  Select,
  MenuItem,
  Button,
  CardActions,
  useMediaQuery,
  useTheme
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CheckIcon from '@mui/icons-material/Check';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LockIcon from '@mui/icons-material/Lock';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { fetchFieldSearch } from '../../../actions/FieldSearch';
import Translate from '../../common/Translate';
import { AUTOCOMPLETE_DEBOUNCE_DELAY } from '../../../conf/config';

const StyledForm = styled('form')`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
  margin-bottom: 0;
`;

export const SearchForm = ({ children, onSubmit, title }) => (
  <StyledForm
    noValidate
    autoComplete="off"
    onSubmit={event => {
      event.preventDefault();
      document.activeElement?.blur();
      onSubmit();
    }}>
    {!!title && (
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ width: '100%', display: 'block', mb: -0.5 }}>
        <Translate>{title}</Translate>
      </Typography>
    )}
    {children}
  </StyledForm>
);
SearchForm.propTypes = {
  children: PropTypes.node.isRequired,
  onSubmit: PropTypes.func.isRequired,
  title: PropTypes.string
};

export const SearchFormContainer = styled('div')`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
  gap: ${({ theme }) => theme.spacing(1)};

  @media (min-width: 550px) {
    > * {
      flex: 1 1 0px;
    }
  }
`;

export const SearchFieldset = ({
  title,
  children,
  isMultiline = false,
  containerSx
}) => (
  <Box sx={{ width: '100%' }}>
    {title && (
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ display: 'block', mb: '4px', lineHeight: 1.8 }}>
        <Translate>{title}</Translate>
      </Typography>
    )}
    {isMultiline ? (
      children
    ) : (
      <SearchFormContainer sx={containerSx}>{children}</SearchFormContainer>
    )}
  </Box>
);
SearchFieldset.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  isMultiline: PropTypes.bool,
  containerSx: PropTypes.object
};

const StyledTextField = styled(TextField)(({ theme }) => ({
  flex: 1,
  minWidth: '9.375rem',
  maxWidth: '18.75rem',
  '& .MuiOutlinedInput-root': {
    borderRadius: 6,
    backgroundColor: theme.palette.action.hover,
    '& fieldset': { border: 'none' },
    '&:hover': { backgroundColor: theme.palette.action.selected },
    '&.Mui-focused': {
      backgroundColor: theme.palette.background.paper,
      boxShadow: `0 0 0 2px ${theme.palette.primary.main}`
    }
  }
}));

export const SearchText = ({
  label,
  value,
  onChange,
  type = 'text',
  inputMode,
  startIcon
}) => {
  const { formatMessage } = useIntl();
  const translatedLabel = formatMessage({ id: label });
  return (
    <StyledTextField
      type={type}
      size="small"
      variant="outlined"
      placeholder={translatedLabel}
      inputProps={{ 'aria-label': translatedLabel }}
      onChange={event => onChange(event.target.value)}
      value={value}
      slotProps={{
        input: {
          inputMode,
          ...(startIcon
            ? {
                startAdornment: (
                  <InputAdornment position="start">{startIcon}</InputAdornment>
                )
              }
            : {})
        }
      }}
    />
  );
};
SearchText.propTypes = {
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  type: PropTypes.string,
  inputMode: PropTypes.string,
  startIcon: PropTypes.node
};

/** Accepts non-negative integers only (digits 0-9, no decimals or negatives). Use for fields like "Source ID" and "Pages". */
export const SearchNumberText = ({ label, value, onChange, min = 0 }) => {
  const { formatMessage } = useIntl();
  const numValue = value === '' ? '' : Number(value);
  const decrement = () => onChange(String(Math.max(min, (numValue || 0) - 1)));
  const increment = () => onChange(String((numValue || 0) + 1));
  return (
    <StyledTextField
      size="small"
      variant="outlined"
      placeholder={formatMessage({ id: label })}
      inputMode="numeric"
      value={value}
      onChange={e => {
        const v = e.target.value;
        if (v === '' || /^\d+$/.test(v)) onChange(v);
      }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <IconButton
                size="small"
                onClick={decrement}
                disabled={numValue === min || value === ''}
                edge="start">
                <RemoveIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" onClick={increment} edge="end">
                <AddIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          )
        }
      }}
    />
  );
};
SearchNumberText.propTypes = {
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  min: PropTypes.number
};

const StyledAutoCompleteItem = styled('li')`
  justify-content: space-between !important;
  gap: 3px;
`;

export const SearchTextAutocomplete = ({
  ressourceType,
  ressourceField,
  ressourceFilter,
  label,
  value,
  onChange
}) => {
  const { formatMessage } = useIntl();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef(new Map());
  const debounceTimer = useRef(null);

  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  const updateOption = async query => {
    setLoading(true);
    const filter = { ...ressourceFilter };
    if (filter[ressourceField]) delete filter[ressourceField];
    const cacheKey = JSON.stringify({
      entity: ressourceType,
      field: ressourceField,
      filter,
      query
    });

    if (cacheRef.current.has(cacheKey)) {
      setOptions(cacheRef.current.get(cacheKey));
      setLoading(false);
      return;
    }

    setOptions([]);
    try {
      const r = await fetchFieldSearch({
        entity: ressourceType,
        field: ressourceField,
        filter,
        query
      });
      const hits = r?.hits ?? [];
      if (cacheRef.current.size >= 50) {
        cacheRef.current.delete(cacheRef.current.keys().next().value);
      }
      cacheRef.current.set(cacheKey, hits);
      setOptions(hits);
    } catch (_) {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Autocomplete
      sx={{
        flex: 1,
        minWidth: '9.375rem',
        maxWidth: '18.75rem'
      }}
      options={options}
      loading={loading}
      loadingText={formatMessage({ id: 'Loading ...' })}
      getOptionLabel={o => (typeof o === 'string' ? o : o[0])}
      onOpen={async () => {
        setOptions([]);
        updateOption('');
      }}
      onInputChange={(event, newInputValue) => {
        onChange(newInputValue);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
          updateOption(newInputValue);
        }, AUTOCOMPLETE_DEBOUNCE_DELAY);
      }}
      inputValue={value}
      freeSolo
      autoComplete
      openOnFocus
      includeInputInList
      filterOptions={x => x}
      renderInput={params => {
        const translatedLabel = formatMessage({ id: label });
        return (
          <StyledTextField
            {...params}
            size="small"
            variant="outlined"
            placeholder={translatedLabel}
            inputProps={{ ...params.inputProps, 'aria-label': translatedLabel }}
          />
        );
      }}
      renderOption={(props, option) => {
        // eslint-disable-next-line react/prop-types
        const { key, ...optionProps } = props;
        return (
          <StyledAutoCompleteItem key={key} {...optionProps}>
            <span>{option[0]}</span>
            <Chip size="small" color="primary" label={option[1]} />
          </StyledAutoCompleteItem>
        );
      }}
    />
  );
};

SearchTextAutocomplete.propTypes = {
  ressourceType: PropTypes.string.isRequired,
  ressourceField: PropTypes.string.isRequired,
  ressourceFilter: PropTypes.shape({}).isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired
};

export const SearchSlider = ({
  label,
  helperText,
  onChange,
  value,
  icon,
  min = 0,
  max = 10,
  marks
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { formatMessage } = useIntl();
  const isLinearScale = !marks;
  // For non-linear scales, store real (scaled) values so descale conversion is consistent
  const defaultValues = useMemo(
    () =>
      isLinearScale
        ? [min, max]
        : [marks[0].scaledValue, marks[marks.length - 1].scaledValue],
    [isLinearScale, marks, min, max]
  );
  const [values, setValues] = useState(defaultValues);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (value === null) {
      setValues(defaultValues);
      setIsDirty(false);
    }
  }, [value, defaultValues]);

  const convert = (val, direction = 'scale') => {
    const fromKey = direction === 'scale' ? 'value' : 'scaledValue';
    const markUpIndex = marks.findIndex(mark => mark[fromKey] >= val);
    const markUp = marks[markUpIndex];
    if (markUp.scaledValue === val) return markUp.value;
    if (markUpIndex === 0) return 0;
    const markDown = marks[markUpIndex - 1];

    const ratio =
      (markUp.scaledValue - markDown.scaledValue) /
      (markUp.value - markDown.value);
    const distance = val - markDown[fromKey];
    if (direction === 'scale') return ratio * distance + markDown.scaledValue;
    return distance / ratio + markDown.value;
  };

  const handleClear = () => {
    setValues(defaultValues);
    setIsDirty(false);
    onChange(null);
  };

  return (
    <FormControl
      sx={{ flex: 1, minWidth: '200px', mx: 2, alignItems: 'center' }}>
      <FormLabel
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: isMobile ? -1 : 0
        }}>
        {icon}
        {label}
        <IconButton
          size="small"
          onClick={handleClear}
          aria-label={formatMessage({ id: 'clear filter' })}
          sx={{ visibility: isDirty ? 'visible' : 'hidden', p: 0.25 }}>
          <ClearIcon fontSize="small" />
        </IconButton>
      </FormLabel>
      {helperText && (
        <FormHelperText>
          <Translate>{helperText}</Translate>
        </FormHelperText>
      )}
      <Slider
        min={isLinearScale ? min : 0}
        max={isLinearScale ? max : 100}
        sx={{
          touchAction: 'pan-y',
          width: '100%',
          marginBottom: '8px',
          pointerEvents: 'none',
          '& .MuiSlider-thumb': { pointerEvents: 'auto' }
        }}
        value={isLinearScale ? values : values.map(e => convert(e, 'descale'))}
        scale={isLinearScale ? undefined : e => convert(e)}
        onChange={(_, newValue) => {
          const v = isLinearScale ? newValue : newValue.map(e => convert(e));
          const atDefault =
            v[0] === defaultValues[0] && v[1] === defaultValues[1];
          setIsDirty(!atDefault);
          onChange(atDefault ? null : v);
          setValues(isLinearScale ? newValue : v);
        }}
        marks={
          isLinearScale
            ? [
                { value: min, label: min },
                { value: max, label: max }
              ]
            : marks
        }
        valueLabelDisplay="auto"
        valueLabelFormat={
          isLinearScale
            ? undefined
            : v => (v <= 9999 ? v : `${(v / 1000).toFixed(0)}k`)
        }
      />
    </FormControl>
  );
};

SearchSlider.propTypes = {
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.arrayOf(PropTypes.number),
  icon: PropTypes.node,
  helperText: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
  marks: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.number,
      scaledValue: PropTypes.number
    })
  )
};

export const SearchBooleanToggle = ({ label, onChange, value, icon }) => {
  const { formatMessage } = useIntl();
  return (
    <FormControl sx={{ alignItems: 'center', mx: 1 }}>
      <FormLabel
        sx={{
          mb: 0.5,
          display: 'flex',
          alignItems: 'center'
        }}>
        {icon}
        <Translate>{label}</Translate>
      </FormLabel>
      <Box
        sx={{
          display: 'flex'
        }}>
        <Chip
          label={formatMessage({ id: 'Yes' })}
          size="small"
          clickable
          color={value === true ? 'primary' : 'default'}
          variant={value === true ? 'filled' : 'outlined'}
          icon={value === true ? <CheckIcon /> : undefined}
          onClick={() => onChange(value === true ? null : true)}
        />
        <Chip
          label={formatMessage({ id: 'No' })}
          size="small"
          clickable
          color={value === false ? 'primary' : 'default'}
          variant={value === false ? 'filled' : 'outlined'}
          icon={value === false ? <CheckIcon /> : undefined}
          onClick={() => onChange(value === false ? null : false)}
        />
      </Box>
    </FormControl>
  );
};

SearchBooleanToggle.propTypes = {
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  icon: PropTypes.node
};

export const SearchDivingTypes = ({ onChange, value, icon }) => (
  <SearchBooleanToggle
    label="Diving cave"
    onChange={onChange}
    value={value}
    icon={icon}
  />
);

SearchDivingTypes.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  icon: PropTypes.node
};

export const SearchSelect = ({
  label,
  optionDescription,
  options,
  value,
  onChange,
  sx = {}
}) => {
  const { formatMessage } = useIntl();
  return (
    <FormControl
      fullWidth
      size="small"
      variant="outlined"
      sx={{
        mx: '4px',
        '& .MuiOutlinedInput-root': {
          borderRadius: 6,
          backgroundColor: 'action.hover',
          '& fieldset': { border: 'none' },
          '&:hover': { backgroundColor: 'action.selected' },
          '&.Mui-focused': {
            backgroundColor: 'background.paper',
            boxShadow: theme => `0 0 0 2px ${theme.palette.primary.main}`
          }
        },
        ...sx
      }}>
      <Select
        value={value}
        onChange={event => onChange(event.target.value)}
        displayEmpty
        renderValue={v => {
          if (!v)
            return (
              <Typography component="span" color="text.secondary">
                {formatMessage({ id: label })}
              </Typography>
            );
          const found = options.find(e => e[0] === v)?.[1] ?? v;
          return typeof found === 'string' ? (
            <Translate>{found}</Translate>
          ) : (
            found
          );
        }}>
        <MenuItem key={-1} value="">
          <i>
            <Translate>{optionDescription}</Translate>
          </i>
        </MenuItem>
        {options.map(e => (
          <MenuItem key={e[0]} value={e[0]}>
            {typeof e[1] === 'string' ? <Translate>{e[1]}</Translate> : e[1]}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
SearchSelect.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  optionDescription: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({})),
  onChange: PropTypes.func.isRequired,
  sx: PropTypes.object
};

export const SearchMatchAllFieldsToogle = ({ isChecked, onChange }) => {
  const { formatMessage } = useIntl();
  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={isChecked}
          onChange={event => onChange(event.target.checked)}
        />
      }
      label={
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center'
          }}>
          <Translate>Matching all fields</Translate>
          <Tooltip
            title={formatMessage({
              id: 'Specify if the search results must match all the fields you typed above (default is yes).'
            })}
            enterTouchDelay={0}
            leaveTouchDelay={3000}>
            <HelpOutlineIcon
              fontSize="small"
              color="action"
              sx={{ verticalAlign: 'middle' }}
              onClick={e => e.preventDefault()}
            />
          </Tooltip>
        </Box>
      }
    />
  );
};

export const countActiveFilters = (filterState, includeKeys) => {
  const entries = includeKeys
    ? Object.entries(filterState).filter(([k]) => includeKeys.includes(k))
    : Object.entries(filterState);
  return entries.filter(([, v]) => v !== null && v !== '' && v !== undefined)
    .length;
};

const formatRangeValue = (key, value) => {
  const unit = key === 'cave.depth' || key === 'cave.length' ? ' m' : '';
  const fmt = v => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v);
  return `${fmt(value[0])} – ${fmt(value[1])}${unit}`;
};

export const ActiveFilterChips = ({
  filterState,
  query,
  queryLabel,
  onRemoveFilter,
  onClearQuery,
  labelMap,
  translatableValueFields,
  lockedKeys = [],
  valueLabels = {}
}) => {
  const { formatMessage } = useIntl();

  const chips = [];

  if (query) {
    chips.push({
      key: '__query__',
      label: `${formatMessage({ id: queryLabel || 'Query' })}: "${query}"`,
      onDelete: onClearQuery
    });
  }

  Object.entries(filterState).forEach(([key, value]) => {
    if (value === null || value === '' || value === undefined) return;
    const isLocked = lockedKeys.includes(key);
    const labelId = labelMap[key] || key;
    const translatedLabel = formatMessage({ id: labelId });
    let formattedValue;
    if (Array.isArray(value)) {
      formattedValue = formatRangeValue(key, value);
    } else if (typeof value === 'boolean') {
      formattedValue = formatMessage({ id: value ? 'yes' : 'no' });
    } else if (translatableValueFields?.has(key)) {
      formattedValue = formatMessage({
        id: String(value),
        defaultMessage: String(value)
      });
    } else {
      formattedValue = valueLabels[key] ?? String(value);
    }
    chips.push({
      key,
      label: `${translatedLabel}: ${formattedValue}`,
      onDelete: isLocked ? undefined : () => onRemoveFilter(key),
      isLocked
    });
  });

  if (chips.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5, mb: 0.5 }}>
      {chips.map(chip => (
        <Chip
          key={chip.key}
          icon={chip.isLocked ? <LockIcon fontSize="small" /> : undefined}
          label={chip.label}
          onDelete={chip.onDelete}
          size="small"
          color="primary"
          variant="outlined"
        />
      ))}
    </Box>
  );
};

ActiveFilterChips.propTypes = {
  filterState: PropTypes.shape({}).isRequired,
  query: PropTypes.string.isRequired,
  queryLabel: PropTypes.string,
  onRemoveFilter: PropTypes.func.isRequired,
  onClearQuery: PropTypes.func.isRequired,
  labelMap: PropTypes.shape({}).isRequired,
  translatableValueFields: PropTypes.instanceOf(Set),
  lockedKeys: PropTypes.arrayOf(PropTypes.string),
  valueLabels: PropTypes.shape({})
};

export const SearchFilterAccordion = ({
  filterCount,
  expanded,
  onExpandedChange,
  children
}) => (
  <Accordion
    expanded={expanded}
    onChange={(_, val) => onExpandedChange(val)}
    disableGutters
    elevation={0}
    sx={{
      width: '100%',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      '&:before': { display: 'none' }
    }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <FilterAltIcon color="primary" />
        <Typography variant="body1">
          <Translate>Advanced filters</Translate>
        </Typography>
        {filterCount > 0 && (
          <Chip
            size="small"
            label={filterCount}
            color="primary"
            sx={{ height: 20, fontSize: '0.4375rem' }}
          />
        )}
      </Box>
    </AccordionSummary>
    <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {children}
    </AccordionDetails>
  </Accordion>
);
SearchFilterAccordion.propTypes = {
  filterCount: PropTypes.number.isRequired,
  expanded: PropTypes.bool.isRequired,
  onExpandedChange: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired
};

export const SearchActionButtons = ({ onReset, showReset = true }) => (
  <CardActions
    sx={{ padding: 0.25, justifyContent: 'flex-end', width: '100%' }}>
    {showReset && (
      <Button
        type="button"
        variant="text"
        size="medium"
        color="inherit"
        startIcon={<ClearIcon />}
        onClick={() => onReset()}
        sx={{ color: 'text.secondary' }}>
        <Translate>Reset</Translate>
      </Button>
    )}

    <Button
      type="submit"
      variant="contained"
      size="medium"
      startIcon={<SearchIcon />}>
      <Translate>Search</Translate>
    </Button>
  </CardActions>
);

SearchActionButtons.propTypes = {
  onReset: PropTypes.func.isRequired,
  showReset: PropTypes.bool
};

SearchMatchAllFieldsToogle.propTypes = {
  onChange: PropTypes.func.isRequired,
  isChecked: PropTypes.bool.isRequired
};
