import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Typography } from '@mui/material';
import Linkify from 'linkify-react';
import MultilinesTypography from '../MultilinesTypography';
import AuthorAndDate from './AuthorAndDate';
import authorType from '../../../types/author.type';
import linkifyOptions from '../../../helpers/linkifyOptions';

const Contribution = ({
  author,
  body,
  dateInscription,
  reviewer,
  dateReviewed,
  language,
  withHours = false,
  isDeleted = false,
  isDeletedWithHeader = false,
  hideAttribution = false
}) => {
  const { formatMessage } = useIntl();

  let bodyStyle;
  if (isDeleted || isDeletedWithHeader)
    bodyStyle = { fontStyle: 'italic', opacity: 0.6 };
  return (
    <>
      {body && isDeletedWithHeader && (
        <Typography
          variant="body1"
          component="span"
          noWrap
          sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
          [{formatMessage({ id: 'deleted' })}]&nbsp;
        </Typography>
      )}
      {body && (
        <MultilinesTypography variant="body1" component="span" sx={bodyStyle}>
          <Linkify options={linkifyOptions}>{body}</Linkify>
        </MultilinesTypography>
      )}
      {!hideAttribution && (author || reviewer || language) && (
        <Typography component="div" variant="caption" color="text.secondary" sx={{ mt: 2 }}>
          {author && (
            <AuthorAndDate
              author={author}
              date={dateInscription}
              textColor="inherit"
              withHours={withHours}
            />
          )}
          {author && reviewer && ' · '}
          {reviewer && (
            <AuthorAndDate
              author={reviewer}
              date={dateReviewed}
              verb={author ? 'Updated' : ''}
              textColor="inherit"
              withHours={withHours}
            />
          )}
          {(author || reviewer) && language && ' · '}
          {language &&
            `${formatMessage({ id: 'Language' })} : ${language.toUpperCase()}`}
        </Typography>
      )}
    </>
  );
};

Contribution.propTypes = {
  author: authorType,
  body: PropTypes.string,
  dateInscription: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string
  ]),
  reviewer: authorType,
  dateReviewed: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string
  ]),
  language: PropTypes.string,
  withHours: PropTypes.bool,
  isDeleted: PropTypes.bool,
  isDeletedWithHeader: PropTypes.bool,
  hideAttribution: PropTypes.bool
};

export default Contribution;
