import React from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@mui/material';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';
import AuthorLink from '../AuthorLink/index';
import authorType from '../../../types/author.type';

const DateSpan = styled(Typography)`
  color: ${({ theme }) => theme.palette.secondaryTextColor};
  margin-left: 4px;
`;
const AuthorAndDate = ({
  author,
  textColor = 'textPrimary',
  date,
  verb,
  withHours = false
}) => {
  const { formatDate } = useIntl();
  return (
    <Typography component="span" variant="caption" color={textColor}>
      <AuthorLink author={author} verb={verb} />
      {date && (
        <DateSpan variant="caption">
          {formatDate(date, {
            year: '2-digit',
            month: 'numeric',
            day: 'numeric',
            hour: withHours ? 'numeric' : undefined,
            minute: withHours ? 'numeric' : undefined,
            second: withHours ? 'numeric' : undefined
          })}
        </DateSpan>
      )}
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
  verb: PropTypes.string,
  withHours: PropTypes.bool
};

export default AuthorAndDate;
