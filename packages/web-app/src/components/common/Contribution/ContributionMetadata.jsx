import PropTypes from 'prop-types';
import { Typography } from '@mui/material';
import { useIntl } from 'react-intl';

import authorType from '@/types/author.type';
import AuthorAndDate from './AuthorAndDate';

const languageType = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    refName: PropTypes.string
  })
]);

const getLanguageLabel = language => {
  if (!language) return null;
  if (typeof language === 'string') return language.toLocaleUpperCase();
  const value = language.refName ?? language.name ?? language.id;
  return value ? String(value) : null;
};

const ContributionMetadata = ({
  createdBy,
  createdAt,
  updatedBy,
  updatedAt,
  language,
  creationVerb = 'Created',
  updateVerb = 'Updated',
  withHours = false,
  sx = {}
}) => {
  const { formatMessage } = useIntl();
  const languageLabel = getLanguageLabel(language);

  if (!createdBy && !updatedBy && !languageLabel) return null;

  return (
    <Typography
      component="div"
      variant="caption"
      color="text.secondary"
      sx={{ mt: 1, ...sx }}>
      {createdBy && (
        <AuthorAndDate
          author={createdBy}
          date={createdAt}
          verb={creationVerb}
          textColor="inherit"
          withHours={withHours}
        />
      )}
      {createdBy && updatedBy && ' · '}
      {updatedBy && (
        <AuthorAndDate
          author={updatedBy}
          date={updatedAt}
          verb={updateVerb}
          textColor="inherit"
          withHours={withHours}
        />
      )}
      {(createdBy || updatedBy) && languageLabel && ' · '}
      {languageLabel &&
        `${formatMessage({ id: 'Language' })} : ${languageLabel}`}
    </Typography>
  );
};

ContributionMetadata.propTypes = {
  createdBy: authorType,
  createdAt: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string,
    PropTypes.number
  ]),
  updatedBy: authorType,
  updatedAt: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string,
    PropTypes.number
  ]),
  language: languageType,
  creationVerb: PropTypes.string,
  updateVerb: PropTypes.string,
  withHours: PropTypes.bool,
  sx: PropTypes.shape({})
};

export default ContributionMetadata;
