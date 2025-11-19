import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { styled } from '@mui/material/styles';
import {
  Autocomplete,
  Chip,
  FormControl,
  TextField,
  Switch,
  Typography,
  FormLabel,
  FormHelperText,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CardActions
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { fetchFieldSearch } from '../../../actions/FieldSearch';
import Translate from '../../common/Translate';

const StyledForm = styled('form')`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 0;
`;

export const SearchForm = ({ children, onSubmit, title }) => (
  <StyledForm
    noValidate
    autoComplete="off"
    onSubmit={event => {
      event.preventDefault();
      onSubmit();
    }}>
    {!!title && (
      <Typography variant="h6">
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
  justify-content: space-evenly;
  align-items: center;
  width: 100%;

  @media (min-width: 550px) {
    > * {
      flex: 1 1 0px;
    }
  }
`;

const StyledFieldset = styled('fieldset')`
  border: 1px solid ${({ theme }) => theme.palette.primary.light};
  border-radius: ${({ theme }) => theme.shape.borderRadius};
  width: 100%;
  padding-bottom: 1em;
`;
const StyledLegend = styled('legend')`
  padding: 0 5px;
`;

export const SearchFieldset = ({ title, children, isMultiline = false }) => (
  <StyledFieldset>
    <StyledLegend>
      <Translate>{title}</Translate>
    </StyledLegend>
    {isMultiline ? (
      children
    ) : (
      <SearchFormContainer>{children}</SearchFormContainer>
    )}
  </StyledFieldset>
);
SearchFieldset.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  isMultiline: PropTypes.bool
};

const StyledTextField = styled(TextField)`
  flex: 1;
  margin: ${({ theme }) => theme.spacing(1)};
  min-width: 15rem;
  max-width: 30rem;
`;

export const SearchText = ({ label, value, onChange, type = 'text' }) => (
  <StyledTextField
    type={type}
    label={
      <span>
        <Translate>{label}</Translate>
      </span>
    }
    onChange={event => onChange(event.target.value)}
    value={value}
  />
);
SearchText.propTypes = {
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  type: PropTypes.string
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
  const [options, setOptions] = useState([]);
  // TODO Add debounce ?

  const updateOption = async query => {
    const filter = { ...ressourceFilter };
    if (filter[ressourceField]) delete filter[ressourceField];
    const r = await fetchFieldSearch({
      entity: ressourceType,
      field: ressourceField,
      filter,
      query
    });
    setOptions(r.hits);
  };

  return (
    <Autocomplete
      sx={{
        flex: 1,
        minWidth: '15rem',
        maxWidth: '30rem'
      }}
      options={options}
      getOptionLabel={o => (typeof o === 'string' ? o : o[0])}
      onOpen={async () => {
        setOptions([]);
        updateOption();
      }}
      onInputChange={(event, newInputValue) => {
        updateOption(newInputValue);
        onChange(newInputValue);
      }}
      inputValue={value}
      freeSolo
      autoComplete
      openOnFocus
      includeInputInList
      filterOptions={x => x}
      filterSelectedOptions
      renderInput={params => (
        <StyledTextField
          {...params}
          label={
            <span>
              <Translate>{label}</Translate>
            </span>
          }
        />
      )}
      renderOption={(props, option) => {
        // eslint-disable-next-line react/prop-types
        const { key, ...optionProps } = props;
        return (
          <StyledAutoCompleteItem key={key} {...optionProps}>
            <span>{option[0]}</span>
            <Chip size="small" label={option[1]} />
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
  min = 0,
  max = 10,
  marks
}) => {
  const [isEnabled, setIsEnabled] = useState(false);

  const isLinearScale = !marks;
  const defaultValues = isLinearScale
    ? [min, max]
    : [marks[0].value, marks[marks.length - 1].value];
  const [previousValues, setPreviousValues] = useState(defaultValues);

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

  return (
    <FormControl sx={{ margin: '0 2em', alignItems: 'center' }}>
      <FormLabel>
        <Translate>{label}</Translate>
        <Switch
          checked={isEnabled}
          onChange={() => {
            onChange(isEnabled ? null : previousValues);
            setIsEnabled(!isEnabled);
          }}
        />
      </FormLabel>
      {helperText && (
        <FormHelperText>
          <Translate>{helperText}</Translate>
        </FormHelperText>
      )}
      <Slider
        min={isLinearScale ? min : 0}
        max={isLinearScale ? max : 100}
        sx={{ marginBottom: '8px' }}
        disabled={!isEnabled}
        value={
          isLinearScale
            ? previousValues
            : previousValues.map(e => convert(e, 'descale'))
        }
        scale={isLinearScale ? undefined : e => convert(e)}
        onChange={(_, newValue) => {
          const v = isLinearScale ? newValue : newValue.map(e => convert(e));
          onChange(v);
          setPreviousValues(v);
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

const SearchToggleButtonGroup = styled(ToggleButtonGroup)`
  padding: ${({ theme }) => theme.spacing(2)};
  align-items: center;
`;

export const SearchDivingTypes = ({ onChange, value }) => (
  <FormControl sx={{ alignItems: 'center' }}>
    <FormLabel>
      <Translate>Diving cave</Translate>
    </FormLabel>
    <SearchToggleButtonGroup
      value={value}
      exclusive
      onChange={(_event, newSelection) => onChange(newSelection)}>
      <ToggleButton value={''}>
        <Translate>all</Translate>
      </ToggleButton>
      <ToggleButton value>
        <Translate>yes</Translate>
      </ToggleButton>
      <ToggleButton value={false}>
        <Translate>no</Translate>
      </ToggleButton>
    </SearchToggleButtonGroup>
  </FormControl>
);

SearchDivingTypes.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
};

export const SearchSelect = ({
  label,
  optionDescription,
  options,
  value,
  onChange
}) => (
  <FormControl fullWidth variant="filled">
    <InputLabel>
      <Translate>{label}</Translate>
    </InputLabel>
    <Select value={value} onChange={event => onChange(event.target.value)}>
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
SearchSelect.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  optionDescription: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({})),
  onChange: PropTypes.func.isRequired
};

const SearchLabel = styled(FormLabel)`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const SearchMatchAllFieldsToogle = ({ isChecked, onChange }) => (
  <FormControl>
    <SearchLabel>
      <span>
        <Translate>
          {isChecked ? 'Matching all fields' : 'Matching at least one field'}
        </Translate>
      </span>
      <Switch
        checked={isChecked}
        onChange={event => onChange(event.target.checked)}
        value={isChecked}
      />
    </SearchLabel>
    <FormHelperText>
      <Translate>
        Specify if the search results must match all the fields you typed above
        (default is yes).
      </Translate>
    </FormHelperText>
  </FormControl>
);

export const SearchActionButtons = ({ onReset }) => (
  <CardActions sx={{ padding: 0, marginTop: '1em' }}>
    <Button type="submit" variant="contained">
      <SearchIcon />
      <Translate>Search</Translate>
    </Button>

    <Button type="button" variant="outlined" onClick={() => onReset()}>
      <ClearIcon />
      <Translate>Reset</Translate>
    </Button>
  </CardActions>
);

SearchActionButtons.propTypes = {
  onReset: PropTypes.func.isRequired
};

SearchMatchAllFieldsToogle.propTypes = {
  onChange: PropTypes.func.isRequired,
  isChecked: PropTypes.bool.isRequired
};
