import PropTypes from 'prop-types';
import { Typography } from '@mui/material';
import { useIntl } from 'react-intl';
import AuthorLink from '../AuthorLink/index';
import authorType from '../../../types/author.type';

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
        <>
          {' '}
          <Typography component="span" variant="caption" color="inherit">
            {formatDate(date, {
              year: '2-digit',
              month: 'numeric',
              day: 'numeric',
              hour: withHours ? 'numeric' : undefined,
              minute: withHours ? 'numeric' : undefined,
              second: withHours ? 'numeric' : undefined
            })}
          </Typography>
        </>
      )}
    </Typography>
  );
};

AuthorAndDate.propTypes = {
  author: authorType,
  date: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string,
    PropTypes.number
  ]),
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
