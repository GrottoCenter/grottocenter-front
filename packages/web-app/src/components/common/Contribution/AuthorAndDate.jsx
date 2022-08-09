import React from 'react';
import { isNil } from 'ramda';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import AuthorLink from '../AuthorLink/index';
import authorType from '../../../types/author.type';

const AuthorAndDate = ({ author, textColor, date, verb }) => {
  const { formatDate } = useIntl();
  return (
    <Typography component="span" variant="caption" color={textColor}>
      <AuthorLink author={author} verb={verb} />
      {`${
        !isNil(date)
          ? ` - ${formatDate(date, {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric'
            })}`
          : ''
      }`}
    </Typography>
  );
};

AuthorAndDate.propTypes = {
  author: authorType,
  date: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
  textColor: PropTypes.oneOf([
    'textPrimary',
    'textSecondary',
    'inherit',
    'initial',
    'primary',
    'secondary',
    'error'
  ]),
  verb: PropTypes.string
};

AuthorAndDate.defaultProps = {
  textColor: 'textPrimary'
};

export default AuthorAndDate;
