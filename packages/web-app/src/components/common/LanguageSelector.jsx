import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Select, MenuItem, Input, CircularProgress } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Translate';
import { styled } from '@mui/material/styles';
import { isMobileOnly } from 'react-device-detect';
import { useDispatch, useSelector } from 'react-redux';
import { changeLocale } from '../../actions/Intl';

const StyledSelect = styled(Select)(({ theme }) => ({
  paddingLeft: '10px',
  minWidth: isMobileOnly ? 'auto' : '150px',
  flexGrow: 1,
  '& .MuiSelect-select': {
    fontSize: 'inherit',
    minHeight: '12px',
    '&:before, &:hover, &:after, &:focus': {
      background: 'none'
    }
  },
  '& .MuiSelect-icon': {
    color: theme.palette.mode === 'dark' ? 'white' : 'inherit'
  }
}));

const Wrapper = styled('div')`
  display: flex;
  align-items: center;
  width: 100%;
`;

const LanguageSelector = ({ iconColor = 'inherit', hideIcon = false }) => {
  const { isLoading, locale, AVAILABLE_LANGUAGES } = useSelector(
    state => state.intl
  );
  const dispatch = useDispatch();
  const localeDirection = AVAILABLE_LANGUAGES[locale]?.direction;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = localeDirection === 'rtl' ? 'rtl' : 'ltr';
  }, [locale, localeDirection]);

  const handleChange = event => {
    const { value } = event.target;
    if (value !== locale) {
      window.localStorage.setItem('selectedLanguage', value);
      dispatch(changeLocale(value));
    }
  };

  const items = Object.keys(AVAILABLE_LANGUAGES).map(id => (
    <MenuItem key={id} value={id}>
      {AVAILABLE_LANGUAGES[id].nativeName}
    </MenuItem>
  ));

  return (
    <Wrapper>
      {!hideIcon && (
        isLoading
          ? <CircularProgress size={25} color="inherit" />
          : <LanguageIcon color={iconColor} />
      )}
      <StyledSelect value={locale} onChange={handleChange} input={<Input />}>
        {items}
      </StyledSelect>
    </Wrapper>
  );
};

LanguageSelector.propTypes = {
  iconColor: PropTypes.string,
  hideIcon: PropTypes.bool
};

export default LanguageSelector;
