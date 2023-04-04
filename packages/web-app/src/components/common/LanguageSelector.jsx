import React from 'react';
import { Select, MenuItem, Input, CircularProgress } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import LanguageIcon from '@material-ui/icons/Translate';
import styled from 'styled-components';
import { isMobileOnly } from 'react-device-detect';
import { useDispatch, useSelector } from 'react-redux';
import { changeLocale } from '../../actions/Intl';

const StyledSelect = withStyles(
  theme => ({
    root: {
      paddingLeft: '10px',
      minWidth: isMobileOnly ? 'auto' : '150px',
      width: 'initial'
    },
    selectMenu: {
      fontSize: '16px',
      minHeight: '12px'
    },
    select: {
      '&:before,&:hover,&:after,,&:focus': {
        background: 'none'
      }
    },
    icon: {
      color: theme.palette.type === 'dark' ? 'white' : 'inherit'
    }
  }),
  { withTheme: true }
)(Select);

const Wrapper = styled.div`
  display: flex;
  align-items: center;
`;

const LanguageSelector = () => {
  const { isLoading, locale, AVAILABLE_LANGUAGES } = useSelector(
    state => state.intl
  );
  const dispatch = useDispatch();

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
      {isLoading ? (
        <CircularProgress size={25} color="white" />
      ) : (
        <LanguageIcon />
      )}
      <StyledSelect value={locale} onChange={handleChange} input={<Input />}>
        {items}
      </StyledSelect>
    </Wrapper>
  );
};

export default LanguageSelector;
